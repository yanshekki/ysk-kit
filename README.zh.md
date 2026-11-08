# YSK Kit

合約先行的全端平台：共用合約、hexagonal API，以及可選的 Web、Admin、流動應用與桌面客戶端。

Language: [English](README.md) · 中文

| | |
|---|---|
| **版本** | 1.6.10 |
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
| `pnpm ysk-kit plan <slug>` | 按模板寫入 `docs/plans/<yyyy-mm-dd>-<slug>.md` |
| `pnpm ysk-kit plan --check <file>` | 計劃缺標題或仍是佔位內容時失敗 |
| `pnpm ysk-kit check agent` | 標記 TypeScript enum、客戶端 Prisma、raw fetch、指針漂移 |
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

### v1.6.10

#### 新功能

- `create-ysk-app --with-rust-sidecar`（TTY 預設 **no**）在帶 API 的 flavor 複製 dest 專用 `crates/ysk-sidecar` crate，放在 `ICryptoPort` 背後。私有換行 JSON stdio。`@ysk-kit/crypto` `createStdioCryptoPort`。食譜：[Rust sidecar](docs/recipes/rust-sidecar.zh.md)。

### v1.6.9

#### 依賴升級

- pnpm **12.18.0**（`latest` = `latest-12` = `next-12`）。Expo **58.0.23**。Electron **44.10.2**。Vite **8.3.6**。jose **6.2.15**。`@bull-board/*` **9.11.0**。nodemailer **10.4.0**。AWS SDK S3 **3.1164.0**。TanStack Query **5.107.1**。BullMQ **6.7.2**。Vitest **5.1.0**。Playwright **1.65.0**。

#### 內部／CI

- Compose Jaeger **2.23.0**、Prometheus **v3.16.0**、Grafana **13.3.0**。Override：`node-forge` 1.4.3、`undici` 7.30.2、`mariadb` 3.5.5。審計忽略現只剩 glob 13 與 minimatch 10。暫緩：Electron 45、Biome 2.6、TypeScript 7、Prisma 8 RC、OpenTelemetry major。

### v1.6.8

#### 新功能

- Skill [clarify-feature](docs/skills/clarify-feature.zh.md)：未決問題非空時，計劃批准前最多五題（授權、租戶、envelope、flavor／preset、UI 表面）。答案折進日期計劃配對。路徑卡 [sdd-path](docs/plans/sdd-path.zh.md)：精簡是 plan-feature → 實作 skill → verify-change → review-change；完整先插入 clarify-feature。沒有 Spec Kit CLI，也沒有 `.specify/`。

完整變更紀錄：[CHANGELOG.zh.md](CHANGELOG.zh.md)。

## 授權

MIT — 見 [LICENSE](./LICENSE)。

## 作者

**Ki (yanshekki)** — [YSK Limited](https://ysk.hk/)。[linktr.ee/yanshekki](https://linktr.ee/yanshekki)
