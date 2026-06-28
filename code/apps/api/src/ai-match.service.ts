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
      return new NotConfiguredOpenAiAdapter();
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

class NotConfiguredOpenAiAdapter implements AiMatchAdapter {
  readonly provider = "openai" as const;

  async matchBeer(): Promise<BeerMatchResponseDto> {
    throw new BadRequestException("AI_PROVIDER=openai is not configured yet. Use AI_PROVIDER=mock for MVP.");
  }
}
