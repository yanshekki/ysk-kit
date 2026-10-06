---
name: new-product
description: >
  用 create-ysk-app 從 YSK Kit 產生產品（flavor、preset、資料庫）。
  使用者要開新產品、create-ysk-app 或 /new-product 時使用。
---

# Skill：開新產品

Language: [English](new-product.md) · 中文

從 YSK Kit 產生一個產品。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。手冊：[create-ysk-app](../cli/create-ysk-app.zh.md)。入門：[getting started](../guides/getting-started.zh.md)。

## 觸發

- 使用者要的是新產品倉，不是在本 kit 加模組。
- 使用者說 `create-ysk-app`、`pnpm create @ysk-kit/app`、`npm create @ysk-kit/app` 或「新 SaaS」。

不要另起一套 monorepo 佈局。不要人手複製本 kit。不要把行業 domain 寫回本 kit。

## 輸入

| 輸入 | 必要 | 預設 |
|---|---|---|
| 產品名稱 | 是 | — |
| `--flavor` | 否 | `saas` |
| `--preset` | 否 | `thin` |
| `--db` | 否 | `mysql` |
| `--yes` | agent：是 | 略過 TTY 提問 |

Agent 請傳旗標，不要等 TTY 提問。

## 步驟

1. 選擇 flavor、資料庫與 preset。預設是 `--preset thin --db mysql --flavor saas`。
2. 執行：

```bash
pnpm create @ysk-kit/app <name> --preset thin --db mysql --flavor saas
# 或：npm create @ysk-kit/app <name> --preset thin --db mysql --flavor saas
```

npm 上沒有無 scope 的 `create-ysk-app` 套件。從 kit checkout：`pnpm --filter @ysk-kit/create-app start <name> --preset thin --db mysql --flavor saas`。

3. 在新目錄：`pnpm install`，把 `.env.example` 複製為 `.env`，若資料庫是 MySQL 或 PostgreSQL 就啟動 Compose。
4. `pnpm db:generate && pnpm db:migrate && pnpm db:seed`。
5. 確認 agent 指針存在（`AGENTS.md`、`.agents/skills/`、`docs/plans/_template.md`、`.github/copilot-instructions.md`、`.gemini/settings.json`）。
6. 用 [加模組](add-module.zh.md) 加入第一個業務資源。若 [plan-feature](plan-feature.zh.md) 要求計劃，先寫計劃。
7. `pnpm gen:openapi`，然後 `pnpm dev`。
8. 以 `admin@ysk.hk` / `ysk-admin-dev` 登入。

`php-bridge` 與 `static-web3` 略過 migrate／seed；改跟產生出來的 README。其後以 [升級](../guides/upgrade.zh.md) 更新 kit 護欄。

十個已完成的產品系統在 [`examples/`](../../examples/README.zh.md)。用 `pnpm --filter @ysk-kit/examples start apply <slug> --yes` 套用。

## 驗證

- [ ] `.ysk-kit.json` 記錄 flavor、preset、db 與 kit 版本
- [ ] 工作區產品存在 `AGENTS.md` 與 `.agents/skills/add-module/SKILL.md`
- [ ] 有 API 的 flavor 可用種子帳戶登入

## 完成條件

產品目錄可安裝，護欄檔已在，而且（若有要求）第一個資源跟隨 [加模組](add-module.zh.md)。
