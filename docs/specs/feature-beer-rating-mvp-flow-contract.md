# BeerRank MVP Flow Contract

Status: Draft for review

Last updated: 2026-06-27

Engineering loop node: `Node 3: Flow Contract`

Node 3 status: Accepted for Node 4 Architecture, with reversible MVP defaults.

## Purpose

This document translates BeerRank's Figma MVP flow into implementation contracts before scaffolding code.

It defines:

- final route map
- component map
- UI state table
- frontend/API data contract
- first mock data shape
- missing data and decision checklist

This file is the gate between UIUX design and technical architecture/scaffolding.

## Source Inputs

| Source | Role |
| --- | --- |
| Figma `MVP Canonical Flow` | Canonical screen order and first prototype links |
| `docs/specs/feature-beer-rating-mvp-figma-review.md` | UIUX review, screen gaps, prototype notes |
| `docs/specs/feature-beer-rating-mvp-flow-architecture.md` | Product/business/data alignment |
| `docs/specs/feature-beer-rating-mvp-engineering-loop.md` | Node/gate policy |

## Product Truths

The implementation must preserve these rules:

1. A ranking-eligible review must be a published post.
2. A published post must have an authenticated author.
3. A published post can have up to three beer photos.
4. The first photo is the primary photo used in Feed, Beer Detail previews, and ranking proof surfaces.
5. A published post must have a rating.
6. A published post must have a confirmed Beer association.
7. Reviews can be public or private.
8. Only public, published, confirmed reviews count toward leaderboard scoring.
9. Only public reviews appear in Beer Detail proof feeds and leaderboard-drilldown surfaces.
10. AI can suggest Beer candidates, but user confirmation is required.
11. Beer Detail must show the public proof reviews behind the leaderboard.
12. Leaderboard rows must navigate to Beer Detail.

## Localization Contract

MVP should support Traditional Chinese and English UI.

Default behavior:

- Detect browser primary language.
- Use Traditional Chinese when browser language starts with `zh`.
- Use English otherwise.
- Keep route paths in English.
- Keep data values such as beer names, brewery names, and styles in their original/source language unless a display translation exists later.

Implementation default:

```ts
type Locale = "zh-TW" | "en";

function detectLocale(language: string): Locale {
  return language.toLowerCase().startsWith("zh") ? "zh-TW" : "en";
}
```

Translation scope for MVP:

- navigation labels
- buttons
- validation messages
- auth prompts
- empty/loading/error states
- ranking trust explanations
- review composer labels

Out of first code pass:

- user-generated content translation
- beer/brewery/style localization database
- manual language switch UI, unless implementation is cheap after locale context exists

## Route Map Finalization

### Primary Routes

| Route | Page Owner | Figma Frame | Auth | Primary Data | Notes |
| --- | --- | --- | --- | --- | --- |
| `/` | Redirect | none | Public | none | Redirect to `/feed`. |
| `/feed` | `FeedPage` | `01 Feed / Home` | Public | `FeedPost[]`, auth state | Logged-out users can browse. Protected actions trigger login modal. |
| `/review/new` | `ReviewComposerPage` | `03 Review / Empty Composer`, `06 Review / Beer Confirmed` | Required for publish | auth state, draft review, Beer confirmation | Can open as logged out, but publish requires login. |
| `/review/new/match` | `BeerMatchPage` | `04 AI Match / High Confidence`, `05 AI Match / Low Confidence` | Required before resolving match | draft review, match candidates | AI suggestion and manual search live here. |
| `/beers/:beerId` | `BeerDetailPage` | `07 Beer Detail / Real Proof` | Public | `BeerDetail`, `BeerStats`, `ProofReview[]` | Add My Review should preselect this Beer. |
| `/leaderboard` | `LeaderboardPage` | `08 Leaderboard / Verified Ranking` | Public | `LeaderboardRow[]`, filters | Rows navigate to Beer Detail. |
| `/profile` | `ProfilePage` | `09 Profile / Sync & Reviews` | Mixed | auth state, profile, user reviews | Signed-out view shows Google sync/login prompt. |
| `/posts/:postId/comments` | `CommentThreadPanel` or modal | not designed yet | Public read, signed-in write | comments | Can start as modal/sheet instead of full route. |

### Modal / Sheet Routes

These are not separate URLs for MVP unless implementation pressure suggests otherwise.

| UI Surface | Owner Route | Trigger | Result |
| --- | --- | --- | --- |
| `LoginRequiredSheet` | any route | protected action while signed out | Continue with Google or dismiss |
| `LeaderboardFormulaSheet` | `/leaderboard` | score info tap | explain score formula |
| `BeerCorrectionSheet` | `/beers/:beerId` | report/suggest correction | future placeholder |
| `CommentThreadSheet` | feed/detail | comment action | read/add comments |
| `VisibilitySelectorSheet` | `/review/new` | visibility field | select public/private |

### Route Transitions

| Source | Action | Target |
| --- | --- | --- |
| `/feed` | tap beer name/photo/post | `/beers/:beerId` |
| `/feed` | tap like/comment/save signed out | `LoginRequiredSheet` |
| `/feed` | tap comment | `CommentThreadSheet` |
| any shell screen | bottom nav Feed | `/feed` |
| any shell screen | bottom nav Ranking | `/leaderboard` |
| any shell screen | bottom nav Add | `/review/new` |
| any shell screen | bottom nav AI Match | `/review/new/match` if draft exists; otherwise `/review/new` |
| any shell screen | bottom nav Profile | `/profile` |
| `/review/new` | tap Confirm with AI | `/review/new/match` |
| `/review/new/match` | accept candidate | `/review/new` with confirmed Beer |
| `/review/new/match` | manual select Beer | `/review/new` with confirmed Beer |
| `/review/new/match` | create new Beer | `/review/new` with created/confirmed Beer draft |
| `/review/new` | publish success | `/review/success` or success state, then `/feed` / `/beers/:beerId` |
| `/beers/:beerId` | Add My Review signed in | `/review/new?beerId=:beerId` |
| `/beers/:beerId` | Add My Review signed out | `LoginRequiredSheet` |
| `/leaderboard` | tap row | `/beers/:beerId` |

### Deferred Routes

| Route | Reason Deferred |
| --- | --- |
| `/review/success` | Figma success screen not designed yet. Can start as inline success state. |
| `/beers/new` | Create Beer state not designed yet. Can start inside match flow. |
| `/settings` | Profile settings out of MVP first pass. |
| `/posts/:postId` | Individual post detail not required yet. |

## Component Map

### App-Level Components

| Component | Responsibility | Used By |
| --- | --- | --- |
| `App` | Router provider, app context providers | all |
| `AppShell` | mobile shell, max-width container, page background | primary routes |
| `TopAppBar` | brand/title, notifications/profile affordance | shell screens |
| `BottomNav` | Feed, Ranking, Add, AI Match, Profile navigation | shell screens |
| `LoginRequiredSheet` | auth gate for protected actions | all routes |
| `LoadingState` | consistent loading UI | data routes |
| `EmptyState` | empty feed/leaderboard/search states | data routes |
| `ErrorState` | recoverable load/upload/API errors | data routes |

### Feed Components

| Component | Responsibility |
| --- | --- |
| `FeedPage` | fetch/display feed posts and auth-gated actions |
| `FeedList` | list layout for `ReviewPostCard` |
| `ReviewPostCard` | social post card: user, photo, beer, rating, text, actions |
| `PostAuthorHeader` | avatar, display name, time, brewery/location |
| `BeerSummaryLink` | beer name/style chip linking to Beer Detail |
| `PostActions` | like/comment/save counts and interactions |
| `CommentThreadSheet` | show and add comments for a post |
| `CommentList` | nested comment display for MVP depth rules |
| `CommentComposer` | signed-in comment input |
| `VerifiedReviewBadge` | indicates review counts toward ranking |

### Review Components

| Component | Responsibility |
| --- | --- |
| `ReviewComposerPage` | owns draft review state and validation |
| `PhotoUploader` | select/photo placeholder, preview, upload error |
| `PhotoGalleryInput` | manage up to three selected photos and primary photo |
| `RatingInput` | 1-5 star rating |
| `BeerConfirmField` | Beer name input + confirmation status |
| `ReviewTextArea` | short tasting note |
| `ReviewValidationSummary` | disabled publish reasons |
| `PublishReviewButton` | disabled/ready/loading/success states |
| `PublishSuccessPanel` | post-publish next actions |
| `VisibilitySelector` | public/private post setting |

### AI Match Components

| Component | Responsibility |
| --- | --- |
| `BeerMatchPage` | route owner for high/low confidence states |
| `AIMatchLoading` | matching progress |
| `BeerMatchCard` | suggested Beer candidate |
| `MatchConfidenceBadge` | confidence score and level |
| `MatchReasonList` | photo/text/brewery/style evidence |
| `BeerSearchBox` | manual beer search |
| `BeerSearchResults` | candidate rows |
| `CreateBeerPrompt` | no match/create Beer CTA |
| `CreateBeerInlineForm` | MVP inline create Beer draft form |

### Beer Detail Components

| Component | Responsibility |
| --- | --- |
| `BeerDetailPage` | load Beer, stats, proof reviews |
| `BeerHero` | image, name, brewery, style, ABV |
| `BeerStatsPanel` | avg rating, rank, verified review count |
| `RealProofNotice` | explains ranking eligibility |
| `RealProofFeed` | list of reviews that count |
| `ProofReviewCard` | compact review card |
| `ProofPhotoStrip` | primary photo plus optional secondary photos |
| `AddMyReviewButton` | route/auth-aware CTA |

### Leaderboard Components

| Component | Responsibility |
| --- | --- |
| `LeaderboardPage` | filters, sorting, ranking list |
| `LeaderboardTrustHint` | ranking proof explanation |
| `LeaderboardFilters` | style chips and sort selector |
| `RankingRow` | rank, beer, brewery, score, rating count |
| `ScoreFormulaButton` | opens formula sheet |
| `LeaderboardFormulaSheet` | explains rank score formula |

### Profile Components

| Component | Responsibility |
| --- | --- |
| `ProfilePage` | signed-out/signed-in profile logic |
| `ProfileHeader` | avatar, display name, bio |
| `ProfileStats` | review count, average given, top style |
| `UserReviewGrid` | user's published reviews |
| `SavedBeerList` | saved beers placeholder |
| `AuthSyncPrompt` | Google login/sync CTA |
| `ProfileSettingsLink` | future account/settings entry |

## UI State Table

### Global/Auth

| State | Trigger | UI | API/Data |
| --- | --- | --- | --- |
| `auth.unknown` | app boot | app skeleton | session check pending |
| `auth.signedOut` | no session | public browsing, login prompts | no current user |
| `auth.signedIn` | session exists | user actions enabled | `CurrentUser` loaded |
| `auth.error` | session check fails | retry/login prompt | auth error |

### Feed

| State | Trigger | UI | API/Data |
| --- | --- | --- | --- |
| `feed.loading` | enter `/feed` | loading list skeleton | `GET /feed` pending |
| `feed.loaded` | posts returned | feed cards | `FeedPost[]` |
| `feed.empty` | no posts | empty CTA to add first review | empty array |
| `feed.error` | load fails | retry state | API error |
| `feed.loginRequired` | signed-out protected action | login sheet | auth required |

### Comments

| State | Trigger | UI | API/Data |
| --- | --- | --- | --- |
| `comments.loading` | open comments | thread skeleton | `GET /posts/:postId/comments` pending |
| `comments.loaded` | comments returned | comment thread | `CommentDto[]` |
| `comments.empty` | no comments | empty thread prompt | empty array |
| `comments.submitting` | submit comment | disabled composer | `POST /posts/:postId/comments` pending |
| `comments.error` | load/submit fails | retry/error message | API error |

### Review Composer

| State | Trigger | UI | API/Data |
| --- | --- | --- | --- |
| `review.draft.empty` | enter composer | empty form | local draft |
| `review.photoSelected` | one or more photos selected | preview gallery, first photo primary | local file/object URL list |
| `review.photoLimitReached` | user selects more than 3 photos | max-photo validation | local validation |
| `review.uploading` | upload begins | progress/disabled publish | upload request |
| `review.uploadFailed` | upload fails | error, retry | storage/API error |
| `review.ratingMissing` | no rating | disabled reason | local validation |
| `review.beerUnconfirmed` | beer text exists but no Beer ID | disabled reason, Confirm with AI CTA | local validation |
| `review.beerConfirmed` | user accepts/selects/creates Beer | confirmed chip/card | `ConfirmedBeer` |
| `review.readyToPublish` | photo + rating + Beer + text valid | enabled publish | local validation |
| `review.visibilityPublic` | user selects public | eligible for leaderboard if other conditions pass | local draft |
| `review.visibilityPrivate` | user selects private | publishable but not ranking-eligible | local draft |
| `review.publishing` | submit | loading button | `POST /reviews` pending |
| `review.publishSuccess` | API success | success panel | created `ReviewPost` |
| `review.publishError` | API fails | error + retry | API error |

### AI Match

| State | Trigger | UI | API/Data |
| --- | --- | --- | --- |
| `match.idle` | no draft/photo | route back to composer | no request |
| `match.loading` | request started | AI progress | `POST /ai/beer-match` pending |
| `match.highConfidence` | one strong candidate | primary candidate card | candidates with confidence >= threshold |
| `match.multipleCandidates` | several candidates | ranked candidate list | candidates |
| `match.lowConfidence` | weak candidates | manual search/create | low confidence |
| `match.noResults` | no candidates/search results | create new Beer prompt | empty array |
| `match.error` | API fails | manual fallback | API error |
| `match.accepted` | user selects candidate | return composer confirmed | `ConfirmedBeer` |
| `match.createdBeer` | user creates Beer | return composer confirmed | new `Beer` |

### Beer Detail

| State | Trigger | UI | API/Data |
| --- | --- | --- | --- |
| `beer.loading` | enter route | skeleton | `GET /beers/:id` pending |
| `beer.loaded` | Beer found | detail + proof feed | `BeerDetail` |
| `beer.emptyProof` | no proof reviews | explanation | empty reviews |
| `beer.notFound` | missing/deprecated Beer | not found/redirect | 404 or canonical redirect |
| `beer.error` | load fails | retry | API error |

### Leaderboard

| State | Trigger | UI | API/Data |
| --- | --- | --- | --- |
| `leaderboard.loading` | enter route/filter change | skeleton | `GET /leaderboard` pending |
| `leaderboard.loaded` | rows returned | ranking list | `LeaderboardRow[]` |
| `leaderboard.empty` | no eligible beers | empty explanation | empty array |
| `leaderboard.error` | load fails | retry | API error |
| `leaderboard.formulaOpen` | score info tap | formula sheet | local UI |

### Profile

| State | Trigger | UI | API/Data |
| --- | --- | --- | --- |
| `profile.signedOut` | no session | auth sync prompt | no profile |
| `profile.loading` | signed in | skeleton | `GET /profile/me` pending |
| `profile.loaded` | profile loaded | stats + reviews | `UserProfile` |
| `profile.emptyReviews` | no user reviews | prompt to review | empty reviews |
| `profile.error` | load fails | retry | API error |

## Frontend/API Data Contract

### Shared Primitive Types

```ts
type ID = string;
type ISODateTime = string;

type BeerStyle =
  | "IPA"
  | "Double IPA"
  | "Hazy IPA"
  | "Pilsner"
  | "Stout"
  | "Sour"
  | "Lager"
  | "Porter"
  | "Other";

type ReviewStatus = "draft" | "published" | "deleted";
type ReviewVisibility = "public" | "private";
type BeerConfirmationStatus = "unconfirmed" | "ai_suggested" | "confirmed";
type MatchConfidenceLevel = "high" | "medium" | "low" | "none";
```

### Core DTOs

```ts
interface UserProfileDto {
  id: ID;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  reviewCount: number;
  averageGivenRating: number;
  topStyle?: BeerStyle;
}

interface BreweryDto {
  id: ID;
  name: string;
  country?: string;
}

interface BeerSummaryDto {
  id: ID;
  name: string;
  brewery: BreweryDto;
  style: BeerStyle;
  abv?: number;
  imageUrl?: string;
}

interface BeerStatsDto {
  averageRating: number;
  verifiedReviewCount: number;
  likeCount: number;
  rank?: number;
  rankScope?: string;
  rankScore?: number;
  updatedAt: ISODateTime;
}

interface FeedPostDto {
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

interface ProofReviewDto {
  id: ID;
  author: Pick<UserProfileDto, "id" | "displayName" | "avatarUrl">;
  primaryPhotoUrl?: string;
  photoUrls?: string[];
  rating: number;
  reviewText: string;
  createdAt: ISODateTime;
  likeCount: number;
}

interface BeerDetailDto {
  beer: BeerSummaryDto;
  stats: BeerStatsDto;
  proofReviews: ProofReviewDto[];
}

interface LeaderboardRowDto {
  rank: number;
  beer: BeerSummaryDto;
  averageRating: number;
  verifiedReviewCount: number;
  likeCount: number;
  rankScore: number;
  trend?: "up" | "down" | "same" | "new";
}

interface MatchReasonDto {
  type: "photo" | "label_text" | "beer_name" | "brewery" | "style" | "user_input";
  label: string;
  confidence: number;
}

interface BeerMatchCandidateDto {
  beer: BeerSummaryDto;
  confidenceScore: number;
  confidenceLevel: MatchConfidenceLevel;
  reasons: MatchReasonDto[];
}

interface BeerMatchResponseDto {
  requestId: ID;
  status: "high_confidence" | "multiple_candidates" | "low_confidence" | "no_results";
  candidates: BeerMatchCandidateDto[];
}

interface ReviewDraftDto {
  photoUrls: string[];
  localPhotoPreviewUrls: string[];
  primaryPhotoIndex: number;
  rating?: number;
  reviewText: string;
  beerNameInput: string;
  breweryInput?: string;
  styleInput?: BeerStyle;
  locationInput?: string;
  confirmedBeer?: BeerSummaryDto;
  beerConfirmationStatus: BeerConfirmationStatus;
  visibility: ReviewVisibility;
}

interface CreateReviewRequestDto {
  beerId: ID;
  photoUrls: string[];
  primaryPhotoIndex: number;
  rating: number;
  reviewText: string;
  visibility: ReviewVisibility;
  matchRequestId?: ID;
}

interface CreateReviewResponseDto {
  post: FeedPostDto;
}

interface CommentDto {
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
```

### API Endpoints

| Method | Path | Request | Response | Used By |
| --- | --- | --- | --- | --- |
| `GET` | `/feed` | query: cursor?, limit? | `{ posts: FeedPostDto[] }` | Feed |
| `GET` | `/beers/:beerId` | path | `BeerDetailDto` | Beer Detail |
| `GET` | `/beers/search` | query: q, style? | `{ beers: BeerSummaryDto[] }` | AI/manual search |
| `POST` | `/beers` | create Beer draft | `BeerSummaryDto` | Create Beer |
| `GET` | `/leaderboard` | query: style?, sort? | `{ rows: LeaderboardRowDto[] }` | Leaderboard |
| `POST` | `/reviews` | `CreateReviewRequestDto` | `CreateReviewResponseDto` | Review composer |
| `POST` | `/reviews/:postId/like` | none | `{ likeCount, viewerHasLiked }` | Feed/Beer Detail |
| `DELETE` | `/reviews/:postId/like` | none | `{ likeCount, viewerHasLiked }` | Feed/Beer Detail |
| `GET` | `/posts/:postId/comments` | query: cursor?, limit? | `{ comments: CommentDto[] }` | Comment thread |
| `POST` | `/posts/:postId/comments` | `{ body, parentCommentId? }` | `CommentDto` | Comment composer |
| `POST` | `/comments/:commentId/like` | none | `{ likeCount, viewerHasLiked }` | Comment thread |
| `DELETE` | `/comments/:commentId/like` | none | `{ likeCount, viewerHasLiked }` | Comment thread |
| `POST` | `/ai/beer-match` | image + draft metadata | `BeerMatchResponseDto` | AI Match |
| `GET` | `/profile/me` | session | `UserProfileDto & { reviews: FeedPostDto[] }` | Profile |

### Frontend Validation Contract

The frontend may enable publish only when:

```ts
Boolean(
  draft.photoUrls.length >= 1 &&
  draft.photoUrls.length <= 3 &&
  draft.rating &&
  draft.rating >= 1 &&
  draft.rating <= 5 &&
  draft.reviewText.trim().length > 0 &&
  draft.confirmedBeer?.id &&
  draft.beerConfirmationStatus === "confirmed"
);
```

The API must still revalidate the same constraints.

Ranking eligibility additionally requires:

```ts
post.visibility === "public";
```

## First Mock Data Shape

Mock data should live under the future frontend app in:

```text
code/apps/web/src/data/mock
```

Recommended mock files:

```text
mockProfiles.ts
mockBreweries.ts
mockBeers.ts
mockPosts.ts
mockComments.ts
mockLeaderboard.ts
mockAiMatches.ts
```

### Mock Profiles

```ts
export const mockProfiles: UserProfileDto[] = [
  {
    id: "user-alex",
    displayName: "Alex G.",
    avatarUrl: "/mock/avatars/alex.jpg",
    reviewCount: 18,
    averageGivenRating: 4.1,
    topStyle: "IPA"
  },
  {
    id: "user-sam",
    displayName: "Sam R.",
    avatarUrl: "/mock/avatars/sam.jpg",
    reviewCount: 42,
    averageGivenRating: 4.4,
    topStyle: "Stout"
  },
  {
    id: "user-jordan",
    displayName: "Jordan B.",
    avatarUrl: "/mock/avatars/jordan.jpg",
    bio: "Craft Beer Enthusiast",
    reviewCount: 42,
    averageGivenRating: 4.2,
    topStyle: "Hazy IPA"
  }
];
```

### Mock Breweries

```ts
export const mockBreweries: BreweryDto[] = [
  { id: "brewery-cloudburst", name: "Cloudburst Brewing", country: "US" },
  { id: "brewery-holy-mountain", name: "Holy Mountain Brewing", country: "US" },
  { id: "brewery-hop-valley", name: "Hop Valley Brewing", country: "US" },
  { id: "brewery-elysian", name: "Elysian Brewing", country: "US" },
  { id: "brewery-alchemist", name: "Alchemist", country: "US" },
  { id: "brewery-russian-river", name: "Russian River", country: "US" }
];
```

### Mock Beers

```ts
export const mockBeers: BeerSummaryDto[] = [
  {
    id: "beer-citra-ipa",
    name: "Citra IPA",
    brewery: mockBreweries[0],
    style: "IPA",
    abv: 6.5,
    imageUrl: "/mock/beers/citra-ipa.jpg"
  },
  {
    id: "beer-midnight-still",
    name: "Midnight Still",
    brewery: mockBreweries[1],
    style: "Stout",
    abv: 9.2,
    imageUrl: "/mock/beers/midnight-still.jpg"
  },
  {
    id: "beer-space-dust",
    name: "Space Dust IPA",
    brewery: mockBreweries[3],
    style: "Double IPA",
    abv: 8.2,
    imageUrl: "/mock/beers/space-dust.jpg"
  },
  {
    id: "beer-heady-topper",
    name: "Heady Topper",
    brewery: mockBreweries[4],
    style: "Double IPA",
    abv: 8.0,
    imageUrl: "/mock/beers/heady-topper.jpg"
  },
  {
    id: "beer-pliny-elder",
    name: "Pliny the Elder",
    brewery: mockBreweries[5],
    style: "Double IPA",
    abv: 8.0,
    imageUrl: "/mock/beers/pliny-elder.jpg"
  }
];
```

### Mock Feed Posts

```ts
export const mockFeedPosts: FeedPostDto[] = [
  {
    id: "post-citra-alex",
    author: mockProfiles[0],
    beer: mockBeers[0],
    primaryPhotoUrl: "/mock/posts/citra-pint.jpg",
    photoUrls: ["/mock/posts/citra-pint.jpg", "/mock/posts/citra-label.jpg"],
    rating: 4.5,
    reviewText: "Crisp, citrusy, and perfect for a sunny afternoon.",
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
    author: mockProfiles[1],
    beer: mockBeers[1],
    primaryPhotoUrl: "/mock/posts/midnight-still.jpg",
    photoUrls: ["/mock/posts/midnight-still.jpg"],
    rating: 5,
    reviewText: "Dark chocolate, espresso, and roasted malts. Dangerously smooth.",
    visibility: "public",
    createdAt: "2026-06-27T07:00:00.000Z",
    likeCount: 45,
    commentCount: 8,
    viewerHasLiked: false,
    viewerHasSaved: true,
    isRankingEligible: true
  }
];
```

### Mock Comments

```ts
export const mockCommentsByPostId: Record<string, CommentDto[]> = {
  "post-citra-alex": [
    {
      id: "comment-citra-1",
      postId: "post-citra-alex",
      author: mockProfiles[2],
      body: "This one has been on my list. The citrus note sounds exactly right.",
      createdAt: "2026-06-27T10:12:00.000Z",
      likeCount: 2,
      viewerHasLiked: false,
      replies: [
        {
          id: "comment-citra-1-reply-1",
          postId: "post-citra-alex",
          parentCommentId: "comment-citra-1",
          author: mockProfiles[0],
          body: "Worth trying fresh if you can find it.",
          createdAt: "2026-06-27T10:18:00.000Z",
          likeCount: 1,
          viewerHasLiked: false
        }
      ]
    }
  ]
};
```

### Mock Leaderboard

```ts
export const mockLeaderboardRows: LeaderboardRowDto[] = [
  {
    rank: 1,
    beer: mockBeers[3],
    averageRating: 4.8,
    verifiedReviewCount: 12000,
    likeCount: 4200,
    rankScore: 9.7,
    trend: "same"
  },
  {
    rank: 2,
    beer: mockBeers[4],
    averageRating: 4.7,
    verifiedReviewCount: 9500,
    likeCount: 3900,
    rankScore: 9.3,
    trend: "up"
  },
  {
    rank: 3,
    beer: mockBeers[2],
    averageRating: 4.6,
    verifiedReviewCount: 15000,
    likeCount: 3300,
    rankScore: 9.1,
    trend: "down"
  }
];
```

### Mock AI Matches

```ts
export const mockHighConfidenceMatch: BeerMatchResponseDto = {
  requestId: "match-high-001",
  status: "high_confidence",
  candidates: [
    {
      beer: mockBeers[2],
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

export const mockLowConfidenceMatch: BeerMatchResponseDto = {
  requestId: "match-low-001",
  status: "low_confidence",
  candidates: [
    {
      beer: mockBeers[0],
      confidenceScore: 0.42,
      confidenceLevel: "low",
      reasons: [
        { type: "style", label: "Style may be IPA", confidence: 0.48 },
        { type: "photo", label: "Image is unclear", confidence: 0.35 }
      ]
    }
  ]
};
```

## Event / Action Contract

| Event | Source Component | Expected Result |
| --- | --- | --- |
| `feed.post.openBeer` | `ReviewPostCard` | navigate `/beers/:beerId` |
| `feed.post.like` | `PostActions` | like if signed in; otherwise login sheet |
| `feed.post.comment` | `PostActions` | open `CommentThreadSheet` |
| `comments.submit` | `CommentComposer` | add comment if signed in; otherwise login sheet |
| `comments.reply` | `CommentThreadSheet` | add one-level reply if signed in |
| `nav.addReview` | `BottomNav` | navigate `/review/new` |
| `review.photo.select` | `PhotoUploader` | update draft photo preview |
| `review.photo.reorder` | `PhotoGalleryInput` | update primary photo order/index |
| `review.visibility.change` | `VisibilitySelector` | update public/private draft setting |
| `review.rating.change` | `RatingInput` | update draft rating |
| `review.match.start` | `BeerConfirmField` | navigate `/review/new/match` |
| `match.candidate.accept` | `BeerMatchCard` | set confirmed Beer, return composer |
| `match.search.select` | `BeerSearchResults` | set confirmed Beer, return composer |
| `match.beer.create` | `CreateBeerInlineForm` | create Beer draft, return composer |
| `review.publish` | `PublishReviewButton` | call `POST /reviews` |
| `beer.addReview` | `AddMyReviewButton` | signed in: composer with Beer; signed out: login sheet |
| `leaderboard.row.open` | `RankingRow` | navigate `/beers/:beerId` |
| `profile.login` | `AuthSyncPrompt` | start Supabase Google login |

## Missing Data / Decision Checklist

These items should be reviewed before entering `Node 4: Architecture` and `Node 5: Scaffold`.

### Product / UX Decisions

| Item | Current Default | Need User Confirmation? |
| --- | --- | --- |
| App language | Browser language detection, Traditional Chinese + English | Confirmed |
| Rating scale | 1-5 stars, decimals allowed in aggregates | MVP default accepted |
| Review text required | Required for MVP | MVP default accepted |
| Photo count | Up to 3 photos; first is primary | Confirmed |
| Comments | Comment thread included in UIUX before API implementation | Confirmed |
| Save/bookmark | UI placeholder only in first MVP; persistence later | MVP default accepted |
| Visibility | Public/private per post; only public counts toward rankings | Confirmed |
| Public profiles | Public profile page visible for public reviews | MVP default accepted |
| Location | Optional text/location display | MVP default accepted |

### UI States Still Missing In Figma

| Missing State | Impact | Workaround For First Code Pass |
| --- | --- | --- |
| Publish success | Publish flow ends abruptly | Inline success panel in composer |
| Create new Beer | Low-confidence flow incomplete | Inline minimal create Beer form |
| AI no results | Search fallback incomplete | Empty state + create Beer CTA |
| Comment thread | First-pass UIUX frame added | Visual refinement before implementation |
| Visibility selector | First-pass UIUX frame added | Visual refinement before implementation |
| Multi-photo upload/reorder | First-pass UIUX frame added | Visual refinement before implementation |
| Upload failed | Error handling not visible | Standard error alert/state |
| Feed empty | New app state missing | EmptyState component |
| Leaderboard empty | Ranking proof state missing | EmptyState component |
| Profile signed-out only | Current frame blends sync/profile | Conditional profile section |
| Score formula sheet | Trust explanation not detailed | Simple modal/sheet |

### Technical Decisions

| Item | Current Default | Need Before Scaffold? |
| --- | --- | --- |
| Monorepo tool | npm workspaces | Use for Scaffold |
| Web port | `6666` | Use for Scaffold |
| API port | `3001` | Use for Scaffold |
| Local Docker usage | optional service simulation | Define in Architecture Node |
| Supabase local vs hosted during MVP | hosted Supabase for integration; mock first | Define in Architecture Node |
| API auth verification | Supabase JWT verification in NestJS | Architecture Node |
| Image handling in first code pass | mock local URLs before Supabase Storage | Use for Frontend MVP |

### Data Decisions

| Item | Current Default | Need Before API/DB |
| --- | --- | --- |
| Beer style enum | small fixed list | MVP default accepted |
| ABV | optional number | MVP default accepted |
| Brewery country/location | optional | MVP default accepted |
| Beer duplicate handling | `needs_review` / future merge | Later |
| Ranking formula | `average_rating * log10(count + 1) + likes * 0.05` | MVP default accepted |
| Ranking update timing | query/view first, job later | Architecture Node |
| User-created Beer moderation | out of MVP, stored as needs_review | MVP default accepted |

## Node 3 Exit Gate

Node 3 can be considered ready for Architecture/Scaffold when:

- Route map is accepted.
- Component map is accepted.
- UI state table is accepted.
- DTO/API shapes are accepted as first-pass mock contract.
- Missing data checklist is reviewed.
- Decisions needed before scaffold are either answered or explicitly deferred.

Current exit gate result:

- Route map: accepted for architecture.
- Component map: accepted for architecture.
- UI state table: accepted for architecture.
- DTO/API shapes: accepted as first-pass mock contract.
- Missing UI states: first-pass Figma frames added.
- Remaining architecture-only decisions: Docker profile, Supabase integration timing, JWT verification pattern, ranking query implementation.
