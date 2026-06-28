import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "./database.service";
import type {
  BeerDetailDto,
  BeerSummaryDto,
  CommentDto,
  FeedPostDto,
  LeaderboardRowDto,
  ProofReviewDto,
  ReviewVisibility,
  UserProfileDto
} from "./types";

type BeerRow = {
  beer_id: string;
  beer_name: string;
  beer_style: string;
  beer_abv: string | null;
  beer_image_url: string | null;
  brewery_id: string;
  brewery_name: string;
  brewery_country: string | null;
};

type FeedRow = BeerRow & {
  review_id: string;
  author_id: string;
  author_display_name: string;
  author_avatar_url: string;
  author_bio: string | null;
  author_top_style: string | null;
  author_review_count: number;
  author_average_given_rating: string | null;
  primary_photo_url: string | null;
  photo_urls: string[] | null;
  rating: string;
  review_text: string;
  visibility: ReviewVisibility;
  created_at: string;
  like_count: number;
  comment_count: number;
  is_ranking_eligible: boolean;
};

type LeaderboardRow = BeerRow & {
  average_rating: string;
  verified_review_count: number;
  like_count: number;
  rank_score: string;
};

type BeerDetailRow = BeerRow & {
  average_rating: string | null;
  verified_review_count: number | null;
  like_count: number | null;
  rank_score: string | null;
  rank: number | null;
};

type ProofReviewRow = {
  review_id: string;
  author_id: string;
  author_display_name: string;
  author_avatar_url: string;
  primary_photo_url: string | null;
  photo_urls: string[] | null;
  rating: string;
  review_text: string;
  created_at: string;
  like_count: number;
};

type CommentRow = {
  comment_id: string;
  review_id: string;
  author_id: string;
  author_display_name: string;
  author_avatar_url: string;
  parent_comment_id: string | null;
  body: string;
  created_at: string;
  like_count: number;
};

@Injectable()
export class ReadService {
  constructor(private readonly database: DatabaseService) {}

  isReady() {
    return this.database.isConfigured();
  }

  async getFeed(): Promise<FeedPostDto[]> {
    const result = await this.database.query<FeedRow>(`
      select
        r.id as review_id,
        p.id as author_id,
        p.display_name as author_display_name,
        p.avatar_url as author_avatar_url,
        p.bio as author_bio,
        p.top_style as author_top_style,
        count(distinct author_reviews.id)::int as author_review_count,
        avg(author_reviews.rating)::numeric(3, 2) as author_average_given_rating,
        b.id as beer_id,
        b.name as beer_name,
        b.style as beer_style,
        b.abv as beer_abv,
        b.image_url as beer_image_url,
        br.id as brewery_id,
        br.name as brewery_name,
        br.country as brewery_country,
        primary_photo.url as primary_photo_url,
        photo_list.photo_urls,
        r.rating,
        r.review_text,
        r.visibility,
        r.created_at,
        count(distinct likes.id)::int as like_count,
        count(distinct c.id)::int as comment_count,
        (er.id is not null) as is_ranking_eligible
      from reviews r
      join profiles p on p.id = r.author_profile_id
      join beers b on b.id = r.beer_id
      join breweries br on br.id = b.brewery_id
      left join reviews author_reviews on author_reviews.author_profile_id = p.id and author_reviews.status = 'published'
      left join review_photos primary_photo on primary_photo.review_id = r.id and primary_photo.sort_order = 1
      left join lateral (
        select array_agg(rp.url order by rp.sort_order) as photo_urls
        from review_photos rp
        where rp.review_id = r.id
      ) photo_list on true
      left join post_reactions likes on likes.review_id = r.id and likes.type = 'like'
      left join comments c on c.review_id = r.id
      left join eligible_reviews er on er.id = r.id
      where r.status = 'published' and r.visibility = 'public'
      group by r.id, p.id, b.id, br.id, primary_photo.url, photo_list.photo_urls, er.id
      order by r.created_at desc
      limit 50
    `);

    return result.rows.map((row) => this.mapFeedPost(row));
  }

  async getReviewPost(reviewId: string): Promise<FeedPostDto> {
    const result = await this.database.query<FeedRow>(`
      select
        r.id as review_id,
        p.id as author_id,
        p.display_name as author_display_name,
        p.avatar_url as author_avatar_url,
        p.bio as author_bio,
        p.top_style as author_top_style,
        count(distinct author_reviews.id)::int as author_review_count,
        avg(author_reviews.rating)::numeric(3, 2) as author_average_given_rating,
        b.id as beer_id,
        b.name as beer_name,
        b.style as beer_style,
        b.abv as beer_abv,
        b.image_url as beer_image_url,
        br.id as brewery_id,
        br.name as brewery_name,
        br.country as brewery_country,
        primary_photo.url as primary_photo_url,
        photo_list.photo_urls,
        r.rating,
        r.review_text,
        r.visibility,
        r.created_at,
        count(distinct likes.id)::int as like_count,
        count(distinct c.id)::int as comment_count,
        (er.id is not null) as is_ranking_eligible
      from reviews r
      join profiles p on p.id = r.author_profile_id
      join beers b on b.id = r.beer_id
      join breweries br on br.id = b.brewery_id
      left join reviews author_reviews on author_reviews.author_profile_id = p.id and author_reviews.status = 'published'
      left join review_photos primary_photo on primary_photo.review_id = r.id and primary_photo.sort_order = 1
      left join lateral (
        select array_agg(rp.url order by rp.sort_order) as photo_urls
        from review_photos rp
        where rp.review_id = r.id
      ) photo_list on true
      left join post_reactions likes on likes.review_id = r.id and likes.type = 'like'
      left join comments c on c.review_id = r.id
      left join eligible_reviews er on er.id = r.id
      where r.id = $1
      group by r.id, p.id, b.id, br.id, primary_photo.url, photo_list.photo_urls, er.id
    `, [reviewId]);

    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException("Review not found");
    }

    return this.mapFeedPost(row);
  }

  async getLeaderboard(style?: string): Promise<LeaderboardRowDto[]> {
    const normalizedStyle = style?.toLowerCase();
    const params: string[] = [];
    const filterSql = normalizedStyle && normalizedStyle !== "all"
      ? "where lower(b.style) like $1"
      : "";

    if (filterSql) {
      params.push(`%${normalizedStyle}%`);
    }

    const result = await this.database.query<LeaderboardRow>(`
      select
        b.id as beer_id,
        b.name as beer_name,
        b.style as beer_style,
        b.abv as beer_abv,
        b.image_url as beer_image_url,
        br.id as brewery_id,
        br.name as brewery_name,
        br.country as brewery_country,
        bl.average_rating,
        bl.verified_review_count,
        bl.like_count,
        bl.rank_score
      from beer_leaderboard bl
      join beers b on b.id = bl.beer_id
      join breweries br on br.id = b.brewery_id
      ${filterSql}
      order by bl.rank_score desc, bl.average_rating desc, bl.verified_review_count desc
      limit 50
    `, params);

    return result.rows.map((row, index) => ({
      rank: index + 1,
      beer: this.mapBeer(row),
      averageRating: Number(row.average_rating),
      verifiedReviewCount: row.verified_review_count,
      likeCount: row.like_count,
      rankScore: Number(row.rank_score),
      trend: "same"
    }));
  }

  async searchBeers(query?: string): Promise<BeerSummaryDto[]> {
    const normalizedQuery = query?.trim().toLowerCase();
    const params: string[] = [];
    const filterSql = normalizedQuery
      ? `
        where
          lower(b.name) like $1
          or lower(br.name) like $1
          or lower(b.style) like $1
      `
      : "";

    if (normalizedQuery) {
      params.push(`%${normalizedQuery}%`);
    }

    const result = await this.database.query<BeerRow>(`
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
      ${filterSql}
      order by
        case when b.status = 'confirmed' then 0 else 1 end,
        b.created_at desc
      limit 20
    `, params);

    return result.rows.map((row) => this.mapBeer(row));
  }

  async getBeerDetail(beerId: string): Promise<BeerDetailDto> {
    const detail = await this.database.query<BeerDetailRow>(`
      select
        b.id as beer_id,
        b.name as beer_name,
        b.style as beer_style,
        b.abv as beer_abv,
        b.image_url as beer_image_url,
        br.id as brewery_id,
        br.name as brewery_name,
        br.country as brewery_country,
        bl.average_rating,
        bl.verified_review_count,
        bl.like_count,
        bl.rank_score,
        ranked.rank
      from beers b
      join breweries br on br.id = b.brewery_id
      left join beer_leaderboard bl on bl.beer_id = b.id
      left join (
        select beer_id, row_number() over (order by rank_score desc, average_rating desc, verified_review_count desc)::int as rank
        from beer_leaderboard
      ) ranked on ranked.beer_id = b.id
      where b.id = $1
    `, [beerId]);

    const row = detail.rows[0];
    if (!row) {
      throw new NotFoundException("Beer not found");
    }

    const proofReviews = await this.getProofReviews(beerId);

    return {
      beer: this.mapBeer(row),
      stats: {
        averageRating: Number(row.average_rating ?? 0),
        verifiedReviewCount: row.verified_review_count ?? 0,
        likeCount: row.like_count ?? 0,
        rank: row.rank ?? undefined,
        rankScope: `Top ${row.beer_style}`,
        rankScore: Number(row.rank_score ?? 0),
        updatedAt: new Date().toISOString()
      },
      proofReviews
    };
  }

  async getComments(postId: string): Promise<CommentDto[]> {
    const result = await this.database.query<CommentRow>(`
      select
        c.id as comment_id,
        c.review_id,
        p.id as author_id,
        p.display_name as author_display_name,
        p.avatar_url as author_avatar_url,
        c.parent_comment_id,
        c.body,
        c.created_at,
        0::int as like_count
      from comments c
      join profiles p on p.id = c.author_profile_id
      where c.review_id = $1
      order by c.created_at asc
    `, [postId]);

    const byId = new Map<string, CommentDto>();
    const roots: CommentDto[] = [];

    for (const row of result.rows) {
      const comment: CommentDto = {
        id: row.comment_id,
        postId: row.review_id,
        author: this.mapCommentAuthor(row),
        parentCommentId: row.parent_comment_id ?? undefined,
        body: row.body,
        createdAt: new Date(row.created_at).toISOString(),
        likeCount: row.like_count,
        viewerHasLiked: false,
        replies: []
      };

      byId.set(comment.id, comment);

      if (row.parent_comment_id) {
        byId.get(row.parent_comment_id)?.replies?.push(comment);
      } else {
        roots.push(comment);
      }
    }

    return roots;
  }

  private async getProofReviews(beerId: string): Promise<ProofReviewDto[]> {
    const result = await this.database.query<ProofReviewRow>(`
      select
        r.id as review_id,
        p.id as author_id,
        p.display_name as author_display_name,
        p.avatar_url as author_avatar_url,
        primary_photo.url as primary_photo_url,
        photo_list.photo_urls,
        r.rating,
        r.review_text,
        r.created_at,
        count(distinct likes.id)::int as like_count
      from eligible_reviews r
      join profiles p on p.id = r.author_profile_id
      left join review_photos primary_photo on primary_photo.review_id = r.id and primary_photo.sort_order = 1
      left join lateral (
        select array_agg(rp.url order by rp.sort_order) as photo_urls
        from review_photos rp
        where rp.review_id = r.id
      ) photo_list on true
      left join post_reactions likes on likes.review_id = r.id and likes.type = 'like'
      where r.beer_id = $1
      group by r.id, p.id, primary_photo.url, photo_list.photo_urls, r.rating, r.review_text, r.created_at
      order by r.created_at desc
      limit 20
    `, [beerId]);

    return result.rows.map((row) => ({
      id: row.review_id,
      author: this.mapProofAuthor(row),
      primaryPhotoUrl: row.primary_photo_url ?? undefined,
      photoUrls: row.photo_urls ?? [],
      rating: Number(row.rating),
      reviewText: row.review_text,
      createdAt: new Date(row.created_at).toISOString(),
      likeCount: row.like_count
    }));
  }

  private mapFeedPost(row: FeedRow): FeedPostDto {
    return {
      id: row.review_id,
      author: {
        id: row.author_id,
        displayName: row.author_display_name,
        avatarUrl: row.author_avatar_url,
        bio: row.author_bio ?? undefined,
        reviewCount: row.author_review_count,
        averageGivenRating: Number(row.author_average_given_rating ?? 0),
        topStyle: row.author_top_style as UserProfileDto["topStyle"]
      },
      beer: this.mapBeer(row),
      primaryPhotoUrl: row.primary_photo_url ?? "",
      photoUrls: row.photo_urls ?? [],
      rating: Number(row.rating),
      reviewText: row.review_text,
      visibility: row.visibility,
      createdAt: new Date(row.created_at).toISOString(),
      likeCount: row.like_count,
      commentCount: row.comment_count,
      viewerHasLiked: false,
      viewerHasSaved: false,
      isRankingEligible: row.is_ranking_eligible
    };
  }

  private mapBeer(row: BeerRow): BeerSummaryDto {
    return {
      id: row.beer_id,
      name: row.beer_name,
      brewery: {
        id: row.brewery_id,
        name: row.brewery_name,
        country: row.brewery_country ?? undefined
      },
      style: row.beer_style as BeerSummaryDto["style"],
      abv: row.beer_abv === null ? undefined : Number(row.beer_abv),
      imageUrl: row.beer_image_url ?? undefined
    };
  }

  private mapProofAuthor(row: ProofReviewRow): ProofReviewDto["author"] {
    return {
      id: row.author_id,
      displayName: row.author_display_name,
      avatarUrl: row.author_avatar_url
    };
  }

  private mapCommentAuthor(row: CommentRow): CommentDto["author"] {
    return {
      id: row.author_id,
      displayName: row.author_display_name,
      avatarUrl: row.author_avatar_url
    };
  }
}
