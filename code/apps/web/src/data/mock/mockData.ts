import type {
  BeerDetailDto,
  BeerMatchResponseDto,
  BeerSummaryDto,
  BreweryDto,
  CommentDto,
  FeedPostDto,
  LeaderboardRowDto,
  UserProfileDto
} from "../../types";

export const profiles: UserProfileDto[] = [
  {
    id: "user-alex",
    displayName: "Alex G.",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&h=160&fit=crop",
    reviewCount: 18,
    averageGivenRating: 4.1,
    topStyle: "IPA"
  },
  {
    id: "user-sam",
    displayName: "Sam R.",
    avatarUrl: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=160&h=160&fit=crop",
    reviewCount: 42,
    averageGivenRating: 4.4,
    topStyle: "Stout"
  },
  {
    id: "user-jordan",
    displayName: "Jordan B.",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop",
    bio: "Craft Beer Enthusiast",
    reviewCount: 42,
    averageGivenRating: 4.2,
    topStyle: "Hazy IPA"
  }
];

export const breweries: BreweryDto[] = [
  { id: "brewery-cloudburst", name: "Cloudburst Brewing", country: "US" },
  { id: "brewery-holy-mountain", name: "Holy Mountain Brewing", country: "US" },
  { id: "brewery-elysian", name: "Elysian Brewing", country: "US" },
  { id: "brewery-alchemist", name: "Alchemist", country: "US" },
  { id: "brewery-russian-river", name: "Russian River", country: "US" }
];

export const beers: BeerSummaryDto[] = [
  {
    id: "beer-citra-ipa",
    name: "Citra IPA",
    brewery: breweries[0],
    style: "IPA",
    abv: 6.5,
    imageUrl: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=900&h=900&fit=crop"
  },
  {
    id: "beer-midnight-still",
    name: "Midnight Still",
    brewery: breweries[1],
    style: "Stout",
    abv: 9.2,
    imageUrl: "https://images.unsplash.com/photo-1618885472179-5e474019f2a9?w=900&h=900&fit=crop"
  },
  {
    id: "beer-space-dust",
    name: "Space Dust IPA",
    brewery: breweries[2],
    style: "Double IPA",
    abv: 8.2,
    imageUrl: "https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=900&h=900&fit=crop"
  },
  {
    id: "beer-heady-topper",
    name: "Heady Topper",
    brewery: breweries[3],
    style: "Double IPA",
    abv: 8,
    imageUrl: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=900&h=900&fit=crop"
  },
  {
    id: "beer-pliny-elder",
    name: "Pliny the Elder",
    brewery: breweries[4],
    style: "Double IPA",
    abv: 8,
    imageUrl: "https://images.unsplash.com/photo-1559526324-593bc073d938?w=900&h=900&fit=crop"
  }
];

export const posts: FeedPostDto[] = [
  {
    id: "post-citra-alex",
    author: profiles[0],
    beer: beers[0],
    primaryPhotoUrl: beers[0].imageUrl ?? "",
    photoUrls: [beers[0].imageUrl ?? "", "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=900&h=900&fit=crop"],
    rating: 4.5,
    reviewText: "Crisp, citrusy, and perfect for a sunny afternoon. Bright hop aroma without becoming too bitter.",
    visibility: "public",
    createdAt: "2026-06-27T10:00:00.000Z",
    likeCount: 12,
    commentCount: 4,
    viewerHasLiked: false,
    viewerHasSaved: false,
    isRankingEligible: true
  },
  {
    id: "post-midnight-sam",
    author: profiles[1],
    beer: beers[1],
    primaryPhotoUrl: beers[1].imageUrl ?? "",
    photoUrls: [beers[1].imageUrl ?? ""],
    rating: 5,
    reviewText: "Dark chocolate, espresso, and roasted malts. Thick, smooth, and dangerously easy to drink.",
    visibility: "public",
    createdAt: "2026-06-27T07:00:00.000Z",
    likeCount: 45,
    commentCount: 8,
    viewerHasLiked: false,
    viewerHasSaved: true,
    isRankingEligible: true
  }
];

export const commentsByPostId: Record<string, CommentDto[]> = {
  "post-citra-alex": [
    {
      id: "comment-citra-1",
      postId: "post-citra-alex",
      author: profiles[2],
      body: "This one has been on my list. The citrus note sounds exactly right.",
      createdAt: "2026-06-27T10:12:00.000Z",
      likeCount: 2,
      viewerHasLiked: false,
      replies: [
        {
          id: "comment-citra-1-reply-1",
          postId: "post-citra-alex",
          parentCommentId: "comment-citra-1",
          author: profiles[0],
          body: "Worth trying fresh if you can find it.",
          createdAt: "2026-06-27T10:18:00.000Z",
          likeCount: 1,
          viewerHasLiked: false
        }
      ]
    }
  ]
};

export const leaderboard: LeaderboardRowDto[] = [
  { rank: 1, beer: beers[3], averageRating: 4.8, verifiedReviewCount: 12000, likeCount: 4200, rankScore: 9.7, trend: "same" },
  { rank: 2, beer: beers[4], averageRating: 4.7, verifiedReviewCount: 9500, likeCount: 3900, rankScore: 9.3, trend: "up" },
  { rank: 3, beer: beers[2], averageRating: 4.6, verifiedReviewCount: 15000, likeCount: 3300, rankScore: 9.1, trend: "down" }
];

export const beerDetail: BeerDetailDto = {
  beer: beers[0],
  stats: {
    averageRating: 4.6,
    verifiedReviewCount: 2400,
    likeCount: 830,
    rank: 3,
    rankScope: "Top IPAs",
    rankScore: 8.9,
    updatedAt: "2026-06-27T10:30:00.000Z"
  },
  proofReviews: posts.map((post) => ({
    id: post.id,
    author: post.author,
    primaryPhotoUrl: post.primaryPhotoUrl,
    photoUrls: post.photoUrls,
    rating: post.rating,
    reviewText: post.reviewText,
    createdAt: post.createdAt,
    likeCount: post.likeCount
  }))
};

export const highConfidenceMatch: BeerMatchResponseDto = {
  requestId: "match-high-001",
  status: "high_confidence",
  candidates: [
    {
      beer: beers[2],
      confidenceScore: 0.98,
      confidenceLevel: "high",
      reasons: [
        { type: "label_text", label: "Label text matched Space Dust IPA", confidence: 0.97 },
        { type: "brewery", label: "Brewery matched Elysian Brewing", confidence: 0.94 },
        { type: "style", label: "Style matched Double IPA", confidence: 0.88 }
      ]
    }
  ]
};

export const lowConfidenceMatch: BeerMatchResponseDto = {
  requestId: "match-low-001",
  status: "low_confidence",
  candidates: [
    {
      beer: beers[0],
      confidenceScore: 0.42,
      confidenceLevel: "low",
      reasons: [
        { type: "style", label: "Style may be IPA", confidence: 0.48 },
        { type: "photo", label: "Image is unclear", confidence: 0.35 }
      ]
    }
  ]
};
