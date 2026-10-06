# Skills

Language: [English](index.md) · 中文

給人與 AI agent 的程序。每個 skill 都有觸發、輸入、步驟、驗證與完成條件。它指向法律、CLI 與操作手冊。它不複製 [AGENTS.zh.md](../../AGENTS.zh.md)。

| Skill | 何時 |
|---|---|
| [plan-feature](plan-feature.zh.md) | 在合約與程式之前寫 `docs/plans/<yyyy-mm-dd>-<slug>.md` |
| [test-plan](test-plan.zh.md) | 寫測試之前先排風險並列出 given/when/then 案例 |
| [write-tests](write-tests.zh.md) | 本倉的 Vitest／Testing Library／Playwright |
| [new-product](new-product.zh.md) | 用 `create-ysk-app` 產生產品 |
| [add-module](add-module.zh.md) | 新的 HTTP 資源 |
| [add-capability](add-capability.zh.md) | 還原 llm／team／billing／push（或其他目錄名稱） |
| [ui-design](ui-design.zh.md) | web／admin／mobile／desktop 畫面 |
| [ui-review](ui-review.zh.md) | UI 標為完成之前的 QA 清單 |
| [verify-change](verify-change.zh.md) | 任何功能之後 |
| [fix-layers](fix-layers.zh.md) | `pnpm layers` 失敗 |
| [envelope-api](envelope-api.zh.md) | 新路由、SSE、PDF 或錯誤形狀 |
| [security-review](security-review.zh.md) | 授權、租戶、密鑰、token、webhook、LLM 輸入 |
| [db-migration](db-migration.zh.md) | Prisma 7.10 SQL 審查、expand/contract、禁止默默 reset |
| [webhook-handling](webhook-handling.zh.md) | 入站 webhook（先 Stripe）：驗簽、確認、冪等 |
| [desktop-electron](desktop-electron.zh.md) | Electron isolation、CSP、IPC、safeStorage |

共用包裝在 `.agents/skills/<name>/SKILL.md`（YAML `name` + `description`、短步驟摘要，然後指向此處）。`create-ysk-app` 與 `ysk-kit upgrade` 會從 `tooling/ysk-cli/templates/agent/` 把相同副本寫到 `.claude/skills/`、`.cursor/skills/` 與 `.grok/skills/`。若副本漂移或不提 `AGENTS.md`，`pnpm ysk-kit check agent` 會失敗。

其他 agent 先讀 `AGENTS.md`，再跟本目錄。
