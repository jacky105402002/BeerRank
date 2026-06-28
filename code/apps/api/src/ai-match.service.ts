import { BadRequestException, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { DatabaseService } from "./database.service";
import { beers, highConfidenceMatch, lowConfidenceMatch, noResultMatch } from "./mock-data";
import type {
  AiProvider,
  BeerMatchCandidateDto,
  BeerMatchRequestDto,
  BeerMatchResponseDto,
  MatchConfidenceLevel,
  MatchReasonDto
} from "./types";

type AiMatchAdapter = {
  readonly provider: AiProvider;
  matchBeer(request: BeerMatchRequestDto): Promise<BeerMatchResponseDto>;
};

type OpenAiCatalogCandidate = {
  beerId?: string;
  confidenceScore?: number;
  confidenceLevel?: MatchConfidenceLevel;
  reasons?: MatchReasonDto[];
};

type OpenAiParsedResponse = {
  candidates?: OpenAiCatalogCandidate[];
};

type OpenAiResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
};

type AuditCandidate = {
  beerId: string | null;
  confidenceScore: number;
  confidenceLevel: MatchConfidenceLevel;
  reasons: MatchReasonDto[];
};

@Injectable()
export class AiMatchService {
  private readonly adapter: AiMatchAdapter;

  constructor(private readonly database: DatabaseService) {
    this.adapter = this.createAdapter(process.env.AI_PROVIDER);
  }

  async matchBeer(request: BeerMatchRequestDto, profileId: string): Promise<BeerMatchResponseDto> {
    this.validateRequest(request);
    const response = await this.adapter.matchBeer(request);
    await this.persistSuggestions(request, response, profileId);
    return response;
  }

  private createAdapter(provider: string | undefined): AiMatchAdapter {
    if (provider === "openai") {
      return new OpenAiVisionMatchAdapter();
    }

    return new MockAiMatchAdapter();
  }

  private validateRequest(request: BeerMatchRequestDto) {
    if (!Array.isArray(request.photoUrls)) {
      throw new BadRequestException("photoUrls must be an array");
    }

    if (request.photoUrls.length > 3) {
      throw new BadRequestException("AI matching supports at most 3 review photos");
    }

    if (!request.photoUrls.length && !request.beerName?.trim() && !request.breweryName?.trim() && !request.styleHint) {
      throw new BadRequestException("At least one photo or beer hint is required");
    }
  }

  private async persistSuggestions(
    request: BeerMatchRequestDto,
    response: BeerMatchResponseDto,
    profileId: string
  ) {
    if (!this.database.isConfigured()) {
      return;
    }

    const candidates = this.toAuditCandidates(response);

    for (const candidate of candidates) {
      await this.database.query(
        `
          insert into beer_match_suggestions (
            id,
            profile_id,
            beer_id,
            provider,
            status,
            confidence_score,
            confidence_level,
            reasons,
            raw_response
          )
          values ($1, $2, $3, $4, 'suggested', $5, $6, $7::jsonb, $8::jsonb)
        `,
        [
          `match-${randomUUID()}`,
          profileId,
          candidate.beerId,
          this.adapter.provider,
          candidate.confidenceScore,
          candidate.confidenceLevel,
          JSON.stringify(candidate.reasons),
          JSON.stringify({
            request,
            response,
            requestId: response.requestId,
            provider: this.adapter.provider
          })
        ]
      );
    }
  }

  private toAuditCandidates(response: BeerMatchResponseDto): AuditCandidate[] {
    if (response.candidates.length === 0) {
      return [
        {
          beerId: null,
          confidenceScore: 0,
          confidenceLevel: "none",
          reasons: []
        }
      ];
    }

    return response.candidates.map((candidate) => ({
      beerId: candidate.beer.id,
      confidenceScore: candidate.confidenceScore,
      confidenceLevel: candidate.confidenceLevel,
      reasons: candidate.reasons
    }));
  }
}

class MockAiMatchAdapter implements AiMatchAdapter {
  readonly provider = "mock" as const;

  async matchBeer(request: BeerMatchRequestDto): Promise<BeerMatchResponseDto> {
    const template = this.selectTemplate(request);

    return {
      requestId: `match-${randomUUID()}`,
      status: template.status,
      candidates: this.rankCandidates(template.candidates, request)
    };
  }

  private selectTemplate(request: BeerMatchRequestDto): BeerMatchResponseDto {
    if (request.mode === "none") {
      return noResultMatch;
    }

    if (request.mode === "low" || request.photoUrls.length === 0) {
      return lowConfidenceMatch;
    }

    return highConfidenceMatch;
  }

  private rankCandidates(candidates: BeerMatchCandidateDto[], request: BeerMatchRequestDto): BeerMatchCandidateDto[] {
    if (request.beerName || request.breweryName || request.styleHint) {
      const beerName = request.beerName?.toLowerCase() ?? "";
      const breweryName = request.breweryName?.toLowerCase() ?? "";
      const styleHint = request.styleHint?.toLowerCase() ?? "";
      const matchedBeer =
        beers.find((beer) => beerName.includes(beer.name.toLowerCase())) ??
        beers.find((beer) => breweryName.includes(beer.brewery.name.toLowerCase())) ??
        beers.find((beer) => styleHint === beer.style.toLowerCase());

      if (matchedBeer) {
        return [
          {
            beer: matchedBeer,
            confidenceScore: 0.86,
            confidenceLevel: "high",
            reasons: [
              { type: "user_input", label: "User input matched Beer catalog", confidence: 0.86 },
              { type: "style", label: `Style candidate: ${matchedBeer.style}`, confidence: 0.74 }
            ]
          },
          ...candidates.filter((candidate) => candidate.beer.id !== matchedBeer.id)
        ];
      }
    }

    return candidates;
  }
}

class OpenAiVisionMatchAdapter implements AiMatchAdapter {
  readonly provider = "openai" as const;

  async matchBeer(request: BeerMatchRequestDto): Promise<BeerMatchResponseDto> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new BadRequestException("OPENAI_API_KEY is required when AI_PROVIDER=openai");
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: this.buildPrompt(request)
              },
              ...request.photoUrls.map((photoUrl) => ({
                type: "input_image",
                image_url: photoUrl,
                detail: "auto"
              }))
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const message = await response.text();
      throw new BadRequestException(`OpenAI match failed: ${message.slice(0, 500)}`);
    }

    const data = await response.json() as OpenAiResponse;
    return this.toBeerMatchResponse(data);
  }

  private buildPrompt(request: BeerMatchRequestDto): string {
    return [
      "You are BeerRank's beer matching assistant.",
      "Match the user's beer photo and text hints to the Beer catalog only.",
      "Never invent a new Beer id. If the catalog does not match, return an empty candidates array.",
      "Return JSON only with this shape: {\"candidates\":[{\"beerId\":\"...\",\"confidenceScore\":0.0,\"confidenceLevel\":\"high|medium|low\",\"reasons\":[{\"type\":\"photo|label_text|beer_name|brewery|style|user_input\",\"label\":\"...\",\"confidence\":0.0}]}]}",
      `Locale: ${request.locale ?? "en"}`,
      `User hints: ${JSON.stringify({
        beerName: request.beerName,
        breweryName: request.breweryName,
        styleHint: request.styleHint
      })}`,
      `Catalog: ${JSON.stringify(beers.map((beer) => ({
        id: beer.id,
        name: beer.name,
        brewery: beer.brewery.name,
        style: beer.style,
        abv: beer.abv
      })))}`
    ].join("\n");
  }

  private toBeerMatchResponse(data: OpenAiResponse): BeerMatchResponseDto {
    const parsed = this.parseOpenAiJson(data);
    const candidates = (parsed.candidates ?? [])
      .map((candidate) => this.toCandidate(candidate))
      .filter((candidate): candidate is BeerMatchCandidateDto => Boolean(candidate))
      .slice(0, 3);

    return {
      requestId: `match-${randomUUID()}`,
      status: this.toStatus(candidates),
      candidates
    };
  }

  private parseOpenAiJson(data: OpenAiResponse): OpenAiParsedResponse {
    const text = data.output_text ?? data.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text ?? "")
      .join("\n");

    if (!text?.trim()) {
      return { candidates: [] };
    }

    const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    try {
      return JSON.parse(cleaned) as OpenAiParsedResponse;
    } catch {
      return { candidates: [] };
    }
  }

  private toCandidate(candidate: OpenAiCatalogCandidate): BeerMatchCandidateDto | undefined {
    const beer = beers.find((item) => item.id === candidate.beerId);
    if (!beer) {
      return undefined;
    }

    const confidenceScore = this.clampConfidence(candidate.confidenceScore);
    const confidenceLevel = candidate.confidenceLevel ?? this.toConfidenceLevel(confidenceScore);

    return {
      beer,
      confidenceScore,
      confidenceLevel,
      reasons: this.normalizeReasons(candidate.reasons)
    };
  }

  private normalizeReasons(reasons: MatchReasonDto[] | undefined): MatchReasonDto[] {
    if (!Array.isArray(reasons) || reasons.length === 0) {
      return [
        {
          type: "photo",
          label: "AI matched the photo and hints to the catalog",
          confidence: 0.5
        }
      ];
    }

    return reasons.slice(0, 5).map((reason) => ({
      type: reason.type,
      label: reason.label,
      confidence: this.clampConfidence(reason.confidence)
    }));
  }

  private toStatus(candidates: BeerMatchCandidateDto[]): BeerMatchResponseDto["status"] {
    if (candidates.length === 0) {
      return "no_results";
    }

    if (candidates[0].confidenceLevel === "high") {
      return "high_confidence";
    }

    if (candidates.length > 1) {
      return "multiple_candidates";
    }

    return "low_confidence";
  }

  private toConfidenceLevel(score: number): MatchConfidenceLevel {
    if (score >= 0.78) {
      return "high";
    }

    if (score >= 0.55) {
      return "medium";
    }

    return "low";
  }

  private clampConfidence(value: number | undefined): number {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return 0.5;
    }

    return Math.max(0, Math.min(1, value));
  }
}
