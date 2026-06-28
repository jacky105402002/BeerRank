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
| L05 | Auth foundation | Node 8 | in_progress | Profile-header foundation is done; Supabase Google login remains pending. |
| L06 | Photo upload and storage | Node 8 | in_progress | Mock upload foundation is done; Supabase/object storage remains pending. |
| L07 | AI matching contract hardening | Node 9 | done | Mock provider uses adapter contract; suggestions are auditable. |
| L08 | Real AI vision/text matching | Node 9 | in_progress | Zeabur/OpenAI-compatible providers are implemented; live API-key verification remains pending. |
| L09 | Manual beer search and create Beer | Node 8/9 | done | User can search existing Beer or create `needs_review` Beer when AI fails. |
| L10 | Leaderboard aggregation | Node 8 | done | Only eligible public reviews count; Beer Detail proof count matches ranking. |
| L11 | Frontend form completion | Node 6/8 | done | Review composer uses real inputs/API states instead of polished mock values. |
| L12 | QA and release gate | Node 10/11 | done | End-to-end public MVP preview flow passes with known auth/storage limitations. |

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

Implemented foundation:

- `AuthService` resolves current profile from `x-beerrank-profile-id`.
- Missing header falls back to `MOCK_PROFILE_ID`, then `user-jordan`.
- `GET /api/me` reads the current profile from PostgreSQL when DB is configured.
- `POST /api/reviews` no longer hardcodes `user-jordan` inside write logic.
- `POST /api/posts/:postId/comments` no longer hardcodes `user-jordan` inside write logic.
- Swagger documents the temporary MVP profile header.

Still needed for full L05 completion:

- Supabase Auth with Zeabur PostgreSQL as app DB
- Supabase Auth + Supabase PostgreSQL/Storage
- Direct OAuth handled by NestJS

Recommended MVP path:

Use Supabase Auth for Google login while keeping Zeabur PostgreSQL as the app DB for now.

Acceptance criteria:

- Pending: User can sign in with Google.
- Done: API can identify current user through the temporary auth foundation.
- Pending: `profiles` record is created or synced from OAuth identity.
- Done: Protected actions stop using hardcoded mock user.

## L06 - Photo Upload And Storage

Implemented foundation:

- `POST /api/uploads/review-photos` accepts 1 to 3 image data URLs.
- API validates image data URLs and maximum count.
- Response returns ordered photo URLs with `sortOrder` and `isPrimary`.
- Frontend can select photos from file input.
- Frontend compresses selected photos to JPEG before upload.
- Review composer uses uploaded photo URLs for publish.

Still needed for full L06 completion:

- Supabase Storage
- Cloudflare R2
- S3-compatible storage
- Zeabur-supported object storage, if available

Acceptance criteria:

- Done: User can upload up to 3 images through the MVP mock storage provider.
- Done: First image is primary.
- Done: API returns photo URLs and sort order.
- Pending real storage: API stores objects in a durable public bucket.
- Pending real storage: Public photos survive deploy restarts and render in feed, beer detail, and profile.

## L07 - AI Matching Contract Hardening

Implemented:

- `AI_PROVIDER=mock|openai` is documented.
- `AiMatchService` routes matching through a provider adapter.
- Mock provider returns the same response shape expected from a future real provider.
- Request includes image URLs, optional beer name, optional brewery, style hint, locale, and test mode.
- Response includes candidates, confidence score, confidence level, and reasons.
- DB-backed API persists `beer_match_suggestions` audit rows.
- `no_results` is auditable with `beer_id=null`.
- Frontend sends draft photo URLs and locale to the match endpoint.

Acceptance criteria:

- Done: Mock provider and future real provider share one adapter interface.
- Done: AI suggestions are stored for audit when DB is configured.
- Done: User confirmation remains final.
- Done: No AI key is exposed to frontend.

## L08 - Real AI Vision/Text Matching

Implemented:

- Server-side OpenAI provider behind `AiMatchService`.
- Server-side Zeabur AI Hub OpenAI-compatible provider behind `AiMatchService`.
- Official OpenAI adapter uses Responses API-style multimodal request with `input_text` and `input_image`.
- Zeabur adapter uses OpenAI-compatible Chat Completions with text and image URL content.
- Sends Beer catalog to the provider and asks for catalog beer ids only.
- Filters unknown/invented Beer ids after provider response.
- Returns ranked existing Beer candidates.
- Falls back to `no_results` when no valid catalog candidate remains.
- Keeps AI keys server-side through `OPENAI_API_KEY`.

Acceptance criteria:

- Done in code: High-confidence path can suggest an existing Beer.
- Done in contract: Low-confidence path asks for manual confirmation.
- Pending UI/API loop: No-results path can create a Beer draft.
- Done: API never auto-confirms Beer.
- Pending live verification: Zeabur AI Hub key is configured in Zeabur and real image matching is smoke-tested.

## L09 - Manual Beer Search And Create Beer

Implemented:

- `GET /api/beers?query=` searches Beer name, brewery name, and style.
- `POST /api/beers` creates a Beer draft with `status=needs_review`.
- Existing brewery rows are reused.
- Existing same-brewery same-name Beer rows are returned instead of duplicated.
- Frontend AI match screen includes manual search.
- Frontend AI match screen can create a draft Beer and return it to the review composer.

Acceptance criteria:

- Done: User can search existing Beer when AI is low-confidence or returns no result.
- Done: User can manually select an existing Beer.
- Done: User can create a `needs_review` Beer draft.
- Done: Created/selected Beer can be used as the review's confirmed Beer for the MVP flow.
- Pending future moderation: `needs_review` Beer approval workflow.

## L10 - Leaderboard Aggregation

Implemented:

- `eligible_reviews` now requires confirmed Beer (`beers.status = 'confirmed'`).
- `needs_review` Beer reviews can exist, but they do not enter leaderboard aggregation.
- `beer_leaderboard` aggregates likes per review before ranking, preventing like joins from duplicating review counts.
- Ranking score remains `average_rating * log(verified_review_count + 1) + like_count * 0.05`.
- Beer Detail proof reviews and leaderboard stats read from the same eligibility rule.

Acceptance criteria:

- Done on Zeabur DB: public, published, photo-backed reviews for confirmed Beer enter `eligible_reviews`.
- Done on Zeabur DB: reviews for `needs_review` Beer do not enter `eligible_reviews`.
- Done on Zeabur DB: multiple likes on one review do not inflate `verified_review_count`.
- Done on deployed API: `/api/leaderboard` and `/api/beers/beer-citra-ipa` return matching verified proof counts.

Verification:

```text
npm run build (api) -> pass
npm run build (web) -> pass
npm run db:migrate -> applied 003_leaderboard_aggregation
temporary DB probe -> confirmed Beer ranked, needs_review Beer excluded, like count = 2, review count = 1
GET /api/leaderboard -> 200
GET /api/beers/beer-citra-ipa -> 200, verifiedReviewCount=2, proofReviews.length=2
```

## L11 - Frontend Form Completion

Implemented:

- Review draft now stores real `reviewText` instead of publishing a fixed mock note.
- Photo upload supports adding up to 3 photos, removing photos, and moving a secondary photo to primary.
- Publish button requires photo, confirmed Beer, rating, and a non-empty tasting note.
- Rating can be changed through star buttons or a range control.
- Successful publish resets the draft and links the success action to the published Beer detail.
- AI Match is treated as part of the review flow: without uploaded photos, the page asks the user to return to the review form instead of exposing standalone AI/manual actions.
- Manual search/create Beer remains available after photos exist.

Acceptance criteria:

- Done locally: Review composer no longer uses fixed mock review text.
- Done locally: User can edit rating and tasting note before publish.
- Done locally: User can manage the 1 to 3 review photos before publish.
- Done locally: AI match is gated by uploaded photo state.
- Pending QA: Full browser publish flow with a user-selected image file should be tested manually before public release.

Verification:

```text
npm run build (web) -> pass
npm run build (api) -> pass
GET http://localhost:6677/review/new -> 200
browser smoke: review page has textarea, rating range, upload label, publish disabled until ready
browser smoke: /review/new/match without photos shows guard and hides manual Beer panel
```

## L12 - QA And Release Gate

Implemented:

- Local production builds verified for Web and API.
- Zeabur API health verified with PostgreSQL connected.
- Swagger UI verified on deployed API.
- Live API read endpoints verified against Zeabur DB.
- End-to-end API flow verified: upload, AI match, publish review, comment, feed/detail visibility, leaderboard eligibility.
- Temporary QA review/comment data was cleaned from DB after verification.
- Deployed web routes verified for review composer, AI match guard, and leaderboard live data rendering.
- `tasks/current/test-report.md` replaced with a readable L12 QA report.

Acceptance criteria:

- Done: Web and API builds pass.
- Done: Zeabur API and Swagger are reachable.
- Done: DB-backed feed, leaderboard, beer detail, search, comments, and current user endpoints respond.
- Done: AI matching returns an existing Beer candidate with live provider config.
- Done: Public review publish persists and becomes leaderboard eligible.
- Done: Published review appears in feed and Beer Detail proof reviews.
- Done: Comment persistence works for the newly published review.
- Done: Deployed review composer renders real form controls and guarded publish state.
- Done: Deployed AI Match route is gated by uploaded-photo state.

Release decision:

- Pass for MVP preview deployment.
- Not yet a full production launch because Google Auth, durable photo storage, and Beer moderation remain pending.

Verification:

```text
npm run build (web) -> pass
npm run build (api) -> pass
GET /api/health -> ok=true, db.connected=true
GET /api/docs -> 200
API E2E -> upload, AI match, review publish, comment, feed/detail/ranking checks pass
Deployed web /review/new -> real composer state rendered
Deployed web /review/new/match -> no-photo guard rendered
Deployed web /leaderboard -> live Citra IPA ranking rendered
```

## Recommended Next Item

Start with:

```text
Post-MVP Hardening
```

Reason:

The current MVP preview has passed the release gate. The next work should choose whether to harden Auth, durable photo storage, or Beer moderation first.
