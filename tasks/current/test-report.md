# Test Report - BeerRank MVP L12

Date: 2026-06-28
Scope: L12 QA and release gate for current Zeabur MVP preview.

## Environment

| Surface | URL | Result |
| --- | --- | --- |
| Web | `https://beer-rank.zeabur.app/` | pass |
| API | `https://api-beer-rank.zeabur.app/api` | pass |
| Swagger | `https://api-beer-rank.zeabur.app/api/docs` | pass |
| Database | Zeabur PostgreSQL via `DATABASE_URL` | pass |

## Acceptance Criteria

| AC | Check | Result |
| --- | --- | --- |
| AC1 | Web and API production builds pass locally. | pass |
| AC2 | API health confirms DB is configured and connected. | pass |
| AC3 | Core read endpoints return live DB data. | pass |
| AC4 | AI match endpoint returns a catalog Beer candidate with real Zeabur AI Hub provider. | pass |
| AC5 | Review publish persists to DB and becomes leaderboard eligible when public, photo-backed, rated, and Beer-confirmed. | pass |
| AC6 | Created review appears in feed and Beer Detail proof reviews. | pass |
| AC7 | Comment persistence works on a newly published review. | pass |
| AC8 | Leaderboard returns expected ranking and cleans up correctly after temporary QA data is removed. | pass |
| AC9 | Deployed review composer renders real form state: textarea, rating range, photo actions, disabled publish until ready. | pass |
| AC10 | Deployed AI match page is gated by uploaded photo state. | pass |

## Verification Log

| Check | Evidence | Result |
| --- | --- | --- |
| Web build | `npm run build` in `code/apps/web` | pass |
| API build | `npm run build` in `code/apps/api` | pass |
| Health | `/api/health` returned `ok=true`, `db.connected=true`, `database=zeabur` | pass |
| Swagger | `/api/docs` returned `200` and Swagger UI content | pass |
| Feed/read APIs | `/feed`, `/leaderboard`, `/beers/beer-citra-ipa`, `/beers?query=citra`, `/posts/post-citra-alex/comments`, `/me` | pass |
| Upload API | `/uploads/review-photos` returned one mock upload result | pass |
| AI API | `/ai/beer-match` returned `high_confidence`, top candidate `beer-citra-ipa` | pass |
| Publish API | `/reviews` created temporary public review with `leaderboardEligible=true` | pass |
| Comment API | `/posts/{reviewId}/comments` created and returned a temporary comment | pass |
| Cleanup | Temporary review/comment removed from DB; leaderboard returned to baseline count | pass |
| Deployed Web | `/review/new` rendered `新增酒評`, textarea, rating range, disabled publish button | pass |
| Deployed Web | `/review/new/match` without photos rendered `需要先上傳照片` and hid manual Beer panel | pass |
| Deployed Web | `/leaderboard` rendered live Citra IPA data after API load | pass |

## Findings

- Pass for current MVP preview release gate.
- The first AI QA attempt used an invalid tiny JPEG data URL and Zeabur AI Hub correctly rejected it. Retest with a valid public image URL passed.
- The MVP still uses mock photo storage. Photos from real browser uploads may not survive service restarts until durable object storage is added.
- The MVP still uses temporary profile-header/mock profile auth. Google login remains outside this release gate.
- `needs_review` Beer moderation is intentionally deferred.

## Decision

L12 release gate: pass for MVP preview deployment.

Production hardening remains required before a wider public launch:

- Supabase Google Auth profile sync.
- Durable photo storage.
- Manual moderation flow for `needs_review` Beer.
- Full browser publish test with a real user-selected image file after durable storage is in place.
