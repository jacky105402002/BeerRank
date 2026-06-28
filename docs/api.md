# API Contract

Status: Mock contract in progress

Current contract sources:

- `docs/specs/feature-beer-rating-mvp-flow-contract.md`
- `docs/specs/feature-beer-rating-mvp-architecture.md`
- `C:\code\BeerRank\code\packages\shared\src\index.ts`
- `C:\code\BeerRank\code\apps\api\src\app.controller.ts`

The MVP API surface must cover:
- Auth session access.
- Profile read/update.
- Beer create/search/read.
- AI beer matching suggestions from image + metadata.
- Rating post create/read/delete.
- Up to 3 review photos with first photo as primary.
- Public/private review visibility.
- Comment thread read/create.
- Image upload URL or storage flow.
- Like/unlike post.
- Leaderboard query.
- Beer detail and related posts query.

## Local Base URL

```text
http://127.0.0.1:3001/api
```

Swagger UI:

```text
http://127.0.0.1:3001/api/docs
```

OpenAPI JSON:

```text
http://127.0.0.1:3001/api/docs-json
```

## Implemented Mock Endpoints

| Method | Path | Response |
| --- | --- | --- |
| `GET` | `/health` | Mock API and PostgreSQL health status |
| `GET` | `/me` | `CurrentUserResponseDto` |
| `GET` | `/feed` | `ListResponseDto<FeedPostDto>` |
| `GET` | `/leaderboard?style=IPA` | `ListResponseDto<LeaderboardRowDto>` |
| `GET` | `/beers/:beerId` | `BeerDetailDto` |
| `GET` | `/posts/:postId/comments` | `ListResponseDto<CommentDto>` |
| `POST` | `/ai/beer-match` | `BeerMatchResponseDto` |
| `POST` | `/uploads/review-photos` | `UploadReviewPhotosResponseDto` |
| `POST` | `/reviews` | `CreateReviewResponseDto` |
| `POST` | `/posts/:postId/comments` | `CreateCommentResponseDto` |

## Auth Foundation

As of L05, protected writes no longer hardcode the author profile inside the write service.

Temporary MVP auth behavior:

- `GET /me`, `POST /reviews`, and `POST /posts/:postId/comments` accept `x-beerrank-profile-id`.
- If the header is missing, API falls back to `MOCK_PROFILE_ID`.
- If `MOCK_PROFILE_ID` is missing, API falls back to `user-jordan`.
- When `DATABASE_URL` is configured, `/me` resolves the profile from PostgreSQL.

Example:

```http
GET /api/me
x-beerrank-profile-id: user-alex
```

Environment variables:

```text
AUTH_PROVIDER=mock
MOCK_PROFILE_ID=user-jordan
AI_PROVIDER=mock
```

`AUTH_PROVIDER` is documented now for the future Supabase switch. Current runtime behavior is still mock/profile-header based.

## Photo Upload Foundation

As of L06, the frontend can select up to 3 image files, compress them in-browser, and call:

```http
POST /api/uploads/review-photos
```

Request:

```json
{
  "files": [
    {
      "fileName": "beer-proof.jpg",
      "mimeType": "image/jpeg",
      "dataUrl": "data:image/jpeg;base64,..."
    }
  ]
}
```

Response:

```json
{
  "photos": [
    {
      "url": "data:image/jpeg;base64,...",
      "fileName": "beer-proof.jpg",
      "mimeType": "image/jpeg",
      "sortOrder": 1,
      "isPrimary": true,
      "storageProvider": "mock"
    }
  ]
}
```

Rules:

- 1 to 3 photos per review.
- First returned photo is primary.
- Only image data URLs are accepted in the current mock provider.
- Frontend compresses selected photos to JPEG before upload.
- `STORAGE_PROVIDER=mock` is the current deploy-safe foundation.

Pending real storage:

- Replace `StorageService` internals with Supabase Storage or another object store.
- Keep the upload response shape stable so `/reviews` can continue receiving `photoUrls`.

## AI Matching Contract

As of L07, `POST /ai/beer-match` is routed through a provider adapter instead of returning inline mock data from the controller.

Current provider:

```text
AI_PROVIDER=mock
```

Future provider:

```text
AI_PROVIDER=zeabur
AI_BASE_URL=https://hnd1.aihub.zeabur.ai/
AI_API_KEY=<server-side Zeabur AI Hub key>
AI_MODEL=gpt-5.1
```

Official OpenAI provider:

```text
AI_PROVIDER=openai
OPENAI_API_KEY=<server-side key>
OPENAI_MODEL=gpt-4.1-mini
```

Request:

```json
{
  "photoUrls": ["https://example.com/beer-photo.jpg"],
  "beerName": "Space Dust IPA",
  "breweryName": "Elysian Brewing",
  "styleHint": "Double IPA",
  "locale": "zh-TW",
  "mode": "high"
}
```

Response:

```json
{
  "requestId": "match-...",
  "status": "high_confidence",
  "candidates": [
    {
      "beer": {
        "id": "beer-space-dust",
        "name": "Space Dust IPA"
      },
      "confidenceScore": 0.98,
      "confidenceLevel": "high",
      "reasons": [
        {
          "type": "label_text",
          "label": "Label text matched Space Dust IPA",
          "confidence": 0.97
        }
      ]
    }
  ]
}
```

Audit behavior:

- When `DATABASE_URL` is configured, every match response is persisted to `beer_match_suggestions`.
- Each candidate becomes one audit row.
- `no_results` creates an audit row with `beer_id=null`, `confidence_level=none`, and `confidence_score=0`.
- `raw_response` stores the normalized request and response for later debugging.

Product boundary:

- AI suggestions never confirm a Beer automatically.
- User confirmation remains the only source of truth before `POST /reviews`.
- AI keys stay server-side; the frontend only calls BeerRank API.

## Real AI Vision/Text Matching

As of L08, `AI_PROVIDER=openai` and `AI_PROVIDER=zeabur` are implemented behind the same `AiMatchService` adapter used by the mock provider.

Behavior:

- The official OpenAI adapter sends user hints plus up to 3 review photos to the Responses API.
- The Zeabur AI Hub adapter uses OpenAI-compatible Chat Completions with text and image URL content.
- The model is instructed to choose only Beer ids from the server-side Beer catalog.
- Unknown or invented Beer ids are filtered out by BeerRank API.
- If no catalog candidate survives filtering, the response becomes `no_results`.
- User confirmation remains required before publishing a review.

Required Zeabur API environment variables:

```text
AI_PROVIDER=zeabur
AI_BASE_URL=https://hnd1.aihub.zeabur.ai/
AI_API_KEY=<server-side Zeabur AI Hub key>
AI_MODEL=gpt-5.1
```

Current verification status:

- Mock provider is fully smoke-tested.
- Official OpenAI provider compiles and safely fails when `OPENAI_API_KEY` is missing.
- Zeabur AI Hub provider compiles and safely fails when `AI_API_KEY` is missing.
- Live AI matching still needs a real API key in the API service environment.

## MVP Ranking Rule In API

`POST /reviews` marks a review as leaderboard eligible only when:

- visibility is `public`
- at least one photo exists
- rating is greater than zero
- the submitted `beerId` resolves to a known Beer

This is still mock logic. Supabase integration will replace storage and persistence later, but the response shape should remain stable unless the frontend flow changes.

## Database Health

`GET /health` checks `DATABASE_URL` when it is configured.

Expected deployed response after Zeabur PostgreSQL is connected:

```json
{
  "ok": true,
  "service": "BeerRank API",
  "mode": "mock",
  "db": {
    "configured": true,
    "connected": true,
    "database": "zeabur"
  }
}
```

## Database-Backed Read Endpoints

As of L02, these endpoints read from PostgreSQL when `DATABASE_URL` is configured, with mock fallback for local development without DB:

- `GET /feed`
- `GET /leaderboard`
- `GET /beers/:beerId`
- `GET /posts/:postId/comments`

`POST /reviews` writes to PostgreSQL when `DATABASE_URL` is configured, with mock fallback for local development without DB.

L03/L05 rules:

- API resolves the current profile through the L05 auth foundation.
- A review can include 1 to 3 `photoUrls`.
- Photo `sort_order = 1` is the primary image.
- Public, published, confirmed reviews with at least one photo become leaderboard eligible.
- Private reviews are persisted but do not enter `eligible_reviews`.

## Comment Persistence

As of L04, comments are database-backed when `DATABASE_URL` is configured.

Implemented endpoints:

- `GET /posts/:postId/comments`
- `POST /posts/:postId/comments`

`POST /posts/:postId/comments` accepts:

```json
{
  "body": "This looks great fresh.",
  "parentCommentId": "comment-citra-1"
}
```

Rules:

- `body` is required.
- `parentCommentId` is optional.
- Replies are limited to one level.
- Comment writes resolve the author through the L05 auth foundation.
