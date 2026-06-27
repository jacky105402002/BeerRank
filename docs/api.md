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
| `GET` | `/health` | Mock API health status |
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
