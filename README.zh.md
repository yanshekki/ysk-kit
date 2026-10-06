# YSK Kit

合約先行的全端平台：共用合約、hexagonal API，以及可選的 Web、Admin、流動應用與桌面客戶端。

Language: [English](README.md) · 中文

| | |
|---|---|
| **版本** | 1.2.1 |
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
| `pnpm ysk-kit plan <slug>` | 按模板寫入 `docs/plans/<yyyy-mm-dd>-<slug>.md` |
| `pnpm ysk-kit plan --check <file>` | 計劃缺標題或仍是佔位內容時失敗 |
| `pnpm ysk-kit check agent` | 標記 TypeScript enum、客戶端 Prisma、raw fetch、指針漂移 |
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

### v1.2.2

#### 安全

- Electron 在 `safeStorage` 不可用時不再把 access／refresh 權杖以明文寫入磁碟。權杖只留在該次工作階段的記憶體，主行程會記錄不含密鑰的警告。
- 桌面設定 Content-Security-Policy、`sandbox: true` 與 `webSecurity: true`，拒絕未預期的導航與 `window.open`，並拒絕 sender frame 不是已載入 renderer 的 IPC。
- `@ysk-kit/logger` 會遮蔽 authorization、cookie、token、password、API key 等欄位（pino `redact`）。
- `/v1/llm/complete` 與 `/v1/llm/stream` 只接受 `user` 與 `assistant` 訊息。system prompt 來自 `LLM_SYSTEM_PROMPT`（伺服器持有）。每用戶配額是 `LLM_QUOTA_MAX`／`LLM_QUOTA_WINDOW_MS`，回 envelope `RATE_LIMITED`（429）。
- `POST /v1/billing/webhook` 仍在 raw body 上驗證 `Stripe-Signature`，把 Stripe `event.id` 寫入 `ProcessedWebhookEvent`，重送直接確認，並忽略同一組織較舊的事件。

### v1.2.1

#### 新功能

- `pnpm ysk-kit plan --check <file>` 檢查計劃是否具備每個必要模板標題，必填章節若仍是佔位內容則失敗。
- Agent skills `test-plan`、`write-tests`、`ui-design` 與 `ui-review`（英文 + 香港書面語），連同 `.agents`／`.claude` 包裝與範圍限定的 Cursor／Copilot 指針，因此 `create-ysk-app` 與 `ysk-kit upgrade` 會把它們寫進已產生的產品。

#### 改進

- 計劃協議保留 v1.2.0 的 kit 專用章節，並新增：先探索再計劃（合約之前的**現況與重用**）、範圍／非目標旁邊的**假設**、**考慮過的方案**（有真正替代時兩個做法）、任務步驟寫明檔案／介面／合約／資料／風險／回滾／驗收、驗證命令附預期結果與人手檢查清單，以及批准／禁止縮水閘。
- [docs/plans/README.zh.md](docs/plans/README.zh.md) 把各工具原生計劃模式（Grok Build、Cursor、Claude Code、Codex、OpenCode、Copilot）對照到本模板，並附可複製的 `/plan` 提示（中英）。獲准計劃仍是 `docs/plans/<date>-<slug>.md`，用 `pnpm ysk-kit plan <slug>` 建立。
- 計劃模板的「測試計劃」一節指向 `test-plan`（按風險排序的 given/when/then、夾具、不涵蓋範圍、分層對應）。
- 巢狀 `AGENTS.md` 把 API／contracts 指向測試 skills，把客戶端 app 指向 UI skills。
- 鎖步測試要求任何待處理 changeset 都以同一種 bump 列出全部 26 個公開 `@ysk-kit` 套件。

#### 內部／CI

- `thin-smoke` 與 `flavor-smoke` 會斷言新的模板標題，以及測試／UI skill 檔與 Cursor 規則。產生出來的產品會收到升級後的 `_template.md` 配對。create-app 與 upgrade 測試會斷言同一批 skill 檔。

### v1.2.0

#### 新功能

- `pnpm ysk-kit plan <slug>` 按共用模板把雙語功能計劃寫入 `docs/plans/<yyyy-mm-dd>-<slug>.md`（及 `.zh.md` 配對），並寫入已 gitignore 的根目錄 `plan.md` 指針。
- thin 與 full 工作區產品都會收到同一套 agent 指針：`.agents/skills/`、`.claude/skills/`、範圍限定的 `.cursor/rules/*.mdc`、`.github/copilot-instructions.md`、`.gemini/settings.json`、`GEMINI.md`，以及計劃模板。

#### 改進

- `AGENTS.md`／`AGENTS.zh.md` 改為專業 agent 指引：定位、倉目錄地圖、十條硬規則連同原因、強制的理解 → 計劃 → 合約 → 骨架 → 實作 → 驗證 → 文件流程、完成定義、何時詢問、陷阱，以及程式工具表。程序仍在 `docs/skills/`。
- `pnpm ysk-kit check agent` 也會在指針不再提及 `AGENTS.md`、skill 副本漂移，或根目錄加巢狀 `AGENTS.md` 超過 24 KiB 時失敗。
- Skills（`docs/skills/` 與 `.agents/skills/`）新增 `plan-feature`，並採用觸發／輸入／步驟／驗證／完成條件。

#### 安全

- pnpm override `source-map-js@1.2.2` 修復 [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q)／CVE-2026-93749（indexed source map 位移導致 event-loop DoS）。該套件經 PostCSS／Expo Metro 間接引入。

#### 依賴升級

| 套件 | 由 | 至 |
|---|---|---|
| source-map-js（工作區 override） | 1.2.1 | 1.2.2 |

#### 內部／CI

- `thin-smoke` 與 `flavor-smoke` 會斷言產生出來的指針套件。`php-bridge` 仍然略過工作區 agent 包裝。

完整變更紀錄：[CHANGELOG.zh.md](CHANGELOG.zh.md)。

## 授權

MIT — 見 [LICENSE](./LICENSE)。

## 作者

**Ki (yanshekki)** — [YSK Limited](https://ysk.hk/)。[linktr.ee/yanshekki](https://linktr.ee/yanshekki)
