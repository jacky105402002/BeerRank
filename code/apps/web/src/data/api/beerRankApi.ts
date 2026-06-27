import type {
  BeerDetailDto,
  BeerMatchRequestDto,
  BeerMatchResponseDto,
  CommentDto,
  CurrentUserResponseDto,
  FeedPostDto,
  LeaderboardRowDto,
  ListResponseDto
} from "@beerrank/shared";

const apiBaseUrl = import.meta.env.VITE_BEERRANK_API_URL ?? "http://127.0.0.1:3001/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    },
    ...init
  });

  if (!response.ok) {
    throw new Error(`BeerRank API ${response.status}: ${path}`);
  }

  return response.json() as Promise<T>;
}

export const beerRankApi = {
  getMe() {
    return request<CurrentUserResponseDto>("/me");
  },
  getFeed() {
    return request<ListResponseDto<FeedPostDto>>("/feed");
  },
  getLeaderboard(style = "all") {
    const query = style ? `?style=${encodeURIComponent(style)}` : "";
    return request<ListResponseDto<LeaderboardRowDto>>(`/leaderboard${query}`);
  },
  getBeerDetail(beerId: string) {
    return request<BeerDetailDto>(`/beers/${beerId}`);
  },
  getComments(postId: string) {
    return request<ListResponseDto<CommentDto>>(`/posts/${postId}/comments`);
  },
  matchBeer(body: BeerMatchRequestDto) {
    return request<BeerMatchResponseDto>("/ai/beer-match", {
      method: "POST",
      body: JSON.stringify(body)
    });
  }
};
