# `ysk-kit`

Language: [English](ysk-kit.md) · 中文

產生器位於 `tooling/ysk-cli`。命令：`ysk-kit`，短名 `yskk`。在產品根目錄執行 `pnpm ysk-kit …`（或 `pnpm --filter @ysk-kit/cli start …`）。

```text
pnpm ysk-kit add module <kebab-name> [--prisma] [--web] [--no-web]
pnpm ysk-kit add <capability>
pnpm ysk-kit generate openapi
pnpm ysk-kit upgrade [--dry-run]
pnpm ysk-kit check agent
pnpm ysk-kit doctor [--json]
pnpm ysk-kit plan <kebab-slug> [--date YYYY-MM-DD] [--force]
pnpm ysk-kit plan --check <file>
```

環境變數：`YSK_ROOT` — 要修補的產品根目錄。未設定時預設為本 kit。

## `ysk-kit add module`

寫出一條 hexagonal HTTP 切片。名稱必須符合 `^[a-z][a-z0-9-]*$`（例如 `booking`、`inventory-item`）。URL 是 `/v1/<name>`。Prisma model 是該名稱的 PascalCase。

| 旗標 | 預設 | 作用 |
|---|---|---|
| `--prisma` | 關閉 | 把 `title` / `body` / `authorId` model 合併進 `apps/api/prisma/schema.prisma`，並寫出 `modules/<name>/prisma/<name>.prisma` |
| `--web` | 開啟 | 寫出 `apps/web/src/features/<name>/<name>-page.tsx` |
| `--no-web` | — | 略過 Vite 頁面 |

會建立的檔案（已存在則略過）：

| 路徑 | 職責 |
|---|---|
| `packages/contracts/src/dto/<name>.ts` | DTO + create command |
| `packages/contracts/src/api/<name>.ts` | ts-rest list + create，`OkSchema` / `ErrSchema` |
| `apps/api/src/modules/<name>/domain/` | Repository port |
| `apps/api/src/modules/<name>/application/` | Service |
| `apps/api/src/modules/<name>/infra/` | 記憶體 + Prisma repo、`HttpHandler` map、Express 註冊、service 測試 |
| `packages/sdk/src/resources/<name>.ts` | `client.<name>.list/create` |
| `packages/web-sdk/src/<name>-hooks.ts` | `useList` / `useCreate` |

檔案存在時，命令亦會修補 `appContract`、`apps/api/src/app.ts`、`app-fastify.ts`、`composition.ts`、`main.ts` 與 `create-memory-input.ts`。Express 路由掛在 `errorHandler` 之前。同一名稱再跑一次，對已有檔案是空操作。

產生之後：若需要更多欄位就改 Prisma model，規則放在 `application/`，然後：

```bash
pnpm db:migrate
pnpm gen:openapi
pnpm layers && pnpm typecheck && pnpm test
```

操作手冊：[add-module](../recipes/add-module.zh.md)。

## `ysk-kit add <capability>`

合併一項已編目的平台能力。未知名稱會丟出 `unknown capability`。別名：`org` → `team`。

| 能力 | 加入甚麼 |
|---|---|
| `auth` | Session／OTP Prisma、`JWT_*`、`OTP_TTL_SECONDS`、`TWILIO_*`、`@ysk-kit/auth` |
| `rbac` | 權限已在 `ROLE_PERMISSIONS`；不複製檔案 |
| `audit-log` | 審計 Prisma fragment |
| `storage` | FileObject fragment、`S3_*`、`@ysk-kit/storage` |
| `i18n` | `@ysk-kit/i18n`（預設 locale zh-HK） |
| `jobs` | `REDIS_URL`、`@ysk-kit/jobs` |
| `mail` | `SMTP_URL`、`MAIL_FROM`、`@ysk-kit/mail` |
| `notifications` | 站內通知路由 |
| `llm` | `LlmUsage`、源碼樹 + Express/Fastify/composition/SDK/web 修補、`LLM_*` / `XAI_API_KEY` |
| `websocket` | `@ysk-kit/realtime`，以 `createRealtimeFromEnv` 修補 `composition.ts` |
| `push` | Device fragment、源碼樹 + worker 修補、`EXPO_ACCESS_TOKEN`、`FCM_*` |
| `mobile` | 指向 `apps/mobile` Expo 模板 |
| `team` | Organization + Membership fragment、源碼樹 + web 與 Expo 組織畫面 |
| `apikey` | ApiKey fragment |
| `crypto` | `CRYPTO_MASTER_KEY`、`@ysk-kit/crypto` |
| `billing` | Organization 上的 Subscription fragment；**須先有 `team`** |

對 `llm`、`team`、`billing`、`push`，若產品的 `app.ts` 或 `composition.ts` 尚未包含略過標記（`createLlmService`、`createOrganizationService`、`createBillingService`、`createDeviceService`），命令會複製 `tooling/ysk-cli/templates/capabilities/<name>/`。本倉已經接上那些 service，再加一次是空操作。

若 `schema.prisma` 沒有 `model Organization`，`ysk-kit add billing` 會丟出錯誤。請先執行 `pnpm ysk-kit add team`。

每次 add 都會合併缺失的 Prisma fragments、`.env.example` 鍵，以及 `apps/api` workspace 依賴。它不執行 `prisma migrate`。

操作手冊：[add-capability](../recipes/add-capability.zh.md)。

## `ysk-kit generate openapi`

讀取 ts-rest `appContract`，寫出 `docs/openapi.yaml`。等價命令：`pnpm gen:openapi`。

## `ysk-kit upgrade`

把 **允許清單上的護欄檔** 從含有此 CLI 的 kit 工作副本，複製到產品根目錄（`YSK_ROOT`，未設定時為本倉）。

```text
pnpm ysk-kit upgrade
pnpm ysk-kit upgrade --dry-run
```

| 旗標 | 作用 |
|---|---|
| `--dry-run` | 列印 `will copy` / `skip` / `will write agent stubs` / `will write .ysk-kit.json`，不寫檔 |

會覆寫的路徑：`AGENTS.md`、`AGENTS.zh.md`、`CLAUDE.md`、`GEMINI.md`、`.dependency-cruiser.cjs`、`packages/typescript-config/`、`packages/biome-config/`、`docs/skills/`、`docs/plans/`（模板與 README）、`.agents/`、`.gemini/`、`.github/copilot-instructions.md`、`.github/instructions/`。複製目錄時略過 `node_modules` 與 `dist`。Kit 沒有的路徑會略過。工作區產品也會從 `tooling/ysk-cli/templates/agent/` 產生 skill 包裝到 `.agents/skills/`、`.claude/skills/`、`.cursor/skills/`、`.grok/skills/`，以及範圍限定的 `.cursor/rules/*.mdc`。

不會改動：`apps/**`、`modules/**`、產品 DTO、產品 `README.md`、`.env`、Prisma 遷移、`docs/openapi.yaml`。

成功執行後，`.ysk-kit.json` 的 `version` 會設成當前 kit 版本；`flavor`、`preset` 與 `db` 保留。若沒有標記，只要存在 `pnpm-workspace.yaml` 或 `AGENTS.md`，命令仍會執行，然後寫入標記（未設定的 flavor／preset／db 為 `unknown`）。否則丟出錯誤，要求在產品根目錄執行或設定 `YSK_ROOT`。

要套用較新的 kit，請執行 **該 kit** 的 CLI：

```bash
YSK_ROOT=/path/to/your-product pnpm ysk-kit upgrade
```

指南：[更新已產生產品的護欄](../guides/upgrade.zh.md)。

## `ysk-kit check agent`

掃描產品根目錄（`YSK_ROOT`，未設定時為本倉）裏典型的壞補丁。只做文字掃描：不啟動資料庫、不跑 typecheck。

```text
pnpm ysk-kit check agent
```

退出 0 時列印 `ysk-kit check agent: ok`。退出 1 時每條發現一行：`rule  file:line`。

| 規則 | 掃描範圍 | 標記甚麼 |
|---|---|---|
| `no-ts-enum` | `apps/**`、`packages/**`、`modules/**`（`.ts` / `.tsx`） | TypeScript `enum` / `const enum` |
| `clients-no-prisma` | `apps/web`、`apps/admin`、`apps/mobile`、`apps/desktop` | import `@prisma/client`、`@ysk-kit/db-prisma`、`apps/api/src/generated` 或 `generated/prisma` |
| `clients-no-raw-fetch` | 同上四個 client app | `fetch(` |
| `pointer-agents-md` | `CLAUDE.md`、`GEMINI.md`、`.github/copilot-instructions.md`、`.gemini/settings.json`、`.cursor/rules/*.mdc`、`.github/instructions/*.instructions.md`、skill 的 `SKILL.md` 副本 | 檔案存在但不含 `AGENTS.md` |
| `skill-drift` | `.agents/skills`、`.claude/skills`、`.cursor/skills`、`.grok/skills`，以及（若存在）kit 模板 | 副本缺失或內容不同 |
| `agents-md-budget` | 產品根底下每個 `AGENTS.md` | UTF-8 合計超過 24 KiB |

略過：`*.test.ts` / `*.test.tsx`、註解行、`node_modules`、`dist`、`generated`、`coverage`。Prisma schema 的 `enum UserStatus` 在 `.prisma` 檔，不是 TypeScript，不會掃描。

允許的 raw `fetch`：`apps/admin/src/features/queues/queues-page.tsx`（Bull Board HTML 探測）。`@ysk-kit/sdk` 的 HTTP 在 `packages/sdk`，不是 client app。

測試：[測試指南](../guides/testing.zh.md)。

## `ysk-kit plan`

按 [docs/plans/_template.md](../plans/_template.md) 寫出雙語功能計劃。

```text
pnpm ysk-kit plan <kebab-slug>
pnpm ysk-kit plan <kebab-slug> --date 2026-10-06
pnpm ysk-kit plan <kebab-slug> --force
pnpm ysk-kit plan --check docs/plans/2026-10-06-<slug>.md
```

| 旗標 | 作用 |
|---|---|
| `--date YYYY-MM-DD` | 檔名中的曆日。預設：今天（本地） |
| `--force` | 覆寫已有的日期配對 |
| `--check <file>` | 缺必要標題或仍是佔位內容時退出 1 |

會建立 `docs/plans/<date>-<slug>.md`、`docs/plans/<date>-<slug>.zh.md`，以及根目錄 `plan.md` 指針（已 gitignore）。Slug 必須符合 `^[a-z][a-z0-9-]*$`。程序：[plan-feature](../skills/plan-feature.zh.md)。模板章節與工具計劃模式：[docs/plans/README.zh.md](../plans/README.zh.md)。

## `ysk-kit doctor`

檢查一個已產生的產品，並為每個問題印出修法。`YSK_ROOT` 選擇產品（未設定時為本倉）。護欄與含有此 CLI 的 kit 工作副本比較，來源與 `upgrade` 相同。

```text
pnpm ysk-kit doctor
pnpm ysk-kit doctor --json
```

每個檢查都是 `ok` 或 `warn` 時退出 0。任一檢查為 `error` 時退出 1。`--json` 印出 `{ ok, errors, warnings, checks }`，報告不含密鑰內容。

| 檢查 | 錯誤 | 警告 | 修法 |
|---|---|---|---|
| `engines` | Node 或 pnpm 不符合 `package.json` 的 `engines`，或 `PATH` 沒有 `pnpm` | `packageManager` 釘選與 `pnpm --version` 不同，或沒有 `engines` | 安裝 Node 24，執行 `corepack enable && corepack prepare pnpm@12.9.0 --activate` |
| `env` | API 產品缺少 `DATABASE_URL` 或 `JWT_SECRET` | `static-web3` 缺少 `API_PUBLIC_URL` 或 `WEB_PUBLIC_URL`；`php-bridge` 缺少 `API_PUBLIC_URL` | `cp .env.example .env` 並設定這些鍵。公開 URL 與 PHP bridge 有 localhost 預設，因此只是警告 |
| `secrets` | `NODE_ENV=production` 仍用佔位 `JWT_SECRET`、密鑰短於 8 字元、生產環境仍用範例種子密碼，或 `CRYPTO_MASTER_KEY` 不是 64 個十六進位字元 | 開發環境使用範例 `JWT_SECRET`、密鑰短於 32 字元，或生產環境 `CRYPTO_MASTER_KEY` 為空 | `JWT_SECRET` 用 `openssl rand -base64 32`。`CRYPTO_MASTER_KEY` 用 `openssl rand -hex 32` |
| `database` | 伺服器連不上、SQLite 檔案不存在，或 Prisma 遷移未套用 | — | 開發用 `pnpm db:migrate`，生產用 `pnpm --filter @ysk-kit/api prisma:migrate:deploy`。沒有 `apps/api/prisma/schema.prisma` 時略過（`static-web3`、`php-bridge`） |
| `rules` | 允許清單上的護欄檔與本 kit 不同 | 檔案相符，但 `.ysk-kit.json` 缺失或其 `version` 落後本 kit | `pnpm ysk-kit upgrade` |
| `agent` | `check agent` 有發現 | — | 規則與 [`ysk-kit check agent`](#ysk-kit-check-agent) 相同 |

SQLite 用 Node 的 `node:sqlite` 開啟（`_prisma_migrations` 中 `finished_at` 有值且 `rolled_back_at` 為 null）。MySQL 與 PostgreSQL 在 `apps/api` 執行 `prisma migrate status`。報告會遮蓋連線字串。

`rules` 使用與 `upgrade` 相同的路徑。工作區產品亦比較 `.cursor/rules/*.mdc` 與 skill 包裝（一定比較 `.agents/skills`；其他 skill 樹只在存在時比較）。非工作區產品（`php-bridge`）略過此檢查。
