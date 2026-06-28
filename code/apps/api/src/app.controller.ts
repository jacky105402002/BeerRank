import { Body, Controller, Get, NotFoundException, Param, Post, Query, Req } from "@nestjs/common";
import { ApiBody, ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import type {
  BeerMatchRequestDto,
  CreateBeerRequestDto,
  CreateBeerResponseDto,
  CreateCommentRequestDto,
  CreateCommentResponseDto,
  CreateReviewRequestDto,
  CreateReviewResponseDto,
  UploadReviewPhotosRequestDto,
  UploadReviewPhotosResponseDto
} from "./types";
import {
  beerDetail,
  beers,
  commentsByPostId,
  leaderboard,
  posts,
  profiles
} from "./mock-data";
import { AiMatchService } from "./ai-match.service";
import { AuthService, type RequestLike } from "./auth.service";
import { DatabaseService } from "./database.service";
import { ReadService } from "./read.service";
import { StorageService } from "./storage.service";
import { WriteService } from "./write.service";

@ApiTags("MVP Mock API")
@Controller()
export class AppController {
  constructor(
    private readonly aiMatchService: AiMatchService,
    private readonly authService: AuthService,
    private readonly database: DatabaseService,
    private readonly readService: ReadService,
    private readonly storageService: StorageService,
    private readonly writeService: WriteService
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

  @ApiOperation({ summary: "Get the current user resolved by the temporary auth foundation" })
  @ApiHeader({
    name: "x-beerrank-profile-id",
    required: false,
    description: "Temporary MVP auth header. Defaults to MOCK_PROFILE_ID or user-jordan."
  })
  @Get("me")
  async me(@Req() request: RequestLike) {
    if (this.database.isConfigured()) {
      return {
        user: await this.authService.getCurrentProfile(request)
      };
    }

    const profileId = this.authService.resolveProfileId(request);
    const profile = profiles.find((item) => item.id === profileId) ?? profiles[2];

    return {
      user: profile
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

  @ApiOperation({ summary: "Search existing Beer by name, brewery, or style" })
  @Get("beers")
  async searchBeers(@Query("query") query?: string) {
    if (this.readService.isReady()) {
      return {
        items: await this.readService.searchBeers(query)
      };
    }

    const normalizedQuery = query?.trim().toLowerCase();
    const items = normalizedQuery
      ? beers.filter((beer) => {
          return (
            beer.name.toLowerCase().includes(normalizedQuery) ||
            beer.brewery.name.toLowerCase().includes(normalizedQuery) ||
            beer.style.toLowerCase().includes(normalizedQuery)
          );
        })
      : beers;

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

  @ApiOperation({ summary: "Create a Beer draft when AI and manual search cannot find a match" })
  @ApiHeader({
    name: "x-beerrank-profile-id",
    required: false,
    description: "Temporary MVP auth header. Used as the Beer draft creator."
  })
  @ApiBody({
    schema: {
      example: {
        name: "Morning Haze IPA",
        breweryName: "Cloudburst Brewing",
        style: "IPA",
        abv: 6.5,
        imageUrl: "https://example.com/beer-photo.jpg"
      }
    }
  })
  @Post("beers")
  async createBeer(
    @Body() body: CreateBeerRequestDto,
    @Req() request: RequestLike
  ): Promise<CreateBeerResponseDto> {
    const profileId = this.authService.resolveProfileId(request);

    if (this.writeService.isReady()) {
      return this.writeService.createBeer(body, profileId);
    }

    const brewery = {
      id: `brewery-mock-${Date.now()}`,
      name: body.breweryName,
      country: undefined
    };
    const existingBeer = beers.find((beer) => {
      return beer.name.toLowerCase() === body.name.toLowerCase() &&
        beer.brewery.name.toLowerCase() === body.breweryName.toLowerCase();
    });

    if (existingBeer) {
      return {
        beer: existingBeer,
        status: "confirmed",
        created: false
      };
    }

    return {
      beer: {
        id: `beer-mock-${Date.now()}`,
        name: body.name,
        brewery,
        style: body.style,
        abv: body.abv,
        imageUrl: body.imageUrl
      },
      status: "needs_review",
      created: true
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

  @ApiOperation({ summary: "Create a comment or one-level reply on a review post" })
  @ApiHeader({
    name: "x-beerrank-profile-id",
    required: false,
    description: "Temporary MVP auth header. Defaults to MOCK_PROFILE_ID or user-jordan."
  })
  @ApiBody({
    schema: {
      example: {
        body: "This looks great fresh.",
        parentCommentId: "comment-citra-1"
      }
    }
  })
  @Post("posts/:postId/comments")
  async createComment(
    @Param("postId") postId: string,
    @Body() body: CreateCommentRequestDto,
    @Req() request: RequestLike
  ): Promise<CreateCommentResponseDto> {
    const profileId = this.authService.resolveProfileId(request);

    if (this.writeService.isReady()) {
      return this.writeService.createComment(postId, body, profileId);
    }

    const profile = profiles.find((item) => item.id === profileId) ?? profiles[2];

    return {
      comment: {
        id: `comment-mock-${Date.now()}`,
        postId,
        author: {
          id: profile.id,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl
        },
        parentCommentId: body.parentCommentId,
        body: body.body,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        viewerHasLiked: false,
        replies: []
      }
    };
  }

  @ApiOperation({ summary: "Suggest Beer candidates from the review draft" })
  @ApiHeader({
    name: "x-beerrank-profile-id",
    required: false,
    description: "Temporary MVP auth header. Used to audit AI match suggestions."
  })
  @ApiBody({
    schema: {
      example: {
        photoUrls: ["https://example.com/beer-photo.jpg"],
        beerName: "Space Dust IPA",
        breweryName: "Elysian Brewing",
        styleHint: "Double IPA",
        locale: "zh-TW",
        mode: "high"
      }
    }
  })
  @Post("ai/beer-match")
  matchBeer(
    @Body() body: BeerMatchRequestDto,
    @Req() request: RequestLike
  ) {
    const profileId = this.authService.resolveProfileId(request);
    return this.aiMatchService.matchBeer(body, profileId);
  }

  @ApiOperation({ summary: "Upload review photos and return ordered public photo URLs" })
  @ApiBody({
    schema: {
      example: {
        files: [
          {
            fileName: "beer.jpg",
            mimeType: "image/jpeg",
            dataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."
          }
        ]
      }
    }
  })
  @Post("uploads/review-photos")
  uploadReviewPhotos(@Body() body: UploadReviewPhotosRequestDto): UploadReviewPhotosResponseDto {
    return this.storageService.uploadReviewPhotos(body);
  }

  @ApiOperation({ summary: "Publish a review post" })
  @ApiHeader({
    name: "x-beerrank-profile-id",
    required: false,
    description: "Temporary MVP auth header. Defaults to MOCK_PROFILE_ID or user-jordan."
  })
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
  async createReview(
    @Body() body: CreateReviewRequestDto,
    @Req() request: RequestLike
  ): Promise<CreateReviewResponseDto> {
    const profileId = this.authService.resolveProfileId(request);

    if (this.writeService.isReady()) {
      return this.writeService.createReview(body, profileId);
    }

    const beer = beers.find((item) => item.id === body.beerId);
    if (!beer) {
      throw new NotFoundException("Beer not found");
    }

    const photoUrls = body.photoUrls.slice(0, 3);
    const profile = profiles.find((item) => item.id === profileId) ?? profiles[2];
    const leaderboardEligible = body.visibility === "public" && photoUrls.length > 0 && body.rating > 0;
    const post = {
      id: `post-mock-${Date.now()}`,
      author: profile,
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
