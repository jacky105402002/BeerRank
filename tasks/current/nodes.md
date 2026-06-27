# Nodes — 社群酒評貼文與啤酒排行榜 MVP

## Feature
`社群酒評貼文與啤酒排行榜 MVP` — 使用者能登入、發佈酒評照片、按讚，並查看啤酒排行榜。關聯：`tasks/current/feature-spec.md`

## Node 總覽

| Node | Title | Owner Skill | Depends on | 路徑 | Status |
|---|---|---|---|---|---|
| 001 | Workflow and product planning baseline | product-planner | — | Full-Loop | done |
| 002 | Flow, architecture, and data model design | flow-designer + system-architect + data-modeler | 001 | Full-Loop | in_progress |
| 003 | UIUX design for feed, composer, and leaderboard | uiux-designer + ai-design-producer | 002 | Full-Loop | pending |
| 004 | App scaffold and design system foundation | frontend-developer | 003 | Full-Loop | pending |
| 005 | Auth, profile, beer, post, like, and ranking backend | backend-developer | 002 | Full-Loop | pending |
| 006 | Feed, post composer, likes, and leaderboard UI | frontend-developer | 004, 005 | Full-Loop | pending |
| 007 | QA, review, docs, and release notes | qa-tester + code-reviewer + docs-maintainer | 006 | Full-Loop | pending |

## 依賴關係

```text
001 → 002 → 003 → 004
          ↘ 005 → 006 → 007
```

## 切分檢查

- [x] 每個 Node 有單一、可獨立驗證的 Goal。
- [x] Node 之間依賴明確、無循環。
- [x] Node 002 初版已補齊流程、模組、資料模型與 API contract 草案。
- [ ] Node 003 完成後需補齊 design brief、wireframe / prototype 與 visual QA。
- [ ] 進入 Node 004 前需通過 `ai-workflow/definition-of-ready.md`。
