# YSK Kit

合約先行的全端平台：共用合約、hexagonal API，以及可選的 Web、Admin、流動應用與桌面客戶端。

Language: [English](README.md) · 中文

| | |
|---|---|
| **版本** | 1.5.0 |
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
| `pnpm create @ysk-kit/app <name>`／`npm create @ysk-kit/app <name>` | 從 npm 產生一個產品 |
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

### v1.5.0

#### 改進

- kit 運行時是 **Node 26（Current）**。`engines.node` 是 `>=26.0.0`。GitHub Actions `node-version` 是 `26`。`@types/node` 是 `^26.6.5`，DefinitelyTyped major 對齊 Node major。停在 Node 24 的 dest 產品會過不了 `ysk-kit doctor` engines。
- `ysk-kit doctor` engines 提示改為安裝 Node 26。`create-ysk-app` dest README 註解寫 Node 26 + pnpm 12。

#### 內部／CI

- 協調 bump 取代 Dependabot #38（只改 types，CI 仍停在 24）。v1.3.0 已發佈桌面 Vite 8（#41／#44）。v1.4.0 已發佈 Expo SDK 58（#42／#45）。

### v1.4.0

#### 依賴升級

- 流動應用 Expo 57.0.26 → **58.0.7**（npm dist-tag **`next`**；**`latest` 仍是 57.0.27**）、`expo-secure-store` ~58.0.2、`expo-status-bar` ~58.0.3、React Native 0.86.3 → **0.88.0-rc.4**、React 19.2.8 → **19.3.0**（工作區）。取代 Dependabot #35。v1.3.0 已發佈桌面 Vite 8（#41／#44）。

### v1.3.0

#### 依賴升級

- 桌面 Vite 7.3.6 → 8.3.2，electron-vite 5.0.0 → 6.0.0-beta.8（beta；peer Vite 6–8）。web／admin 已在 Vite 8.3.2。取代 Dependabot #36（該 PR 只升 vite，留下 electron-vite 5，peer 範圍不含 Vite 8）。

完整變更紀錄：[CHANGELOG.zh.md](CHANGELOG.zh.md)。

## 授權

MIT — 見 [LICENSE](./LICENSE)。

## 作者

**Ki (yanshekki)** — [YSK Limited](https://ysk.hk/)。[linktr.ee/yanshekki](https://linktr.ee/yanshekki)
