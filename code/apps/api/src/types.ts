export type ID = string;
export type ISODateTime = string;

export type BeerStyle =
  | "IPA"
  | "Double IPA"
  | "Hazy IPA"
  | "Pilsner"
  | "Stout"
  | "Sour"
  | "Lager"
  | "Porter"
  | "Other";

export type ReviewVisibility = "public" | "private";
export type MatchConfidenceLevel = "high" | "medium" | "low" | "none";
export type AiProvider = "mock" | "openai" | "zeabur";

export interface UserProfileDto {
  id: ID;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  reviewCount: number;
  averageGivenRating: number;
  topStyle?: BeerStyle;
}

export interface BreweryDto {
  id: ID;
  name: string;
  country?: string;
}

export interface BeerSummaryDto {
  id: ID;
  name: string;
  brewery: BreweryDto;
  style: BeerStyle;
  abv?: number;
  imageUrl?: string;
}

export interface BeerStatsDto {
  averageRating: number;
  verifiedReviewCount: number;
  likeCount: number;
  rank?: number;
  rankScope?: string;
  rankScore?: number;
  updatedAt: ISODateTime;
}

export interface FeedPostDto {
  id: ID;
  author: UserProfileDto;
  beer: BeerSummaryDto;
  primaryPhotoUrl: string;
  photoUrls: string[];
  rating: number;
  reviewText: string;
  visibility: ReviewVisibility;
  createdAt: ISODateTime;
  likeCount: number;
  commentCount: number;
  viewerHasLiked: boolean;
  viewerHasSaved: boolean;
  isRankingEligible: boolean;
}

export interface ProofReviewDto {
  id: ID;
  author: Pick<UserProfileDto, "id" | "displayName" | "avatarUrl">;
  primaryPhotoUrl?: string;
  photoUrls?: string[];
  rating: number;
  reviewText: string;
  createdAt: ISODateTime;
  likeCount: number;
}

export interface BeerDetailDto {
  beer: BeerSummaryDto;
  stats: BeerStatsDto;
  proofReviews: ProofReviewDto[];
}

export interface LeaderboardRowDto {
  rank: number;
  beer: BeerSummaryDto;
  averageRating: number;
  verifiedReviewCount: number;
  likeCount: number;
  rankScore: number;
  trend?: "up" | "down" | "same" | "new";
}

export interface MatchReasonDto {
  type: "photo" | "label_text" | "beer_name" | "brewery" | "style" | "user_input";
  label: string;
  confidence: number;
}

export interface BeerMatchCandidateDto {
  beer: BeerSummaryDto;
  confidenceScore: number;
  confidenceLevel: MatchConfidenceLevel;
  reasons: MatchReasonDto[];
}

export interface BeerMatchResponseDto {
  requestId: ID;
  status: "high_confidence" | "multiple_candidates" | "low_confidence" | "no_results";
  candidates: BeerMatchCandidateDto[];
}

export interface CommentDto {
  id: ID;
  postId: ID;
  author: Pick<UserProfileDto, "id" | "displayName" | "avatarUrl">;
  parentCommentId?: ID;
  body: string;
  createdAt: ISODateTime;
  likeCount: number;
  viewerHasLiked: boolean;
  replies?: CommentDto[];
}

export interface BeerMatchRequestDto {
  photoUrls: string[];
  beerName?: string;
  breweryName?: string;
  styleHint?: BeerStyle;
  locale?: "zh-TW" | "en";
  mode?: "high" | "low" | "none";
}

export interface CreateReviewRequestDto {
  beerId: ID;
  photoUrls: string[];
  rating: number;
  reviewText: string;
  visibility: ReviewVisibility;
}

export interface CreateReviewResponseDto {
  post: FeedPostDto;
  leaderboardEligible: boolean;
}

export interface CreateCommentRequestDto {
  body: string;
  parentCommentId?: ID;
}

export interface CreateCommentResponseDto {
  comment: CommentDto;
}

export interface UploadReviewPhotoInputDto {
  fileName: string;
  mimeType: string;
  dataUrl: string;
}

export interface UploadReviewPhotosRequestDto {
  files: UploadReviewPhotoInputDto[];
}

export interface UploadedReviewPhotoDto {
  url: string;
  fileName: string;
  mimeType: string;
  sortOrder: number;
  isPrimary: boolean;
  storageProvider: "mock" | "supabase";
}

export interface UploadReviewPhotosResponseDto {
  photos: UploadedReviewPhotoDto[];
}
