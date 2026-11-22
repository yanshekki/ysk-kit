# YSK Kit

合約先行的全端平台：共用合約、hexagonal API，以及可選的 Web、Admin、流動應用與桌面客戶端。

Language: [English](README.md) · 中文

| | |
|---|---|
| **版本** | 1.6.13 |
| **授權** | MIT |
| **公司** | [YSK Limited](https://ysk.hk/) |
| **聯絡** | email@ysk.hk |

需要 **Node 26**（Current）與 **pnpm 12**。Agent 法律：[AGENTS.zh.md](./AGENTS.zh.md)。文件地圖：[docs/README.zh.md](docs/README.zh.md)。

本倉是可運行的 `saas` flavor。身分、檔案、通知、工作、郵件、API 金鑰、加密、即時通訊已經接上。產品業務 domain 不寫入 kit。

## 十五分鐘開一個產品

從 npm（`npm create @ysk-kit/app` 或 `pnpm create @ysk-kit/app`；npm 上沒有無 scope 的 `create-ysk-app` 套件）：

```bash
pnpm create @ysk-kit/app my-product --preset thin --db mysql --flavor saas
```

從本倉：

```bash
pnpm --filter @ysk-kit/create-app start my-product --preset thin --db mysql --flavor saas
```

然後：

```bash
cd my-product
pnpm install
cp .env.example .env
docker compose up -d mysql
pnpm db:generate && pnpm db:migrate && pnpm db:seed
pnpm ysk-kit add module appointment --prisma --web
pnpm gen:openapi
pnpm dev
```

預設 preset 是 **thin**：複製本樹後剝走 llm、billing、organizations 與 push 裝置。`--preset full` 保留完整示範。還原能力：`pnpm ysk-kit add llm|team|billing|push`。

十個已完成的產品系統（欄位、規則、截圖）見 [examples/](examples/README.zh.md)。套用：`pnpm --filter @ysk-kit/examples start apply <slug> --yes`。

## 運行本倉

```bash
pnpm install
cp .env.example .env
docker compose up -d mysql
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

| 介面 | 網址 |
|---|---|
| API | http://localhost:3001（可選 `HTTP_ADAPTER=fastify`） |
| Web | http://localhost:5173 |
| Admin | http://localhost:5174 |
| OpenAPI UI | http://localhost:3001/docs（`GET /openapi.json`） |

種子之後以 `admin@ysk.hk` / `ysk-admin-dev` 登入（見 `.env.example`）。若 3001、5173 或 5174 已被佔用，改 `.env` 的 `API_PORT` 與對應的 `*_PUBLIC_URL`。

可選 traces：`docker compose up -d jaeger`，設定 `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318`，介面 http://localhost:16686。可選 metrics 介面：`docker compose up -d prometheus grafana` — Prometheus http://localhost:9090，Grafana http://localhost:3000（`admin` / `admin`）。

PostgreSQL 或 SQLite：新產品用 `create-ysk-app --db postgresql|sqlite` 改寫 Prisma provider。在本倉則自行改 `datasource.provider` 與 `DATABASE_URL`。

## 命令

| 命令 | 用途 |
|---|---|
| `pnpm ysk-kit add module <name> --prisma --web` | hexagonal HTTP 切片 |
| `pnpm ysk-kit add <capability>` | 合併一項已編目的能力 |
| `pnpm ysk-kit upgrade` | 更新允許清單上的 kit 護欄 |
| `pnpm ysk-kit plan <slug>` | 寫英文精簡計劃（可選 `--full`／`--zh`） |
| `pnpm ysk-kit plan --check <file>` | 缺必要標題時失敗 |
| `pnpm ysk-kit check agent` | 標記 TypeScript enum、客戶端 Prisma、raw fetch、指針漂移、docs-budget |
| `pnpm ysk-kit check docs-budget` | 標記過長 Unreleased、禁止的 CHANGELOG 句子、過大精簡計劃、git-add 的 QA PNG |
| `pnpm ysk-kit check errors` | 標記 `application/` 普通 `Error`、API `console.log`、`process.env` 日誌 |
| `pnpm ysk-kit check logs --file <jsonl>` | 驗證捕捉到的 Pino JSON（密鑰、ERROR `requestId`） |
| `pnpm ysk-kit check supply [--json] [--repo-only] [--online]` | 盤點 Node、PHP、lockfile 與 Actions pin，對照內建目錄 |
| `pnpm create @ysk-kit/app <name>`／`npm create @ysk-kit/app <name>` | 從 npm 產生一個產品 |
| `pnpm --filter @ysk-kit/create-app start <name>` | 從本倉產生一個產品 |
| `pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent && pnpm ysk-kit check errors` | 驗證一次改動 |

完整表格：[CLI](docs/cli/index.zh.md)、[工作區 script](docs/cli/workspace-scripts.zh.md)、[環境變數](docs/cli/env.zh.md)。

## Flavor

| Flavor | 得到甚麼 |
|---|---|
| `saas` | API + web + admin + 可選 mobile |
| `desktop` | API + Electron |
| `gateway` | API + admin（機器 API 金鑰） |
| `php-bridge` | OpenAPI + TypeScript/PHP 客戶端，沒有 Node 應用 |
| `trading` | API + web + worker |
| `static-web3` | 只有 Vite web |

詳情：[flavors](docs/guides/flavors.zh.md)。

## 規則（短）

- `@ysk-kit/contracts` 是 enum、DTO、error code 與 ts-rest 路由的唯一來源。
- 不用 TypeScript `enum`。
- 客戶端只經 `@ysk-kit/sdk` 呼叫 API。
- Prisma 只留在 API infra。
- JSON 回應用 `{ ok, data }` / `{ ok, error }`，四個已文件化的 envelope 例外除外。

見 [架構](docs/architecture.zh.md) 與 [AGENTS.zh.md](./AGENTS.zh.md)。

## 變更紀錄

最近三個版本。較舊的版本在完整變更紀錄。

### v1.6.14

#### 依賴升級

- turbo **2.11.13**。Expo **58.0.26**。Vitest **5.1.1**。jose **6.2.18**。nodemailer **10.6.1**。BullMQ **6.7.8**。`@bull-board/*` **9.14.0**。AWS SDK S3 **3.1175.0**。TanStack Query **5.108.2**。dependency-cruiser **18.8.0**。`source-map-js` **1.2.4**。

#### 安全

- 供應鏈目錄 PHP 下限 **8.2.36／8.3.37／8.4.28／8.5.13**，另加目錄專用 **8.6.0**（`updated` 2026-11-22）。php-bridge 仍在 8.2（`>=8.2.36`）。override `effect` **3.22.5**（GHSA-7589-6fvf-x4pw）。

#### 內部／CI

- 編碼工具表：Grok Build 不再聲稱讀 `GEMINI.md`。Copilot 與 Gemini CLI 會載入 `.agents/skills/`。暫緩：TypeScript 7、Prisma 8 RC、pnpm 12.22.0（`next-12`）。

### v1.6.13

#### 改進

- CI `thin-smoke` 檢查四個 skill 路由器（`plan`、`implement`、`verify`、`review`）。`docs/agent/NOW.md` 進行中清單為空。

#### 依賴升級

- Electron **45.4.1**。Biome **2.6.8**。`@testing-library/user-event` **14.6.13**。OpenTelemetry `api` **1.10.0**、`resources`／`sdk-metrics`／`sdk-trace` **3.1.1**、實驗 **0.301.2**。

### v1.6.12

#### 改進

- 預設精簡計劃（`pnpm ysk-kit plan <slug>`）、四個 skill 路由器（`plan`、`implement`、`verify`、`review`）、`ysk-kit check docs-budget`，以及 `docs/agent/NOW.md`。根 `AGENTS.md` 約 5 KB。

完整變更紀錄：[CHANGELOG.zh.md](CHANGELOG.zh.md)。

## 授權

MIT — 見 [LICENSE](./LICENSE)。

## 作者

**Ki (yanshekki)** — [YSK Limited](https://ysk.hk/)。[linktr.ee/yanshekki](https://linktr.ee/yanshekki)
