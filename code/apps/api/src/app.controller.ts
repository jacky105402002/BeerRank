import { Body, Controller, Get, NotFoundException, Param, Post, Query } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import type {
  BeerMatchRequestDto,
  CreateReviewRequestDto,
  CreateReviewResponseDto
} from "./types";
import {
  beerDetail,
  beers,
  commentsByPostId,
  highConfidenceMatch,
  leaderboard,
  lowConfidenceMatch,
  noResultMatch,
  posts,
  profiles
} from "./mock-data";
import { DatabaseService } from "./database.service";
import { ReadService } from "./read.service";

@ApiTags("MVP Mock API")
@Controller()
export class AppController {
  constructor(
    private readonly database: DatabaseService,
    private readonly readService: ReadService
  ) {}

  @ApiOperation({ summary: "Check mock API and database health" })
  @Get("health")
  async health() {
    const db = await this.database.health();

    return {
      ok: db.configured ? db.connected : true,
      service: "BeerRank API",
      mode: "mock",
      db
    };
  }

  @ApiOperation({ summary: "Get the current mock user" })
  @Get("me")
  me() {
    return {
      user: profiles[2]
    };
  }

  @ApiOperation({ summary: "List public feed review posts" })
  @Get("feed")
  async feed() {
    if (this.readService.isReady()) {
      return {
        items: await this.readService.getFeed()
      };
    }

    return {
      items: posts
    };
  }

  @ApiOperation({ summary: "List leaderboard rows, optionally filtered by style" })
  @Get("leaderboard")
  async getLeaderboard(@Query("style") style?: string) {
    if (this.readService.isReady()) {
      return {
        items: await this.readService.getLeaderboard(style)
      };
    }

    const normalizedStyle = style?.toLowerCase();
    const items = normalizedStyle && normalizedStyle !== "all"
      ? leaderboard.filter((row) => row.beer.style.toLowerCase().includes(normalizedStyle))
      : leaderboard;

    return {
      items
    };
  }

  @ApiOperation({ summary: "Get Beer detail with public proof reviews" })
  @Get("beers/:beerId")
  async getBeerDetail(@Param("beerId") beerId: string) {
    if (this.readService.isReady()) {
      return this.readService.getBeerDetail(beerId);
    }

    if (beerDetail.beer.id === beerId) {
      return beerDetail;
    }

    const beer = beers.find((item) => item.id === beerId);
    if (!beer) {
      throw new NotFoundException("Beer not found");
    }

    return {
      ...beerDetail,
      beer,
      proofReviews: []
    };
  }

  @ApiOperation({ summary: "Get a post comment thread" })
  @Get("posts/:postId/comments")
  async getComments(@Param("postId") postId: string) {
    if (this.readService.isReady()) {
      return {
        items: await this.readService.getComments(postId)
      };
    }

    return {
      items: commentsByPostId[postId] ?? []
    };
  }

  @ApiOperation({ summary: "Suggest Beer candidates from the review draft" })
  @ApiBody({
    schema: {
      example: {
        photoUrls: ["https://example.com/beer-photo.jpg"],
        beerName: "Space Dust IPA",
        breweryName: "Elysian Brewing",
        styleHint: "Double IPA",
        mode: "high"
      }
    }
  })
  @Post("ai/beer-match")
  matchBeer(@Body() body: BeerMatchRequestDto) {
    if (body.mode === "none") {
      return noResultMatch;
    }

    if (body.mode === "low" || body.photoUrls.length === 0) {
      return lowConfidenceMatch;
    }

    return highConfidenceMatch;
  }

  @ApiOperation({ summary: "Publish a mock review post" })
  @ApiBody({
    schema: {
      example: {
        beerId: "beer-citra-ipa",
        photoUrls: ["https://example.com/beer-photo.jpg"],
        rating: 4.5,
        reviewText: "Crisp citrus aroma with a clean finish.",
        visibility: "public"
      }
    }
  })
  @Post("reviews")
  createReview(@Body() body: CreateReviewRequestDto): CreateReviewResponseDto {
    const beer = beers.find((item) => item.id === body.beerId);
    if (!beer) {
      throw new NotFoundException("Beer not found");
    }

    const photoUrls = body.photoUrls.slice(0, 3);
    const leaderboardEligible = body.visibility === "public" && photoUrls.length > 0 && body.rating > 0;
    const post = {
      id: `post-mock-${Date.now()}`,
      author: profiles[2],
      beer,
      primaryPhotoUrl: photoUrls[0] ?? "",
      photoUrls,
      rating: body.rating,
      reviewText: body.reviewText,
      visibility: body.visibility,
      createdAt: new Date().toISOString(),
      likeCount: 0,
      commentCount: 0,
      viewerHasLiked: false,
      viewerHasSaved: false,
      isRankingEligible: leaderboardEligible
    };

    return {
      post,
      leaderboardEligible
    };
  }
}
