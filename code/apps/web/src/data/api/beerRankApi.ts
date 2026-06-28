import type {
  BeerDetailDto,
  BeerMatchRequestDto,
  BeerMatchResponseDto,
  CommentDto,
  CreateBeerRequestDto,
  CreateBeerResponseDto,
  CreateCommentRequestDto,
  CreateCommentResponseDto,
  CreateReviewRequestDto,
  CreateReviewResponseDto,
  CurrentUserResponseDto,
  FeedPostDto,
  LeaderboardRowDto,
  ListResponseDto,
  UploadReviewPhotosRequestDto,
  UploadReviewPhotosResponseDto
} from "../../types";

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
  searchBeers(query: string) {
    const params = query.trim() ? `?query=${encodeURIComponent(query.trim())}` : "";
    return request<ListResponseDto<BeerDetailDto["beer"]>>(`/beers${params}`);
  },
  createBeer(body: CreateBeerRequestDto) {
    return request<CreateBeerResponseDto>("/beers", {
      method: "POST",
      body: JSON.stringify(body)
    });
  },
  getComments(postId: string) {
    return request<ListResponseDto<CommentDto>>(`/posts/${postId}/comments`);
  },
  createComment(postId: string, body: CreateCommentRequestDto) {
    return request<CreateCommentResponseDto>(`/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify(body)
    });
  },
  matchBeer(body: BeerMatchRequestDto) {
    return request<BeerMatchResponseDto>("/ai/beer-match", {
      method: "POST",
      body: JSON.stringify(body)
    });
  },
  uploadReviewPhotos(body: UploadReviewPhotosRequestDto) {
    return request<UploadReviewPhotosResponseDto>("/uploads/review-photos", {
      method: "POST",
      body: JSON.stringify(body)
    });
  },
  createReview(body: CreateReviewRequestDto) {
    return request<CreateReviewResponseDto>("/reviews", {
      method: "POST",
      body: JSON.stringify(body)
    });
  }
};
