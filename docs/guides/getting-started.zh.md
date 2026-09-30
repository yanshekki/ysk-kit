# 入門

Language: [English](getting-started.md) · 中文

兩條路徑：運行本倉，或產生一個新產品。兩者都需要 **Node 24** 與 **pnpm 12**。

## 路徑 A — 本倉（可運行的 `saas`）

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
| API | http://localhost:3001 |
| Web | http://localhost:5173 |
| Admin | http://localhost:5174 |
| Scalar | http://localhost:3001/docs |

以 `admin@ysk.hk` / `ysk-admin-dev` 登入。第二個帳戶 `user@ysk.hk` / `ysk-user-dev` 也會被 upsert。密碼在 `.env.example`。

Fastify：在 `.env` 設 `HTTP_ADAPTER=fastify` 並重啟 API。

## 路徑 B — 新產品（thin，十五分鐘）

在 TTY 可省略旗標；命令會提示 flavor、preset 與資料庫。旗標與 `--yes` 會略過提問。

```bash
pnpm --filter @ysk/create-app start my-product --preset thin --db mysql --flavor saas
cd my-product
pnpm install
cp .env.example .env
docker compose up -d mysql
pnpm db:generate && pnpm db:migrate && pnpm db:seed
pnpm ysk add module appointment --prisma --web
pnpm gen:openapi
pnpm dev
```

Thin 包含身分、檔案、通知、工作、郵件、API 金鑰、加密與即時通訊。它不附帶 llm、billing、organizations 或 push 裝置。稍後用 `pnpm ysk add …` 加入。完整複製：`--preset full`。

產品根目錄含有 `.ysk-kit.json`（kit 版本、flavor、preset、資料庫）。稍後在 kit 工作副本執行 `pnpm ysk upgrade` 以更新護欄——見[更新已產生產品的護欄](upgrade.zh.md)。

## 路徑 C — 一個已完成的系統

跟隨一個做完的產品，而不是空白的 `title`／`body` 模組。十個系統見[實例目錄](../../examples/README.zh.md)。套用器會開出 thin 目的地、加入所列模組與能力、複製 overlay、seed 並驗證。診所預約是最短的一條：

```bash
pnpm --filter @ysk/examples start apply clinic-booking --dest ~/Projects/my-clinic --yes
cd ~/Projects/my-clinic
pnpm dev
```

以 `user@ysk.hk`／`ysk-user-dev` 登入，然後開啟 `/appointment`。教程、截圖與預期 envelope：[診所／顧問預約](../../examples/clinic-booking/tutorial.zh.md)。十個系統的目錄：[examples/README.zh.md](../../examples/README.zh.md)。

## 埠已被佔用

預設埠是 API **3001**、web **5173**、admin **5174**。若被其他行程佔用：

1. 改 `.env` 的 `API_PORT`。
2. 讓 `API_PUBLIC_URL`、`WEB_PUBLIC_URL`、`ADMIN_PUBLIC_URL` 與實際監聽的埠一致。
3. 重啟 `pnpm dev`。

Playwright（`pnpm e2e`）預期 3001 與 5173。若改了 web 埠，把 `WEB_PUBLIC_URL` 指過去。

## 可選 Compose 服務

```bash
docker compose up -d redis          # BullMQ + Socket.IO adapter
docker compose up -d jaeger         # traces 介面 http://localhost:16686
docker compose up -d prometheus grafana
```

未設 `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318` 時，Jaeger 不會收到 traces。Grafana：http://localhost:3000（`admin` / `admin`）。Prometheus：http://localhost:9090。

## 下一步閱讀

- [Hexagonal 分層](hexagonal.zh.md) — 程式放哪裏
- [加模組](../recipes/add-module.zh.md)
- [已完成的實例](../../examples/README.zh.md)
- [CLI](../cli/index.zh.md)
- [更新已產生產品的護欄](upgrade.zh.md)
- [部署](deploy.zh.md)
