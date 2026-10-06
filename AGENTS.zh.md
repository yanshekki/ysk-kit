# YSK Kit — agent 指引

Language: [English](AGENTS.md) · 中文

本檔是 agent 法律的**唯一**來源。Cursor、Grok Build、OpenCode、Codex、Claude Code、GitHub Copilot 與 Gemini CLI 都會讀本檔（或指向本檔的指針）。其他工具檔必須保持精簡指針。不要把本檔複製進 `.cursor/`、`.claude/`、`.github/` 或 `GEMINI.md`。

改程式之前先讀本檔。程序：[docs/skills/](docs/skills/)。架構：[docs/architecture.zh.md](docs/architecture.zh.md)。命令：[docs/cli/](docs/cli/)。操作步驟：[docs/recipes/](docs/recipes/)。計劃：[docs/plans/](docs/plans/)。變更紀錄：[CHANGELOG.zh.md](CHANGELOG.zh.md)。階段日記：[docs/history.zh.md](docs/history.zh.md)。路線圖：[docs/product-plan.zh.md](docs/product-plan.zh.md)。

## 定位

YSK Kit 是合約先行的 SaaS 平台（pnpm 12 + Turborepo + Node 24）。本 checkout 是可運行的 `saas` flavor：身分、檔案、通知、工作、郵件、API 金鑰、加密、即時通訊已經接上。

**產品業務 domain 不寫入 kit。** 沙龍、交易所、地圖或其他行業模型屬於已產生的產品（或 `examples/`，再套用到新目的地）。若 agent 另起目錄樹、另選 HTTP 框架，或在客戶端對 kit 路徑直接 `fetch`，就是做錯。

| 你在改… | 工作位置 |
|---|---|
| 平台本身 | 本倉 |
| 客戶產品 | `create-ysk-app` 產生的樹 |
| 已完成教程 | `examples/<slug>/`，然後 `pnpm --filter @ysk-kit/examples start apply <slug> --yes` |

預設產品骨架（agent 請傳旗標，不要等 TTY）：

```bash
pnpm create @ysk-kit/app my-product --preset thin --db mysql --flavor saas
# 或：npm create @ysk-kit/app my-product --preset thin --db mysql --flavor saas
# 本倉：
pnpm --filter @ysk-kit/create-app start my-product --preset thin --db mysql --flavor saas
```

`--preset full` 保留完整示範（llm、billing、orgs、push 已掛上）。還原被剝走的能力：`pnpm ysk-kit add llm|team|billing|push`（`billing` 須先有 `team`）。遷移之後執行 `pnpm db:seed`，以 `admin@ysk.hk` / `ysk-admin-dev` 登入（密碼在 `.env.example`）。

在本倉或已產生的產品新增 HTTP 資源：

```bash
pnpm ysk-kit add module <kebab-name> --prisma --web
```

該命令寫出 hexagonal 切片、ts-rest 合約、SDK resource、web-sdk hooks、Express + Fastify 掛載、composition 接線，以及 memory-repo 測試。業務規則填在 `application/` 與 Prisma model。不要另起一套目錄樹。

## 倉目錄地圖

```
ysk-kit/
├── AGENTS.md                 ← 英文法律（中文：AGENTS.zh.md）
├── apps/api/                 hexagonal HTTP API（Express 預設；Fastify 經 HTTP_ADAPTER）
├── apps/web|admin|mobile|desktop
├── packages/contracts        enum、DTO、error code、ts-rest 路徑
├── packages/sdk              型別化 HTTP 客戶端
├── packages/web-sdk          React Query hooks
├── modules/                  Prisma fragments + 產生器形狀（notes）
├── tooling/ysk-cli           ysk-kit / yskk
├── tooling/create-ysk-app    產品骨架
├── docs/skills/              完整程序
├── docs/plans/               可保存的功能計劃
├── .agents/skills/           共用 skill 包裝（name + description）
└── examples/                 已完成產品 overlay — 不是 kit domain
```

| 表面 | 在此改 | 不要 |
|---|---|---|
| DTO、error code、路徑 | 先改 `packages/contracts` | 只在客戶端發明型別 |
| 業務規則 | `apps/api/src/modules/<name>/application/` | 把 Prisma 或 Express 放在這裡 |
| 持久化 | `apps/api/src/modules/<name>/infra/` | 從客戶端 import Prisma |
| HTTP 掛載 | 產生出來的 Express + Fastify register | 把第三套 adapter 設為預設 |
| 型別化客戶端 | `packages/sdk`，然後 `packages/web-sdk` | 在 web/admin/mobile/desktop 直接 `fetch` |
| Vite 頁面 | `apps/web/src/features/<name>/` | 直接談 Prisma |

`packages/contracts`、`apps/api` 與各客戶端 app 底下的巢狀 `AGENTS.md` 只補充**當地**提醒。

## 硬規則

十二條全部保留。每條先寫規則，下一句說明原因。

1. **`@ysk-kit/contracts` 是唯一來源**：enum、DTO、error code、ts-rest 路徑。先加 DTO 與 `OkSchema` / `ErrSchema`，才寫 handler、SDK 或 UI。原因：一份合約同時餵 OpenAPI、SDK、測試與所有客戶端。
2. **不用 TypeScript `enum`。** 在 contracts 用 `as const` + Zod。原因：`enum` 會產生 runtime 物件，並與 Zod／Prisma union 漂移。`pnpm ysk-kit check agent` 會令改動失敗。
3. **Prisma 只留在 `apps/api/src/modules/*/infra`**（以及共用的 `apps/api/src/infra`）。客戶端永不 import `@prisma/client`、`@ysk-kit/db-prisma`、`apps/api/src/generated` 或 `generated/prisma`。原因：資料庫是 adapter。客戶端只見 HTTP。
4. **Web / admin / mobile / desktop 只經 `@ysk-kit/sdk` 呼叫 API**（React Query 經 `@ysk-kit/web-sdk`）。不要對 kit 路徑直接 `fetch`。原因：SDK 會解開 envelope，並留在已產生的路徑上。
5. **domain 與 application 不 import Express、Fastify、Prisma、React 或 BullMQ。** 原因：port 可用記憶體假物件測試；`pnpm layers` 守住依賴圖。
6. **每條 JSON 路由都是 `{ ok: true, data }` / `{ ok: false, error }`。** 原因：PHP、TypeScript 與合作方共用同一套錯誤形狀。
7. **Envelope 例外只有：** LLM SSE（`POST /v1/llm/stream`）、發票 PDF 的 HTTP 302、`GET /docs`、`GET /openapi.json`。新增例外必須由使用者明確決定，並寫在上述四項旁邊，且留在 ts-rest 之外。
8. **已開啟 `exactOptionalPropertyTypes`。** 省略可選鍵，不要傳 `undefined`。原因：`key?: T` 是「缺席或 T」，不是 `T | undefined`。
9. **測試使用記憶體 port。** CI 不要啟動 Redis、Stripe、Twilio、FCM、Jaeger 或 Grafana。原因：單元測試必須在沒有密鑰、也沒有收費 API 的乾淨 runner 上通過。
10. **從 `GET /openapi.json` 或 `docs/openapi.yaml` 發現路徑。** 呼叫仍然經 `@ysk-kit/sdk`。原因：OpenAPI 是目錄；SDK 是呼叫端。
11. **先用 `test-plan` 寫測試計劃，再用 `write-tests` 寫測試。** 先排資料遺失、授權、金錢、併發與租戶隔離；用記憶體 port。原因：不必啟動 Redis 或 Stripe 也能捉到 envelope 與授權錯誤。
12. **客戶端 UI 跟 `ui-design`，未通過 `ui-review` 不算完成。** 重用 `@ysk-kit/ui` 與 zinc 主題。原因：產品保持可及、一致，而且沒有泛用 AI 風格裝飾。

## 強制工作流程

不是錯字、單行文件修正或機械式重新命名的功能，都按此順序。

1. **理解。** 讀使用者要求、既有合約、模組切片，以及對應 [skill](docs/skills/index.zh.md)。辨認 flavor／preset／capability 影響。
2. **計劃**（見 [計劃協議](#計劃協議)）。需要計劃時，用模板寫入 `docs/plans/<yyyy-mm-dd>-<slug>.md`（`pnpm ysk-kit plan <slug>`）。不要先實作再補計劃。
3. **合約先行。** 在 `@ysk-kit/contracts` 寫 DTO、command、error code、ts-rest 路徑、`OkSchema` / `ErrSchema`。
4. **骨架。** `pnpm ysk-kit add module <kebab> --prisma --web` 或 `pnpm ysk-kit add <capability>`。不要人手 mkdir 另一套切片。
5. **實作。** 規則在 `application/`。Prisma 在 `infra/`。最後才寫 SDK／web-sdk／客戶端畫面。省略可選鍵。
6. **驗證。**

   ```bash
   pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
   ```

   `pnpm layers` 必須保持綠色（客戶端不碰 Express／Prisma／jobs／mail／push／AWS SDK）。`pnpm ysk-kit check agent` 必須保持綠色（沒有 TypeScript `enum`、客戶端沒有 Prisma 或 raw `fetch`、指針仍提及 `AGENTS.md`、skill 副本一致、根目錄加巢狀 `AGENTS.md` 低於 24 KiB）。在 Grok Build 可用 `grok inspect` 列出已載入的規則檔。
7. **文件／變更紀錄／changeset。** 每份給人讀的 Markdown 成對（`name.md` + `name.zh.md`，香港繁體書面語）。按 [貢獻指引](docs/contributing.zh.md) 更新 [CHANGELOG.md](CHANGELOG.md)／[CHANGELOG.zh.md](CHANGELOG.zh.md) 與 README「最近三個版本」窗口。公開套件有改就加 changeset。

## 計劃協議

出現以下任一情況就**必須**寫計劃：

- 工作會新增或改動 HTTP 路由、Prisma model、capability，或 SDK／web-sdk／客戶端表面。
- 工作跨越超過一個套件或超過一個 app。
- 使用者要求計劃、`plan.md` 或設計。
- 範圍包括授權、密鑰、webhook 或新的 envelope 例外。

**可略過**（除非使用者要求）：只改錯字、只改註解，或單一檔案的機械式重新命名。

**可保存位置：** `docs/plans/<yyyy-mm-dd>-<slug>.md`（ISO 日期，kebab slug）。中文配對：`docs/plans/<yyyy-mm-dd>-<slug>.zh.md`。

**工作階段檔：** 根目錄 `plan.md` 是可選草稿，給會尋找該檔名的工具。`pnpm ysk-kit plan <slug>` 會寫出日期檔（及中文配對），並寫入根目錄 `plan.md` 指針。請改日期檔，並保持指針同步。根目錄 `plan.md` 已 gitignore。日期計劃才是要提交的紀錄。

用 `pnpm ysk-kit plan <slug>` 建立，或複製 [docs/plans/_template.zh.md](docs/plans/_template.zh.md)。程序：[plan-feature](docs/skills/plan-feature.zh.md)。工具對照與可複製的 `/plan` 提示：[docs/plans/README.zh.md](docs/plans/README.zh.md)。

**先探索。** 寫計劃之前先搜樹。在合約之前的「現況與重用」列出既有模組、合約、SDK resource、hooks、產生器（`ysk-kit add module`）。能重用就不要新寫。

**假設。** 未核實的事實放進假設或未決問題。不要默默猜測。

**方案。** 有真正替代時，至少列兩個做法並寫權衡（複雜度、分層、遷移、客戶端），再寫選定與原因。瑣碎工作可寫 `單一明顯做法 — 原因`。

**批准閘。** 計劃獲准之前不要改專案檔（除非使用者豁免）。不要退出 plan mode 或交出草稿。缺任何模板章節都不算完整。若使用者拒絕或說太短，補上缺的章節，不要縮短。`/compact` 或長工作階段之後，繼續之前先重讀日期計劃檔。`pnpm ysk-kit plan --check <file>` 會在缺標題或仍是佔位內容時失敗。

模板章節（不要刪）：目標與使用者問題；範圍／非目標；假設；受影響的 flavor／preset／capability；現況與重用；考慮過的方案；合約先行（DTO、error code、ts-rest 路徑）；資料模型／Prisma 與遷移；模組切片與分層；SDK／web-sdk／客戶端表面；jobs／mail／realtime／notifications；安全與私隱；測試計劃（記憶體 port）；帶預期結果與人手檢查的驗證命令；文件／變更紀錄／changeset；風險與回滾；有序任務清單（檔案、介面／合約／資料、風險、回滾、驗收）；未決問題。

### 工具計劃模式

各工具的原生計劃檔只是草稿。Grok Build 寫入 `~/.grok/sessions/<cwd>/<session-id>/plan.md`；Cursor、Claude Code、Codex、OpenCode、Copilot 各自有計劃介面。無論工具寫到哪裏，獲准的計劃必須跟本模板，並用 `pnpm ysk-kit plan <slug>` 存成 `docs/plans/<date>-<slug>.md`。詳情：[docs/plans/README.zh.md](docs/plans/README.zh.md)。

## 完成定義

以下全部成立，改動才算完成：

- [ ] 協議要求計劃時，`docs/plans/<yyyy-mm-dd>-<slug>.md` 已存在
- [ ] 合約先於 handler 與客戶端落地
- [ ] 需要新資源或目錄功能時，切片來自 `ysk-kit add module`／`add <capability>`
- [ ] domain／application 不碰 Express、Fastify、Prisma、React、BullMQ
- [ ] 客戶端只用 `@ysk-kit/sdk`／`@ysk-kit/web-sdk`
- [ ] JSON 維持 envelope；沒有未經明確決定的新例外
- [ ] 測試使用記憶體 port
- [ ] `pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent` 全綠
- [ ] 中英文件深度一致；需要時已更新變更紀錄／README 窗口／changeset
- [ ] 日誌與提交沒有密鑰、OTP 代碼、Stripe `sk_` 或 webhook 密鑰

## 何時問使用者、何時自行決定

**先問：** 新增 envelope 例外；在目錄以外發明 capability 名稱；把行業 domain 放進本 kit；改 flavor／preset／db 預設；破壞性合約變更；把 Hono、Drizzle、Nest 或 Next 設為預設；削弱授權、速率限制或密鑰日誌規則；以「必須有外部服務」為由跳過驗證。

**自行決定**（並寫進計劃）：所要求功能內的 kebab-case 資源名；重用哪一個既有 error code；memory-repo 測試形狀；產生切片內的檔案位置；現有 app 該用 `--web` 還是 `--no-web`。

若缺少必要事實（哪個 flavor、哪個資料庫、billing 可否建立 `Organization`），問一次，然後繼續。

## 常見陷阱

| 症狀 | 修復 |
|---|---|
| 人手在 `apps/api/src/modules` 下開新目錄 | 刪掉。執行 `pnpm ysk-kit add module <kebab> --prisma --web`。 |
| TypeScript 出現 `enum Foo {` | 改成 contracts 的 `as const` + Zod。 |
| 客戶端 import Prisma 或 `generated/prisma` | 改呼叫 `@ysk-kit/sdk`。Prisma 留在 `infra/`。 |
| web/admin/mobile/desktop 寫 `fetch('/v1/...')` | 改用 SDK resource／web-sdk hook。 |
| `someFn({ optional: undefined })` | 省略該鍵。 |
| 單元測試啟動 Redis／Stripe | 注入記憶體 port。 |
| 工具檔重複本指引 | 還原成三行、指向 `AGENTS.md` 的指針。 |
| 行業模型進了本倉 | 移到已產生的產品或 `examples/`。 |
| 先寫程式再補計劃 | 停下。先寫日期計劃，再從合約繼續。 |
| 計劃是草稿、缺標題、或仍是佔位內容 | 填滿每個模板章節。`pnpm ysk-kit plan --check <file>`。若因太短被拒，補長，不要縮。 |
| 根目錄加巢狀 `AGENTS.md` 超過 24 KiB | 縮短當地檔；程序放進 `docs/skills/`。 |
| 測試 mock Prisma 或啟動 Stripe | 注入記憶體 port。跟 [write-tests](docs/skills/write-tests.zh.md)。 |
| UI 出現新漸層／圓角或 raw `fetch` | 重用 `@ysk-kit/ui`。跑 [ui-review](docs/skills/ui-review.zh.md)。 |

## 程式工具

官方載入規則（不要發明額外套件慣例）：

| 工具 | 讀甚麼 | 本倉做法 |
|---|---|---|
| Codex | 每個目錄先 `AGENTS.override.md` 再 `AGENTS.md`，由 git 根走到 cwd，較近者勝出；合計上限 32 KiB（`project_doc_max_bytes`） | 根目錄加短巢狀 `AGENTS.md` 遠低於此。Skills：`.agents/skills/<name>/SKILL.md`。 |
| OpenCode | `AGENTS.md`（根目錄 + 探索時的巢狀）。不回退到 `CLAUDE.md`。`opencode.json` 的 `instructions` 並不可靠 | 只依賴 `AGENTS.md`。 |
| Grok Build | 由根走到 cwd，載入每個符合的 `AGENTS.md`／`AGENT.md`／`CLAUDE.md`／`GEMINI.md`，外加 `.grok/rules/`、`.claude/rules/`、`.cursor/rules/` 內每個 `*.md`。沒有大小上限。被 gitignore 的檔會略過 | 指針保持極短。Cursor 規則用 `.mdc`，避免變成額外的 Grok `*.md`。用 `grok inspect` 核對。 |
| Cursor | 根目錄與巢狀 `AGENTS.md`、`CLAUDE.md`。`.cursor/rules/*.mdc`（`alwaysApply`／`description`／`globs`）。Skills 在 `.agents/skills/` 或 `.cursor/skills/` | 範圍限定的 `.mdc` 只做提醒與連結，不複製本檔。 |
| Claude Code | `CLAUDE.md`（`@AGENTS.md` 加 Claude 專用備註）。Skills：`.claude/skills/<name>/SKILL.md` | `.claude/skills/` 與 `.agents/skills/` 相同（有漂移檢查）。 |
| Copilot | 原生讀 `AGENTS.md`。`.github/copilot-instructions.md` 與 `.github/instructions/*.instructions.md`（`applyTo`） | 那些檔是短指針。 |
| Gemini CLI | `.gemini/settings.json` 的 context 檔名 | `{"context":{"fileName":["AGENTS.md"]}}`。`GEMINI.md` 只做指針。 |

共用 skills 在 `.agents/skills/`。完整步驟在 `docs/skills/`。

## 漸進披露

| 工作 | 閱讀 |
|---|---|
| 計劃功能 | [plan-feature](docs/skills/plan-feature.zh.md)、[docs/plans/_template.zh.md](docs/plans/_template.zh.md) |
| 產生產品 | [new-product](docs/skills/new-product.zh.md)、[create-ysk-app](docs/cli/create-ysk-app.zh.md) |
| 加資源 | [add-module](docs/skills/add-module.zh.md)、[操作手冊](docs/recipes/add-module.zh.md) |
| 還原 llm／team／billing／push | [add-capability](docs/skills/add-capability.zh.md) |
| Envelope／SSE／PDF | [envelope-api](docs/skills/envelope-api.zh.md)、[envelope 指南](docs/guides/envelope.zh.md) |
| `pnpm layers` 失敗 | [fix-layers](docs/skills/fix-layers.zh.md)、[hexagonal](docs/guides/hexagonal.zh.md) |
| 任何功能之後 | [verify-change](docs/skills/verify-change.zh.md) |
| 計劃如何測試 | [test-plan](docs/skills/test-plan.zh.md) |
| 寫測試 | [write-tests](docs/skills/write-tests.zh.md)、[測試指南](docs/guides/testing.zh.md) |
| 新增或改動畫面 | [ui-design](docs/skills/ui-design.zh.md) |
| 完成 UI | [ui-review](docs/skills/ui-review.zh.md) |
| 更新產品 | [upgrade](docs/guides/upgrade.zh.md) |
| CLI 旗標 | [ysk-kit](docs/cli/ysk-kit.zh.md) |

## 不要

- 把沙龍、交易、地圖或其他行業 domain 放進本 kit。教程在 `examples/`（`pnpm --filter @ysk-kit/examples start apply <slug> --yes`）。
- 從 web／admin／mobile／desktop import `@ysk-kit/observability`。
- 把 Hono／Drizzle／Nest／Next 設為預設。
- 把密鑰、OTP 代碼、Stripe `sk_` 或 webhook 密鑰寫進日誌。
- 把本檔複製進各工具包裝。
- 把 `opencode.json` 的 `instructions` 當成 OpenCode 入口。
