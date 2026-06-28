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
| `POST` | `/reviews` | `CreateReviewResponseDto` |

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

L03 rules:

- API currently uses mock current profile `user-jordan` until Auth is implemented.
- A review can include 1 to 3 `photoUrls`.
- Photo `sort_order = 1` is the primary image.
- Public, published, confirmed reviews with at least one photo become leaderboard eligible.
- Private reviews are persisted but do not enter `eligible_reviews`.
