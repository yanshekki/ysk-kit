# Skill：開新產品

Language: [English](new-product.md) · 中文

從 YSK Kit 產生一個產品。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。手冊：[create-ysk-app](../cli/create-ysk-app.zh.md)。入門：[getting started](../guides/getting-started.zh.md)。

## 步驟

1. 選擇 flavor、資料庫與 preset。預設是 `--preset thin --db mysql --flavor saas`。Agent 請傳那些旗標，不要等 TTY 提問。
2. 執行：

```bash
pnpm --filter @ysk-kit/create-app start <name> --preset thin --db mysql --flavor saas
```

3. 在新目錄：`pnpm install`，把 `.env.example` 複製為 `.env`，若資料庫是 MySQL 或 PostgreSQL 就啟動 Compose。
4. `pnpm db:generate && pnpm db:migrate && pnpm db:seed`。
5. 用 [加模組](add-module.zh.md) 加入第一個業務資源。
6. `pnpm gen:openapi`，然後 `pnpm dev`。
7. 以 `admin@ysk.hk` / `ysk-admin-dev` 登入。

不要另起一套 monorepo 佈局。不要人手複製本 kit。`php-bridge` 與 `static-web3` 略過 migrate／seed；改跟產生出來的 README。其後以 [升級](../guides/upgrade.zh.md) 更新 kit 護欄。

十個已完成的產品系統在 [`examples/`](../../examples/README.zh.md)。用 `pnpm --filter @ysk-kit/examples start apply <slug> --yes` 套用，不要在 living kit 上發明行業模組。
