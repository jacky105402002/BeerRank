# Feature Spec — 社群酒評貼文與啤酒排行榜 MVP

## Status
Draft

## Problem Statement
啤酒愛好者想用照片記錄與分享品飲心得，但一般社群平台缺少啤酒專屬評分欄位、可累積的排行榜，以及把不同使用者喝到的同一款啤酒聚合在一起的機制。

## Target Users
- 啤酒愛好者：喝到新酒時想快速記錄照片、短評與分數。
- 精釀玩家：想比較酒款並參考群體排行榜。
- 探索型使用者：想在買酒或點酒前查看高分與熱門酒款。

## User Scenarios
1. 作為啤酒愛好者，當我喝到一款啤酒時，我想用手機登入並發佈一張照片、評分與短評，以便留下個人品飲紀錄。
2. 作為瀏覽者，當我打開 BeerRank 時，我想看到近期酒評貼文並能按讚，以便參與社群互動。
3. 作為想找酒的人，當我查看排行榜時，我想看到依綜合分數排序的啤酒，以便找到值得嘗試的酒款。
4. 作為啤酒愛好者，當我上傳啤酒照片與啤酒資訊時，我想讓 AI 協助辨識並歸類到正確的啤酒頁，以便我的評分能累積到該啤酒的排行榜與其他人的評價底下。
5. 作為探索型使用者，當我點進排行榜上的某款啤酒時，我想看到所有「實際發文喝過」的使用者評價，以便判斷這個排名是否可信。

## In Scope
- 第三方登入與基本使用者 profile。
- 建立 beer record：至少包含啤酒名稱、酒廠、風格，可在發文時新增或選擇。
- 建立酒評貼文：單張照片、啤酒、整體評分、短評。
- AI beer matching：根據照片、啤酒名稱、酒廠、風格與使用者輸入，自動建議匹配到既有 Beer 或建立新 Beer。
- AI matching confirmation：使用者發布前可確認 AI 建議的啤酒歸類，避免錯誤合併。
- Feed：顯示近期酒評貼文。
- Like / unlike：使用者可對貼文按讚或取消。
- Leaderboard：依啤酒平均評分、評分數與按讚數產生初版排行榜。
- Beer detail page：顯示某一款啤酒的排行榜資訊、平均分數、評分數、所有相關酒評貼文與其他人評價。
- 基本空狀態、錯誤狀態、未登入狀態。

## Out of Scope
- 原生 iOS / Android App。
- 私訊、好友邀請、追蹤系統。
- 多張照片與影片。
- 酒吧 / 酒廠商家後台。
- 付款與訂位。
- 進階推薦演算法。
- 完全自動合併不可覆核的啤酒資料清理流程。
- 完整內容審核與檢舉流程。
- 精細評分維度（香氣、口感、苦度等）先延後，MVP 只做整體分數。

## Acceptance Criteria
- [ ] Given 使用者未登入，When 嘗試發佈酒評，Then 系統要求使用第三方登入。
- [ ] Given 使用者已登入，When 選擇或新增啤酒、上傳一張照片、填入 1-5 分評分與短評後送出，Then feed 會出現該酒評貼文。
- [ ] Given 使用者上傳啤酒照片並輸入啤酒資訊，When AI 找到可能的既有 Beer，Then 系統顯示匹配建議、信心程度與「使用此啤酒 / 建立新啤酒 / 手動搜尋」選項。
- [ ] Given 使用者確認 AI 匹配到既有 Beer，When 發佈酒評，Then 該酒評會歸屬到該 Beer detail page，並納入該啤酒排行榜統計。
- [ ] Given AI 無法高信心匹配既有 Beer，When 使用者發佈酒評，Then 系統要求使用者確認建立新 Beer 或手動選擇既有 Beer。
- [ ] Given feed 有酒評貼文，When 使用者按讚，Then 該貼文讚數增加且使用者再次按下可取消讚。
- [ ] Given 多位使用者對同一啤酒發表評分，When 查看排行榜，Then 系統以初版排行榜規則排序並顯示分數、評分數與讚數。
- [ ] Given 使用者從排行榜點擊某款啤酒，When 進入 Beer detail page，Then 系統顯示該啤酒的平均評分、評分數、排名資訊，以及所有歸屬於此啤酒的已發布酒評。
- [ ] Given 使用者未填必填欄位或圖片上傳失敗，When 送出貼文，Then 系統阻止送出並顯示可理解的錯誤訊息。
- [ ] Given 使用者在手機尺寸瀏覽，When 進入 feed、發文、排行榜，Then 主要操作不需要水平捲動且文字不溢出。

## Data Shape Sketch（資料形狀草圖 — 必填）
- 主要實體：
  - User/Auth Identity：第三方登入身份。
  - Profile：BeerRank 顯示名稱、頭像、公開資訊。
  - Brewery：酒廠或品牌。
  - Beer：可被多篇貼文引用的啤酒資料。
  - BeerPost：使用者的酒評貼文。
  - PostImage：貼文圖片。
  - PostLike：使用者對貼文的按讚紀錄。
  - BeerRankingStat：啤酒排行榜用統計資料或 view。
  - BeerMatchSuggestion：AI 對單篇貼文的啤酒匹配建議與信心分數。
- 關鍵欄位：
  - Profile：id、auth_user_id、display_name、avatar_url、created_at。
  - Brewery：id、name、country、created_by、created_at。
  - Beer：id、brewery_id、name、style、abv、country、created_by、created_at。
  - BeerPost：id、user_id、beer_id、rating_overall、review_text、visibility、created_at、updated_at、deleted_at。
  - PostImage：id、post_id、storage_path、alt_text、created_at。
  - PostLike：id、post_id、user_id、created_at。
  - BeerRankingStat：beer_id、average_rating、rating_count、like_count、rank_score。
  - BeerMatchSuggestion：id、post_id、suggested_beer_id、confidence_score、source_signals、status、created_at、resolved_at。
- 關聯：
  - Profile 1—N BeerPost。
  - Brewery 1—N Beer。
  - Beer 1—N BeerPost。
  - BeerPost 1—1 PostImage（MVP）。
  - BeerPost 1—N PostLike；Profile 1—N PostLike。
  - Beer 1—1 BeerRankingStat 或 derived view。
  - BeerPost 1—N BeerMatchSuggestion；BeerMatchSuggestion N—1 Beer。
- 生命週期：
  - Profile 由首次登入建立，可由本人更新。
  - Beer / Brewery MVP 可由登入使用者建立，後續需合併與審核機制。
  - BeerPost 由作者建立與刪除；刪除先採 soft delete；發佈前需有明確 Beer 歸屬。
  - BeerMatchSuggestion 由 AI 在上傳照片/輸入資料後產生；由使用者確認、改選或建立新 Beer 後標記 resolved。
  - PostLike 可建立/刪除，同一 user 對同一 post 只能一筆。
  - RankingStat 由查詢時計算或由資料庫 view/排程更新。
- 既有資料影響：全新專案，無既有資料遷移。

## Impact (初判)
| 面向 | 是否影響 | 下游 Skill |
|---|---|---|
| 流程 | 是 | flow-designer |
| 架構 / 模組 | 是 | system-architect |
| DB schema | 是 | data-modeler |
| API contract | 是 | backend-developer |
| UIUX | 是 | uiux-designer |

## Open Questions
- 第三方登入 MVP 優先支援 Google，還是 Google + GitHub / Apple？
- 技術路線是否採 Supabase（Auth / PostgreSQL / Storage）？
- 排行榜初版公式是否接受：`rank_score = average_rating * log10(rating_count + 1) + like_count * 0.05`？
- 啤酒風格欄位先用自由輸入，還是固定選單？
- MVP 是否需要公開 profile 頁，或只在貼文上顯示使用者名稱？
- AI beer matching 第一版要做到自動辨識圖片，還是先以「照片 + 使用者輸入文字」產生候選匹配？
- AI 匹配信心門檻與錯誤合併修正流程如何定義？

## Nodes
見 `tasks/current/nodes.md`
