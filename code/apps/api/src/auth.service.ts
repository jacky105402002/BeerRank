import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "./database.service";
import type { BeerStyle, UserProfileDto } from "./types";

export type RequestLike = {
  headers?: Record<string, string | string[] | undefined>;
};

type ProfileRow = {
  id: string;
  display_name: string;
  avatar_url: string;
  bio: string | null;
  top_style: string | null;
  review_count: number;
  average_given_rating: string | null;
};

const DEFAULT_MOCK_PROFILE_ID = "user-jordan";
const PROFILE_HEADER = "x-beerrank-profile-id";

@Injectable()
export class AuthService {
  constructor(private readonly database: DatabaseService) {}

  resolveProfileId(request?: RequestLike): string {
    const headerValue = this.getHeaderValue(request, PROFILE_HEADER);
    return headerValue || process.env.MOCK_PROFILE_ID || DEFAULT_MOCK_PROFILE_ID;
  }

  async getCurrentProfile(request?: RequestLike): Promise<UserProfileDto> {
    const profileId = this.resolveProfileId(request);

    if (!this.database.isConfigured()) {
      throw new NotFoundException("Current profile not found");
    }

    const result = await this.database.query<ProfileRow>(
      `
        select
          p.id,
          p.display_name,
          p.avatar_url,
          p.bio,
          p.top_style,
          count(r.id)::int as review_count,
          avg(r.rating)::numeric(3, 2) as average_given_rating
        from profiles p
        left join reviews r on r.author_profile_id = p.id and r.status = 'published'
        where p.id = $1
        group by p.id
      `,
      [profileId]
    );

    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException("Current profile not found");
    }

    return {
      id: row.id,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      bio: row.bio ?? undefined,
      reviewCount: row.review_count,
      averageGivenRating: Number(row.average_given_rating ?? 0),
      topStyle: row.top_style as BeerStyle | undefined
    };
  }

  private getHeaderValue(request: RequestLike | undefined, headerName: string): string | undefined {
    const headers = request?.headers ?? {};
    const value = headers[headerName] ?? headers[headerName.toLowerCase()];

    if (Array.isArray(value)) {
      return value[0]?.trim();
    }

    return value?.trim();
  }
}
