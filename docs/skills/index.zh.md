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

共用包裝在 `.agents/skills/<name>/SKILL.md`（YAML `name` + `description`、短步驟摘要，然後指向此處）。`create-ysk-app` 與 `ysk-kit upgrade` 會從 `tooling/ysk-cli/templates/agent/` 把相同副本寫到 `.claude/skills/`、`.cursor/skills/` 與 `.grok/skills/`。若副本漂移或不提 `AGENTS.md`，`pnpm ysk-kit check agent` 會失敗。

其他 agent 先讀 `AGENTS.md`，再跟本目錄。
