# YSK Kit

合約先行的全端平台：共用合約、hexagonal API，以及可選的 Web、Admin、流動應用與桌面客戶端。

Language: [English](README.md) · 中文

| | |
|---|---|
| **版本** | 1.1.2 |
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

## 變更紀錄

最近三個版本。較舊的版本在完整變更紀錄。

### v1.1.3

#### 改進

- 根目錄 `README.md` 與 `README.zh.md` 只列出最近三個版本。每個版本按適用的類別分組：新功能、改進、修正、安全、依賴升級、內部／CI。該節結尾連結到完整變更紀錄。

#### 內部／CI

- [CHANGELOG.md](CHANGELOG.md) 與 [CHANGELOG.zh.md](CHANGELOG.zh.md) 保留每一個版本，由新到舊，並使用同樣的類別。Changesets 產生的各套件 `CHANGELOG.md` 仍然保留，完整變更紀錄連結到這些檔案。
- [貢獻指引](docs/contributing.zh.md) 與 [工作區指令](docs/cli/workspace-scripts.zh.md) 的發佈一節規定：每次發佈都把新版本加在 README 該節的頂部，並把三個版本中最舊的一個移入完整變更紀錄。

### v1.1.2

#### 安全

- npm 發佈只使用 Trusted Publishing。release 工作流程保留 `id-token: write` 與 provenance，不傳入靜態 npm 憑證。
- `actions/setup-node` 不接收 `registry-url` 或 `scope`，因此不會寫入會蓋過 OIDC 的 registry 認證行。
- `.github/publish-packages.mjs` 在 OIDC token 不存在時退出。

#### 內部／CI

- 發佈後的 `npm view` 核對仍然保留。
- 產品發佈維持單一 annotated tag `vX.Y.Z`。

### v1.1.1

#### 改進

- `ysk-kit doctor` 的 engines 修復提示改為引用產品自己的 `packageManager` 釘選。
- `pnpm version:packages` 把 `@ysk-kit/create-app` 的版本寫入根 `package.json`，以及 `README.md` 與 `README.zh.md` 的版本格。

#### 安全

- overrides 維持 `deepmerge-ts` 8.0.2、`mariadb` 3.4.7（Prisma adapter 宣告 3.4.5）與 `mysql2` 3.24.5。
- 接受、而且沒有已修補的 npm 版本：uuid 7（經 Expo `xcode`，GHSA-w5hq-g745-h8pq）、node-forge 1.4.0（Expo CLI 程式碼簽署，GHSA-86w9-cpqp-85rv）、braces 3.0.3（Metro 檔案對應，GHSA-vfj7-8cjw-p6xm）。

#### 依賴升級

- pnpm 12.9.0（12.9.0 的 `pnpm login` 在重新導向時不再轉送憑證；12.9.1 當時仍在 24 小時發佈年齡窗內）、Turborepo 2.11.7、pino 10.4.0、`@aws-sdk/client-s3` 與 `@aws-sdk/s3-request-presigner` 3.1146.0、`@tanstack/react-query` 5.104.1、supertest 7.3.1、`@types/node` 24.19.1。
- 暫緩：TypeScript 7.0.2、`@types/node` 26（engines 是 Node 24）、Prisma 8.0.0-rc.19、桌面 Vite 7.3.6 配 `@vitejs/plugin-react` 5（electron-vite 5 的 peer 是 Vite 5–7）、Expo 57.0.26／React Native 0.86.3／React 19.2.8（Expo SDK 58 對準的 React Native 0.88 仍是 release candidate）、`@ts-rest/core` 3.53.0-rc.1。
- `prom-client` 15.1.3 已標為棄用，改用 `@prometheus-io/client` 之前先維持 `/metrics` 的 registry。Compose 映像維持 MySQL 8.4、Redis 8.10.2、Jaeger 2.21.0、Prometheus v3.15.0、Grafana 13.2.3。Actions 維持當時的 commit SHA。

#### 內部／CI

- release job 在 `npm view` 看不到每個已發佈版本時失敗。`pnpm release:publish` 自行執行 `pnpm publish --provenance`（commit `817e0f0`，在 v1.1.0 tag 之後、v1.1.1 之前）。

完整變更紀錄：[CHANGELOG.zh.md](CHANGELOG.zh.md)。

## 授權

MIT — 見 [LICENSE](./LICENSE)。

## 作者

**Ki (yanshekki)** — [YSK Limited](https://ysk.hk/)。[linktr.ee/yanshekki](https://linktr.ee/yanshekki)
