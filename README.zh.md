# YSK Kit

合約先行的全端平台：共用合約、hexagonal API，以及可選的 Web、Admin、流動應用與桌面客戶端。

Language: [English](README.md) · 中文

| | |
|---|---|
| **版本** | 1.1.0 |
| **授權** | MIT |
| **公司** | [YSK Limited](https://ysk.hk/) |
| **聯絡** | email@ysk.hk |

需要 **Node 24**（Active LTS）與 **pnpm 12**。Agent 法律：[AGENTS.zh.md](./AGENTS.zh.md)。文件地圖：[docs/README.zh.md](docs/README.zh.md)。

本倉是可運行的 `saas` flavor。身分、檔案、通知、工作、郵件、API 金鑰、加密、即時通訊已經接上。產品業務 domain 不寫入 kit。

## 十五分鐘開一個產品

從 npm：

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
| `pnpm ysk-kit check agent` | 標記 TypeScript enum、客戶端 Prisma、raw fetch |
| `pnpm create @ysk-kit/app <name>` | 從 npm 產生一個產品 |
| `pnpm --filter @ysk-kit/create-app start <name>` | 從本倉產生一個產品 |
| `pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent` | 驗證一次改動 |

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

## 授權

MIT — 見 [LICENSE](./LICENSE)。

## 作者

**Ki (yanshekki)** — [YSK Limited](https://ysk.hk/)。[linktr.ee/yanshekki](https://linktr.ee/yanshekki)
