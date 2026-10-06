# Skills

Language: [English](index.md) · 中文

給人與 AI agent 的程序。每個 skill 都有觸發、輸入、步驟、驗證與完成條件。它指向法律、CLI 與操作手冊。它不複製 [AGENTS.zh.md](../../AGENTS.zh.md)。

| Skill | 何時 | 不要用於 | 相關外部 skill |
|---|---|---|---|
| [plan-feature](plan-feature.zh.md) | 在合約與程式之前寫 `docs/plans/<yyyy-mm-dd>-<slug>.md` | 錯字／單檔重新命名 | 工具原生 plan mode（抄進日期檔） |
| [test-plan](test-plan.zh.md) | 寫測試之前先排風險並列出 given/when/then 案例 | 只改註解 | Cloudflare Agents `test-plan` |
| [write-tests](write-tests.zh.md) | 本倉的 Vitest／Testing Library／Playwright | 規劃案例（先 test-plan） | Cloudflare sandbox-sdk testing |
| [new-product](new-product.zh.md) | 用 `create-ysk-app` 產生產品 | 在本 kit 加模組 | — |
| [add-module](add-module.zh.md) | 新的 HTTP 資源 | 還原 llm／team／billing／push | — |
| [add-capability](add-capability.zh.md) | 還原 llm／team／billing／push（或其他目錄名稱） | 發明目錄名稱 | — |
| [ui-design](ui-design.zh.md) | web／admin／mobile／desktop 畫面 | 只改 API | Anthropic frontend-design（留在 kit token） |
| [ui-review](ui-review.zh.md) | UI 標為完成之前的 QA 清單 | 設計畫面（ui-design） | Vercel Web Interface Guidelines |
| [verify-change](verify-change.zh.md) | 任何功能之後 | 沒跑命令就宣稱完成 | — |
| [fix-layers](fix-layers.zh.md) | `pnpm layers` 失敗 | 未經批准改 `.dependency-cruiser.cjs` | — |
| [envelope-api](envelope-api.zh.md) | 新路由、SSE、PDF 或錯誤形狀 | 另發明錯誤 JSON | — |
| [contract-change](contract-change.zh.md) | DTO、路徑、錯誤碼、OpenAPI | 只改 application 規則；Prisma SQL | oasdiff（可選） |
| [debug-issue](debug-issue.zh.md) | 紅燈測試、CI 或使用者回報 | 從零設計功能 | `git bisect` |
| [review-change](review-change.zh.md) | 對照法律 + 計劃審查 PR／分支 | 實作該改動 | getsentry `security-review`（diff 範圍） |
| [llm-feature](llm-feature.zh.md) | 產品 LLM prompt、`/v1/llm`、評測 | 只改客戶端文案；非 LLM 稽核 | OWASP LLM Top 10 |
| [security-review](security-review.zh.md) | 授權、租戶、密鑰、token、webhook、LLM 輸入 | 文件錯字、沒有新信任邊界 | getsentry `security-review`；openai threat-model |
| [db-migration](db-migration.zh.md) | Prisma 7.10 SQL 審查、expand/contract、禁止默默 reset | Prisma 8 CLI；沒改 schema | prisma/skills `prisma-cli` |
| [webhook-handling](webhook-handling.zh.md) | 入站 webhook（先 Stripe）：驗簽、確認、冪等 | 出站 Stripe SDK | Stripe webhooks／stripe/ai |
| [desktop-electron](desktop-electron.zh.md) | Electron isolation、CSP、IPC、safeStorage | 只改 renderer UI | Electron security tutorial |

共用包裝在 `.agents/skills/<name>/SKILL.md`（YAML `name` + `description`、短步驟摘要，然後指向此處）。`create-ysk-app` 與 `ysk-kit upgrade` 會從 `tooling/ysk-cli/templates/agent/` 把相同副本寫到 `.claude/skills/`、`.cursor/skills/` 與 `.grok/skills/`。若副本漂移或不提 `AGENTS.md`，`pnpm ysk-kit check agent` 會失敗。

其他 agent 先讀 `AGENTS.md`，再跟本目錄。
