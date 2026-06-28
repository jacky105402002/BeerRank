import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { DatabaseService } from "./database.service";
import { ReadService } from "./read.service";
import type {
  BeerStyle,
  BeerSummaryDto,
  CommentDto,
  CreateBeerRequestDto,
  CreateBeerResponseDto,
  CreateCommentRequestDto,
  CreateCommentResponseDto,
  CreateReviewRequestDto,
  CreateReviewResponseDto
} from "./types";

@Injectable()
export class WriteService {
  constructor(
    private readonly database: DatabaseService,
    private readonly readService: ReadService
  ) {}

  isReady() {
    return this.database.isConfigured();
  }

  async createBeer(body: CreateBeerRequestDto, currentProfileId: string): Promise<CreateBeerResponseDto> {
    this.validateBeer(body);

    const breweryName = body.breweryName.trim();
    const beerName = body.name.trim();
    const breweryId = `brewery-${randomUUID()}`;
    const beerId = `beer-${randomUUID()}`;
    let resultBeerId = beerId;
    let created = true;
    let status: CreateBeerResponseDto["status"] = "needs_review";

    await this.database.transaction(async (client) => {
      const profile = await client.query("select id from profiles where id = $1", [currentProfileId]);
      if (profile.rowCount === 0) {
        throw new NotFoundException("Current profile not found");
      }

      const existingBrewery = await client.query<{ id: string }>(
        "select id from breweries where lower(name) = lower($1)",
        [breweryName]
      );
      const resolvedBreweryId = existingBrewery.rows[0]?.id ?? breweryId;

      if (!existingBrewery.rows[0]) {
        await client.query(
          `
            insert into breweries (id, name)
            values ($1, $2)
          `,
          [resolvedBreweryId, breweryName]
        );
      }

      const existingBeer = await client.query<{ id: string; status: CreateBeerResponseDto["status"] }>(
        "select id, status from beers where brewery_id = $1 and lower(name) = lower($2)",
        [resolvedBreweryId, beerName]
      );

      if (existingBeer.rows[0]) {
        resultBeerId = existingBeer.rows[0].id;
        status = existingBeer.rows[0].status;
        created = false;
        return;
      }

      await client.query(
        `
          insert into beers (
            id,
            brewery_id,
            name,
            style,
            abv,
            image_url,
            status,
            created_by_profile_id
          )
          values ($1, $2, $3, $4, $5, $6, 'needs_review', $7)
        `,
        [
          resultBeerId,
          resolvedBreweryId,
          beerName,
          body.style,
          body.abv ?? null,
          body.imageUrl?.trim() || null,
          currentProfileId
        ]
      );
    });

    const beer = await this.getBeerSummary(resultBeerId);

    return {
      beer,
      status,
      created
    };
  }

  async createReview(body: CreateReviewRequestDto, currentProfileId: string): Promise<CreateReviewResponseDto> {
    this.validateReview(body);

    const reviewId = `review-${randomUUID()}`;
    const photoUrls = body.photoUrls.slice(0, 3);

    await this.database.transaction(async (client) => {
      const beer = await client.query("select id from beers where id = $1", [body.beerId]);
      if (beer.rowCount === 0) {
        throw new NotFoundException("Beer not found");
      }

      const profile = await client.query("select id from profiles where id = $1", [currentProfileId]);
      if (profile.rowCount === 0) {
        throw new NotFoundException("Current profile not found");
      }

      await client.query(
        `
          insert into reviews (
            id,
            author_profile_id,
            beer_id,
            rating,
            review_text,
            visibility,
            status,
            beer_confirmation_status
          )
          values ($1, $2, $3, $4, $5, $6, 'published', 'confirmed')
        `,
        [
          reviewId,
          currentProfileId,
          body.beerId,
          body.rating,
          body.reviewText.trim(),
          body.visibility
        ]
      );

      for (const [index, url] of photoUrls.entries()) {
        await client.query(
          `
            insert into review_photos (id, review_id, url, sort_order)
            values ($1, $2, $3, $4)
          `,
          [`photo-${randomUUID()}`, reviewId, url, index + 1]
        );
      }
    });

    const post = await this.readService.getReviewPost(reviewId);

    return {
      post,
      leaderboardEligible: post.isRankingEligible
    };
  }

  async createComment(
    reviewId: string,
    body: CreateCommentRequestDto,
    currentProfileId: string
  ): Promise<CreateCommentResponseDto> {
    this.validateComment(body);

    const commentId = `comment-${randomUUID()}`;

    await this.database.transaction(async (client) => {
      const review = await client.query("select id from reviews where id = $1 and status = 'published'", [reviewId]);
      if (review.rowCount === 0) {
        throw new NotFoundException("Review not found");
      }

      const profile = await client.query("select id from profiles where id = $1", [currentProfileId]);
      if (profile.rowCount === 0) {
        throw new NotFoundException("Current profile not found");
      }

      if (body.parentCommentId) {
        const parent = await client.query<{ parent_comment_id: string | null }>(
          "select parent_comment_id from comments where id = $1 and review_id = $2",
          [body.parentCommentId, reviewId]
        );

        if (parent.rowCount === 0) {
          throw new NotFoundException("Parent comment not found");
        }

        if (parent.rows[0]?.parent_comment_id) {
          throw new BadRequestException("Only one-level replies are supported");
        }
      }

      await client.query(
        `
          insert into comments (
            id,
            review_id,
            author_profile_id,
            parent_comment_id,
            body
          )
          values ($1, $2, $3, $4, $5)
        `,
        [
          commentId,
          reviewId,
          currentProfileId,
          body.parentCommentId ?? null,
          body.body.trim()
        ]
      );
    });

    const comments = await this.readService.getComments(reviewId);
    const comment = this.findComment(comments, commentId);
    if (!comment) {
      throw new NotFoundException("Created comment not found");
    }

    return { comment };
  }

  private validateReview(body: CreateReviewRequestDto) {
    if (!body.beerId) {
      throw new BadRequestException("beerId is required");
    }

    if (!Array.isArray(body.photoUrls) || body.photoUrls.length === 0) {
      throw new BadRequestException("At least one photoUrl is required");
    }

    if (body.photoUrls.length > 3) {
      throw new BadRequestException("A review can have at most 3 photos");
    }

    if (!body.rating || body.rating < 0 || body.rating > 5) {
      throw new BadRequestException("rating must be between 0 and 5");
    }

    if (!body.reviewText?.trim()) {
      throw new BadRequestException("reviewText is required");
    }

    if (body.visibility !== "public" && body.visibility !== "private") {
      throw new BadRequestException("visibility must be public or private");
    }
  }

  private validateBeer(body: CreateBeerRequestDto) {
    if (!body.name?.trim()) {
      throw new BadRequestException("name is required");
    }

    if (!body.breweryName?.trim()) {
      throw new BadRequestException("breweryName is required");
    }

    if (!body.style) {
      throw new BadRequestException("style is required");
    }

    if (body.abv !== undefined && (body.abv < 0 || body.abv > 30)) {
      throw new BadRequestException("abv must be between 0 and 30");
    }
  }

  private validateComment(body: CreateCommentRequestDto) {
    if (!body.body?.trim()) {
      throw new BadRequestException("body is required");
    }

    if (body.body.trim().length > 1000) {
      throw new BadRequestException("body must be 1000 characters or fewer");
    }
  }

  private findComment(comments: CommentDto[], commentId: string): CommentDto | undefined {
    for (const comment of comments) {
      if (comment.id === commentId) {
        return comment;
      }

      const reply = this.findComment(comment.replies ?? [], commentId);
      if (reply) {
        return reply;
      }
    }

    return undefined;
  }

  private async getBeerSummary(beerId: string): Promise<BeerSummaryDto> {
    const result = await this.database.query<{
      beer_id: string;
      beer_name: string;
      beer_style: BeerStyle;
      beer_abv: string | null;
      beer_image_url: string | null;
      brewery_id: string;
      brewery_name: string;
      brewery_country: string | null;
    }>(
      `
        select
          b.id as beer_id,
          b.name as beer_name,
          b.style as beer_style,
          b.abv as beer_abv,
          b.image_url as beer_image_url,
          br.id as brewery_id,
          br.name as brewery_name,
          br.country as brewery_country
        from beers b
        join breweries br on br.id = b.brewery_id
        where b.id = $1
      `,
      [beerId]
    );

    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException("Beer not found");
    }

    return {
      id: row.beer_id,
      name: row.beer_name,
      brewery: {
        id: row.brewery_id,
        name: row.brewery_name,
        country: row.brewery_country ?? undefined
      },
      style: row.beer_style,
      abv: row.beer_abv === null ? undefined : Number(row.beer_abv),
      imageUrl: row.beer_image_url ?? undefined
    };
  }
}
