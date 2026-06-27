# Design Brief — BeerRank Social Rating MVP

## Goal
Create a working local prototype that Open Design can use as the UIUX baseline for BeerRank's feed, posting flow, AI beer matching flow, beer detail page, and leaderboard.

## Audience
- Beer lovers posting tasting photos from mobile.
- Craft beer enthusiasts comparing ranked beers.
- Discovery users scanning popular beers before buying or ordering.

## Screens
- Feed: recent beer rating posts with photo, rating, note, like action.
- Composer: quick beer review post form with beer, brewery, style, rating, photo action, note.
- Leaderboard: ranked beers with score, rating count, and like count.
- AI beer matching confirmation: after upload/input, suggest existing beer matches or create a new beer.
- Beer detail: aggregate all posts/reviews from users who actually posted that they drank this beer.
- Auth entry: third-party login CTA.

## Visual Direction
- Social product feel with structured ranking surfaces.
- Warm accent color, neutral paper background, high readability.
- Avoid a fully dark bar-like palette so ratings and lists stay scan-friendly.

## Device Targets
- Desktop: 1280px and above.
- Tablet: 768px to 1100px.
- Mobile: 360px to 720px.

## Required States
- Logged-out auth prompt.
- Composer empty form.
- AI matching loading state.
- AI matching suggested match state.
- AI matching low-confidence state.
- Beer detail loaded state.
- Feed loaded with posts.
- Leaderboard loaded with ranked beers.
- Future states to design: loading, empty feed, upload error, validation error.

## Open Design Prompt Draft

```text
請為 BeerRank 設計一版 Web App MVP 的 UIUX prototype。

BeerRank 是一個「啤酒版 IG + 評分 + 排行榜」的社群產品。使用者可以用第三方帳號登入，上傳一張啤酒照片，輸入或確認啤酒資訊，給 1-5 分整體評分，寫短評，發佈成酒評貼文。其他使用者可以瀏覽 feed、按讚，並查看啤酒排行榜。

BeerRank 最重要的產品邏輯：
- 一篇酒評貼文代表「這個人真的喝過這款啤酒」。
- 只有有照片與評分的發文，才會納入該啤酒的排行榜與評價統計。
- 使用者上傳照片與啤酒資訊後，系統要透過 AI 協助辨識/匹配到既有 Beer。
- 如果 AI 找到可能的既有 Beer，要讓使用者在發布前確認。
- 如果 AI 信心不足，要讓使用者手動搜尋既有 Beer 或建立新 Beer。
- 發布後，該貼文會歸屬到對應的 Beer detail page，其他人可以看到所有喝過這款啤酒的人留下的評價。

請參考目前本地 prototype：
http://localhost:6666/

目標不是做 marketing landing page，而是直接設計實際可用的產品介面。

請產出以下畫面：

1. Feed 首頁
- 顯示近期酒評貼文
- 每篇貼文包含：使用者、時間、照片、啤酒名稱、酒廠、風格、地點、整體評分、短評、按讚、收藏
- 貼文上的啤酒名稱可以點進 Beer detail page
- 未登入時仍可瀏覽，但發文/按讚時要引導登入

2. 發佈酒評流程
- 快速新增一篇酒評
- 欄位包含：照片、啤酒名稱、酒廠、風格、整體評分、短評
- 設計手機優先，操作要像社群 app 一樣輕快
- 需要清楚的必填狀態、錯誤狀態、圖片上傳失敗狀態

3. AI 啤酒匹配確認流程
- 使用者上傳照片與輸入啤酒資訊後，顯示 AI 正在辨識/匹配的 loading state
- 若找到可能匹配，顯示候選啤酒卡片：啤酒名稱、酒廠、風格、ABV、信心程度、既有評分數
- 提供「使用此啤酒」、「手動搜尋」、「建立新啤酒」三種選項
- 若信心不足，明確提示使用者需要手動確認，避免錯誤合併
- 發布前要顯示「這篇酒評會歸類到哪一款啤酒」

4. 啤酒詳情頁 Beer detail
- 顯示啤酒照片/代表圖、名稱、酒廠、風格、ABV、國家
- 顯示平均評分、評分數、按讚數、排行榜名次、綜合分數
- 顯示所有歸屬於此啤酒的酒評貼文
- 強調這些評價都來自「有發文、有照片、有喝過」的使用者
- 提供從 detail page 回到排行榜或 feed 的導覽

5. 啤酒排行榜
- 顯示排名、啤酒名稱、酒廠、風格、平均評分、評分數、按讚數、綜合分數
- 點擊排行榜項目可進入 Beer detail page
- 要適合快速掃描與比較
- 需要有空狀態與 loading 狀態

6. 登入 / 使用者入口
- 第三方登入 CTA，優先以 Google 登入為主
- 不需要完整 profile 頁，但貼文上要能看出使用者身份

視覺方向：
- 現代社群產品感，但保留啤酒/精釀的溫度
- 清爽、可讀、適合長時間滑 feed
- 不要做成很暗的酒吧風格
- 不要只用單一棕色或橘色系
- 可以使用溫暖琥珀色作為 accent，但整體要有足夠中性色與綠色/深色對比
- 卡片圓角控制在 8px 以內
- 排行榜與 Beer detail 要比一般社群貼文更密集、易掃描
- Mobile-first，同時提供 desktop layout

請特別補齊狀態：
- loading
- empty feed
- empty leaderboard
- login required
- form validation error
- image upload failed
- AI matching in progress
- AI high-confidence match
- AI low-confidence match
- manual beer search
- create new beer
- liked / unliked
- disabled submit

請輸出：
- 可互動 prototype
- desktop 與 mobile RWD 版面
- 主要 components 清單
- design tokens：color、type scale、spacing、radius
- 每個畫面的 UI states 說明
- 工程 handoff notes，讓 React + TypeScript 前端可以依此實作

限制：
- 不要加入私訊、好友系統、商家後台、付款、進階推薦演算法
- 不要做多張照片或影片
- 不要做原生 App
- MVP 評分只做整體 1-5 分，不做香氣/口感/苦度細分
- AI 匹配不可完全自動合併，必須提供使用者確認或手動修正入口
```

## AI Artifact
- Tool: Open Design (`nexu-io/open-design`) running in host source mode.
- Open Design web UI: `http://localhost:7457/`.
- Open Design daemon/API: `http://localhost:7456/`.
- Prompt / brief: Use this file plus `tasks/current/feature-spec.md` and `docs/specs/feature-beer-rating-mvp-flow-architecture.md`. Do not depend on a local prototype for the first design pass.
- Artifact URL / path: TBD after Open Design generation.
- Known gaps: No Figma frame yet; no visual QA screenshots yet.

## Engineering Handoff
- Local prototype entry: `src/main.tsx`.
- Design tokens and layout styles: `src/styles.css`.
- Feature spec: `tasks/current/feature-spec.md`.
- Flow / architecture alignment: `docs/specs/feature-beer-rating-mvp-flow-architecture.md`.
- Local service: optional for engineering preview; the first Open Design pass should generate from the product and flow documents rather than copying the local prototype.
- Open Design service: source-mode service from `_open_design`, currently verified with web HTTP 200 at `http://localhost:7457/` and daemon `/api/health` HTTP 200 at `http://localhost:7456/`.
- Agent detection: host source mode is required for local CLI detection. Docker mode cannot see host `claude` / `codex` binaries unless they are installed inside the container.
- Codex integration: set `CODEX_BIN=C:\Users\user\AppData\Local\OpenAI\Codex\bin\codex.exe` so Open Design uses the accessible user-level Codex binary instead of the WindowsApps entry.
