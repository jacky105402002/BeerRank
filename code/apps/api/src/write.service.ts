import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { DatabaseService } from "./database.service";
import { ReadService } from "./read.service";
import type {
  CommentDto,
  CreateCommentRequestDto,
  CreateCommentResponseDto,
  CreateReviewRequestDto,
  CreateReviewResponseDto
} from "./types";

const MOCK_CURRENT_PROFILE_ID = "user-jordan";

@Injectable()
export class WriteService {
  constructor(
    private readonly database: DatabaseService,
    private readonly readService: ReadService
  ) {}

  isReady() {
    return this.database.isConfigured();
  }

  async createReview(body: CreateReviewRequestDto): Promise<CreateReviewResponseDto> {
    this.validateReview(body);

    const reviewId = `review-${randomUUID()}`;
    const photoUrls = body.photoUrls.slice(0, 3);

    await this.database.transaction(async (client) => {
      const beer = await client.query("select id from beers where id = $1", [body.beerId]);
      if (beer.rowCount === 0) {
        throw new NotFoundException("Beer not found");
      }

      const profile = await client.query("select id from profiles where id = $1", [MOCK_CURRENT_PROFILE_ID]);
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
          MOCK_CURRENT_PROFILE_ID,
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

  async createComment(reviewId: string, body: CreateCommentRequestDto): Promise<CreateCommentResponseDto> {
    this.validateComment(body);

    const commentId = `comment-${randomUUID()}`;

    await this.database.transaction(async (client) => {
      const review = await client.query("select id from reviews where id = $1 and status = 'published'", [reviewId]);
      if (review.rowCount === 0) {
        throw new NotFoundException("Review not found");
      }

      const profile = await client.query("select id from profiles where id = $1", [MOCK_CURRENT_PROFILE_ID]);
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
          MOCK_CURRENT_PROFILE_ID,
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
}
