# YSK Kit

合約先行的全端平台：共用合約、hexagonal API，以及可選的 Web、Admin、流動應用與桌面客戶端。

Language: [English](README.md) · 中文

| | |
|---|---|
| **版本** | 1.6.4 |
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

### v1.6.5

#### 新功能

- Skill [upgrade-kit](docs/skills/upgrade-kit.zh.md)：kit 依賴、Dependabot、每週穩定版，以及 Actions 跑不了時的本機 smoke。Dest 產品更新仍用 [upgrade](docs/guides/upgrade.zh.md)。

#### 改進

- `AGENTS.md`：Claude Code **不**載入 `.agents/skills/`（只載入 `.claude/skills/`）；Cursor Cloud Agents 提交專案 skills；現況腳註（Devin Local、宿主 MCP）。

#### 依賴升級

- pnpm **12.15.0**、turbo **2.11.10**、BullMQ **6.4.2**、nodemailer **10.2.1**、Electron **44.9.3**、Expo **58.0.19**、Vite **8.3.5**。暫緩：TypeScript 6、Prisma 8 RC、Electron 45（已是穩定版；major 暫緩）。

#### 內部／CI

- Compose／CI MySQL **8.4.13**。Prometheus **v3.15.1**。Override：`body-parser` 2.4.0、`undici` 7.30.1、`fast-uri` 3.1.9／4.2.3。忽略 Expo CLI 的 zod 3（GHSA-mrhx-c7xc-m3w5）。

### v1.6.4

#### 安全

- `ysk-kit check supply` 盤點 Node、PHP、kernel、lockfile IOC、GitHub Actions SHA 與 compose 標籤，對照內建目錄（2026 年 10 月 php2shell 與 Node Brotli 下限）。Skill [supply-scan](docs/skills/supply-scan.zh.md)。沒有 Trivy。
- `engines.node` 為 `>=26.12.1`。php-bridge `require.php` 為 `>=8.2.35`。Override `launch-editor` 2.14.2。

#### 內部／CI

- CI `check` 跑 `pnpm ysk-kit check supply --repo-only --online`，不再直接跑 `pnpm audit`。Doctor 檢查 id `supply`。

### v1.6.3

#### 新功能

- Skill [i18n-localize](docs/skills/i18n-localize.zh.md)：`@ysk-kit/i18n`（`zh-HK` | `en`）、envelope 代碼維持英文穩定、`Intl` 格式化。App 接線不在本版。

#### 改進

- `AGENTS.md` 程式工具表：OpenCode 的 Claude 回退、Gemini Agent Skills、Copilot／Grok skill 路徑。

#### 依賴升級

- pnpm **12.14.0**、turbo **2.11.9**、React **19.3.1**、Prisma **7.10.1**（不是 8 RC）、BullMQ **6.3.16**、Electron **44.9.0**、Expo **58.0.14**。暫緩：TypeScript 6、Prisma 8 RC、Electron 45 beta。

#### 內部／CI

- `.nvmrc` **26**。Compose／CI MySQL **8.4.11**。

完整變更紀錄：[CHANGELOG.zh.md](CHANGELOG.zh.md)。

## 授權

MIT — 見 [LICENSE](./LICENSE)。

## 作者

**Ki (yanshekki)** — [YSK Limited](https://ysk.hk/)。[linktr.ee/yanshekki](https://linktr.ee/yanshekki)
