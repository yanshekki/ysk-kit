# Skills

Language: [English](index.md) · 中文

給人與 AI agent 的程序。每個 skill 都有觸發、輸入、步驟、驗證與完成條件。它指向法律、CLI 與操作手冊。它不複製 [AGENTS.zh.md](../../AGENTS.zh.md)。

| Skill | 何時 | 不要用於 | 相關外部 skill |
|---|---|---|---|
| [plan-feature](plan-feature.zh.md) | 在合約與程式之前寫 `docs/plans/<yyyy-mm-dd>-<slug>.md` | 錯字／單檔重新命名；未決問題仍未解決（先 clarify-feature） | 工具原生 plan mode（抄進日期檔） |
| [clarify-feature](clarify-feature.zh.md) | 未決問題非空，或使用者在計劃批准前要求澄清 | 實作；未決問題已空；Spec Kit／`.specify/` | — |
| [test-plan](test-plan.zh.md) | 寫測試之前先排風險並列出 given/when/then 案例 | 只改註解 | Cloudflare Agents `test-plan` |
| [write-tests](write-tests.zh.md) | 本倉的 Vitest／Testing Library／Playwright | 規劃案例（先 test-plan） | Cloudflare sandbox-sdk testing |
| [new-product](new-product.zh.md) | 用 `create-ysk-app` 產生產品 | 在本 kit 加模組 | — |
| [add-module](add-module.zh.md) | 新的 HTTP 資源 | 還原 llm／team／billing／push | — |
| [add-capability](add-capability.zh.md) | 還原 llm／team／billing／push（或其他目錄名稱） | 發明目錄名稱 | — |
| [layout-system](layout-system.zh.md) | 殼、分欄、導航、清單+詳情、響應式結構 | 改色盤／第二套元件庫；只改 API | jakubkrehel `better-layout`（改寫使用，不 vendor） |
| [ui-design](ui-design.zh.md) | web／admin／mobile／desktop 畫面 | 只改 API；複雜版面須先 layout-system | Anthropic frontend-design（留在 kit token） |
| [ui-review](ui-review.zh.md) | UI 標為完成之前的 QA 清單 | 設計畫面（ui-design）；新殼跳過 layout-system | Vercel Web Interface Guidelines |
| [i18n-localize](i18n-localize.zh.md) | 使用者可見文案、ErrorBanner、電郵／push、語言切換 | 第二套 UI 庫；RTL；無監督機器翻譯術語 | `@ysk-kit/i18n`；Vercel Locale |
| [verify-change](verify-change.zh.md) | 任何功能之後 | 沒跑命令就宣稱完成 | — |
| [fix-layers](fix-layers.zh.md) | `pnpm layers` 失敗 | 未經批准改 `.dependency-cruiser.cjs` | — |
| [envelope-api](envelope-api.zh.md) | 新路由、SSE、PDF 或錯誤形狀 | 另發明錯誤 JSON | — |
| [contract-change](contract-change.zh.md) | DTO、路徑、錯誤碼、OpenAPI | 只改 application 規則；Prisma SQL | oasdiff（可選） |
| [debug-issue](debug-issue.zh.md) | 紅燈測試、CI 或使用者回報 | 從零設計功能；JSON INTERNAL dump（error-log-review）；CVE 盤點（supply-scan） | `git bisect` |
| [error-log-review](error-log-review.zh.md) | INTERNAL／5xx JSON 日誌、日誌洩密 | 從零設計功能；已有紅燈 Vitest | — |
| [supply-scan](supply-scan.zh.md) | CVE／runtime 版本／lockfile／Actions pin | 以 diff 為範圍的授權（security-review）；exploit PoC | — |
| [upgrade-kit](upgrade-kit.zh.md) | Kit 依賴、Dependabot、每週穩定版、Actions 跑不了時的本機 smoke | Dest 產品更新（`ysk-kit upgrade`） | — |
| [review-change](review-change.zh.md) | 對照法律 + 計劃審查 PR／分支 | 實作該改動；Staff／QA 組合切片審計（audit-slice） | getsentry `security-review`（diff 範圍） |
| [audit-slice](audit-slice.zh.md) | 對 diff 或具名模組的 Staff／QA 組合審查 | 實作功能；普通 PR 審查；只改授權；剛搭完骨架；刪檔 | — |
| [llm-feature](llm-feature.zh.md) | 產品 LLM prompt、`/v1/llm`、評測 | 只改客戶端文案；非 LLM 稽核 | OWASP LLM Top 10 |
| [security-review](security-review.zh.md) | 授權、租戶、密鑰、token、webhook、LLM 輸入 | Staff／QA 組合切片審計（audit-slice）；文件錯字；沒有新信任邊界 | getsentry `security-review`；openai threat-model |
| [db-migration](db-migration.zh.md) | Prisma 7.10 SQL 審查、expand/contract、禁止默默 reset | Prisma 8 CLI；沒改 schema | prisma/skills `prisma-cli` |
| [webhook-handling](webhook-handling.zh.md) | 入站 webhook（先 Stripe）：驗簽、確認、冪等 | 出站 Stripe SDK | Stripe webhooks／stripe/ai |
| [desktop-electron](desktop-electron.zh.md) | Electron isolation、CSP、IPC、safeStorage | 只改 renderer UI | Electron security tutorial |

共用包裝是 **四個路由器**（`plan`、`implement`、`verify`、`review`），在 `.agents/skills/<name>/SKILL.md`。正文必須提到 `AGENTS.md`。`create-ysk-app` 與 `ysk-kit upgrade` 會從 `tooling/ysk-cli/templates/agent/` 把相同副本寫到 `.claude/skills/`、`.cursor/skills/` 與 `.grok/skills/`。若副本漂移或不提 `AGENTS.md`，`pnpm ysk-kit check agent` 會失敗。

- **plan** → [plan-feature](plan-feature.zh.md)
- **implement** → 本目錄；只打開對得上的程序。若產品有 fund-protocol 文件就跟隨它。本 kit 不附該檔。
- **verify** → [verify-change](verify-change.zh.md)
- **review** → [review-change](review-change.zh.md)。只有 diff 碰到授權、密鑰或 webhook 才打開 [security-review](security-review.zh.md)。只有使用者要求才打開 [audit-slice](audit-slice.zh.md)。

先讀 [AGENTS.zh.md](../../AGENTS.zh.md) 與 [docs/agent/NOW.md](../agent/NOW.md)。

## 任務索引

| 任務 | 讀 |
|---|---|
| 計劃功能 | [plan-feature](plan-feature.zh.md)、[docs/plans/_template-lean.md](../plans/_template-lean.md)（`--full`：[_template.md](../plans/_template.md)） |
| 澄清未決問題 | [clarify-feature](clarify-feature.zh.md) |
| 精簡／完整路徑 | [sdd-path](../plans/sdd-path.zh.md) |
| 搭產品 | [new-product](new-product.zh.md)、[create-ysk-app](../cli/create-ysk-app.zh.md) |
| 加資源 | [add-module](add-module.zh.md)、[操作手冊](../recipes/add-module.zh.md) |
| 開發者 how-to | [docs/recipes/](../recipes/README.zh.md) |
| 還原 llm／team／billing／push | [add-capability](add-capability.zh.md) |
| envelope／SSE／PDF | [envelope-api](envelope-api.zh.md)、[envelope 指南](../guides/envelope.zh.md) |
| DTO／路徑／OpenAPI | [contract-change](contract-change.zh.md) |
| 紅燈測試或使用者回報 | [debug-issue](debug-issue.zh.md) |
| INTERNAL／5xx JSON 日誌 | [error-log-review](error-log-review.zh.md) |
| CVE／第三方版本 | [supply-scan](supply-scan.zh.md) |
| Kit 依賴／Dependabot | [upgrade-kit](upgrade-kit.zh.md) |
| 審查 PR／分支 | [review-change](review-change.zh.md) |
| Staff／QA 切片審計 | [audit-slice](audit-slice.zh.md) |
| 產品 LLM prompt | [llm-feature](llm-feature.zh.md) |
| `pnpm layers` 失敗 | [fix-layers](fix-layers.zh.md)、[hexagonal](../guides/hexagonal.zh.md) |
| 任何功能之後 | [verify-change](verify-change.zh.md) |
| 計劃如何測試 | [test-plan](test-plan.zh.md) |
| 寫測試 | [write-tests](write-tests.zh.md)、[測試指南](../guides/testing.zh.md) |
| 版面結構 | [layout-system](layout-system.zh.md) |
| 加或改畫面 | [ui-design](ui-design.zh.md) |
| 完成 UI | [ui-review](ui-review.zh.md) |
| 本地化 UI／envelope 字串 | [i18n-localize](i18n-localize.zh.md) |
| 安全審查 | [security-review](security-review.zh.md) |
| Prisma 遷移 | [db-migration](db-migration.zh.md) |
| 入站 webhook | [webhook-handling](webhook-handling.zh.md) |
| Electron 桌面 | [desktop-electron](desktop-electron.zh.md) |
| 更新產品 | [upgrade](../guides/upgrade.zh.md) |
| CLI 旗標 | [ysk-kit](../cli/ysk-kit.zh.md) |

## 編碼工具

官方載入規則（不要另發明慣例檔）：

| 工具 | 讀甚麼 | 本倉 |
|---|---|---|
| Codex | `AGENTS.md`，較近的 nested 優先；skills `.agents/skills/` | 根與 nested `AGENTS.md`。 |
| OpenCode | 專案 `AGENTS.md`。沒有 `AGENTS.md` 才 fallback `CLAUDE.md` | 靠 `AGENTS.md`。 |
| Grok Build | `AGENTS.md`／`AGENT.md`／`CLAUDE.md`（官方 Discovery 名單沒有 `GEMINI.md`）加 `.grok/rules/`。專案 skills：`.grok/skills/` 與 Claude Code skills；使用者層 `~/.agents/skills/` | 指針保持短。 |
| Cursor | 根與 nested `AGENTS.md` 與 `CLAUDE.md`。`.cursor/rules/*.mdc`。Skills `.agents/skills/` | 範圍 `.mdc` 只做提醒。 |
| Claude Code | `CLAUDE.md`（`@AGENTS.md`）。Skills **只** `.claude/skills/` | 在 `CLAUDE.md` 保留 `@AGENTS.md`。Kit 把 `.claude/skills/` 從 `.agents/skills/` 鏡像。 |
| Copilot | `AGENTS.md`。`.github/copilot-instructions.md`。專案 skills `.agents/skills/` 與 `.claude/skills/` | 指針保持短。不要加 `.github/skills`。 |
| Gemini CLI | `.gemini/settings.json` `fileName: ["AGENTS.md"]`。專案 skills `.agents/skills/` | `GEMINI.md` 只做指針。不要加 `.gemini/skills`。 |
