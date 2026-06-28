# BeerRank MVP Loop Backlog

Status: Active execution list
Last updated: 2026-06-28

This backlog lists the missing BeerRank MVP work as loop-sized items. Each item should be executed one at a time:

1. Confirm intent and acceptance criteria.
2. Check UIUX / route / API contract.
3. Implement the smallest useful slice.
4. Verify locally and on Zeabur when relevant.
5. Update docs and move to the next item.

## Verified Baseline

- Frontend: `https://beer-rank.zeabur.app/`
- API: `https://api-beer-rank.zeabur.app/api`
- Swagger: `https://api-beer-rank.zeabur.app/api/docs`
- DB health: `/api/health` returns `db.configured=true`, `db.connected=true`, `database=zeabur`
- Current API mode: `mock`

## Missing MVP Work

| ID | Loop Item | Node | Status | Exit Gate |
| --- | --- | --- | --- | --- |
| L01 | DB schema and migration | Node 8 | done | Tables and seed data exist; migration is repeatable. |
| L02 | API reads from PostgreSQL | Node 8 | done | Feed, leaderboard, beer detail, comments read seeded DB data. |
| L03 | Review publish persistence | Node 8 | done | `POST /api/reviews` writes review/photos and survives refresh. |
| L04 | Comment persistence | Node 8 | done | Comments and one-level replies are stored and returned from DB. |
| L05 | Auth foundation | Node 8 | next | Google login identifies the current user; mock user removed from protected writes. |
| L06 | Photo upload and storage | Node 8 | pending | Up to 3 photos upload; first photo is primary; public URLs render. |
| L07 | AI matching contract hardening | Node 9 | pending | Mock and real providers share one adapter contract; suggestions are auditable. |
| L08 | Real AI vision/text matching | Node 9 | pending | Server-side AI suggests candidates from photos and metadata. |
| L09 | Manual beer search and create Beer | Node 8/9 | pending | User can search existing Beer or create `needs_review` Beer when AI fails. |
| L10 | Leaderboard aggregation | Node 8 | pending | Only eligible public reviews count; Beer Detail proof count matches ranking. |
| L11 | Frontend form completion | Node 6/8 | pending | Review composer uses real inputs/API states instead of polished mock values. |
| L12 | QA and release gate | Node 10/11 | pending | End-to-end public MVP flow passes on mobile and desktop. |

## L01 - DB Schema And Migration

Scope:

- `profiles`
- `breweries`
- `beers`
- `reviews`
- `review_photos`
- `comments`
- `post_reactions`
- `beer_match_suggestions`
- `schema_migrations`

Acceptance criteria:

- Done: migration can run safely more than once.
- Done: seed data recreates the current demo feed foundation.
- Done: ranking eligibility fields and `eligible_reviews` view exist in DB.
- Done: no real DB password is committed.

Verification:

```text
profiles=3
breweries=5
beers=5
reviews=2
review_photos=3
comments=2
post_reactions=3
beer_match_suggestions=1
schema_migrations=2
```

Loopback triggers:

- Public/private review rules do not fit the schema.
- Ranking eligibility requires frontend-only logic.
- Photo ordering cannot represent the primary image.

## L02 - API Reads From PostgreSQL

Scope:

- `GET /api/feed`
- `GET /api/leaderboard`
- `GET /api/beers/:beerId`
- `GET /api/posts/:postId/comments`

Acceptance criteria:

- Done locally against Zeabur DB: API returns seeded DB data.
- Done locally against Zeabur DB: leaderboard reads `beer_leaderboard`.
- Done locally against Zeabur DB: Beer Detail shows proof reviews from DB.
- Pending deploy verification: frontend still works after Zeabur API redeploy.

Verification:

```text
GET /api/health -> 200
GET /api/feed -> 200
GET /api/leaderboard -> 200
GET /api/beers/beer-citra-ipa -> 200
GET /api/posts/post-citra-alex/comments -> 200
```

## L03 - Review Publish Persistence

Scope:

- Create review row.
- Create up to 3 photo rows.
- First photo is primary by sort order.
- Store visibility.
- Store confirmed `beer_id`.
- Return `leaderboardEligible`.

Acceptance criteria:

- Done locally against Zeabur DB: publishing a public review changes `/api/feed`.
- Done locally against Zeabur DB: public eligible reviews appear in Beer Detail proof feed.
- Done locally against Zeabur DB: private reviews return `leaderboardEligible=false` and do not affect `eligible_reviews`.
- Done locally against Zeabur DB: refreshing API responses keeps the published review.

Verification:

```text
POST /api/reviews public -> 201
GET /api/feed -> includes created review
GET /api/beers/beer-citra-ipa -> includes created proof review
POST /api/reviews private -> 201 with leaderboardEligible=false
```

## L04 - Comment Persistence

Scope:

- `GET /api/posts/:postId/comments`
- `POST /api/posts/:postId/comments`
- One-level nested replies for MVP

Acceptance criteria:

- Done locally against Zeabur DB: comments are stored in DB.
- Done locally against Zeabur DB: one-level replies are stored and nested under parent comments.
- Done locally against Zeabur DB: nested replies beyond one level return `400`.
- Done locally against Zeabur DB: comment count updates in feed responses.
- Temporary behavior: writes use mock current profile `user-jordan` until L05 Auth.

Verification:

```text
POST /api/posts/post-citra-alex/comments root -> 201
POST /api/posts/post-citra-alex/comments reply -> 201
GET /api/posts/post-citra-alex/comments -> nested replies returned
GET /api/feed -> comment count reflects DB comments
POST nested reply beyond one level -> 400
```

## L05 - Auth Foundation

Decision needed:

- Supabase Auth with Zeabur PostgreSQL as app DB
- Supabase Auth + Supabase PostgreSQL/Storage
- Direct OAuth handled by NestJS

Recommended MVP path:

Use Supabase Auth for Google login while keeping Zeabur PostgreSQL as the app DB for now.

Acceptance criteria:

- User can sign in with Google.
- API can identify current user.
- `profiles` record is created or synced.
- Protected actions stop using hardcoded mock user.

## L06 - Photo Upload And Storage

Decision needed:

- Supabase Storage
- Cloudflare R2
- S3-compatible storage
- Zeabur-supported object storage, if available

Acceptance criteria:

- User can upload up to 3 images.
- First image is primary.
- API stores photo URLs and sort order.
- Public photos render in feed, beer detail, and profile.

## L07 - AI Matching Contract Hardening

Scope:

- Define `AI_PROVIDER=mock|openai`.
- Define server-side adapter interface.
- Request includes image URLs, optional beer name, optional brewery, style hint, and locale.
- Response includes candidates, confidence score, confidence level, and reasons.
- Persist `beer_match_suggestions`.

Acceptance criteria:

- Mock provider and future real provider share the same interface.
- AI suggestions are stored for audit.
- User confirmation remains final.
- No AI key is exposed to frontend.

## L08 - Real AI Vision/Text Matching

Scope:

- Server-side AI call only.
- Compare provider output with Beer catalog.
- Return ranked existing Beer candidates.
- Fall back to manual search/create Beer.

Acceptance criteria:

- High-confidence path can suggest an existing Beer.
- Low-confidence path asks for manual confirmation.
- No-results path can create a Beer draft.
- API never auto-confirms Beer.

## Recommended Next Item

Start with:

```text
L01 - DB Schema And Migration
```

Reason:

AI matching, review publish, leaderboard, comments, and profile all depend on canonical Beer/review/photo tables. Without schema and seed data, AI suggestions and user confirmations have nowhere trustworthy to persist.
