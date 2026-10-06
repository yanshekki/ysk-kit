---
name: new-product
description: >
  用 create-ysk-app 從 YSK Kit 產生產品（flavor、preset、資料庫）。
  使用者要開新產品、create-ysk-app 或 /new-product 時使用。
  中文：開新產品、create-ysk-app、flavor、doctor。
  不要用於在本 kit 加模組（add-module），或另起一套平行 monorepo。
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

## Flavor 提示

| 需要 | Flavor |
|---|---|
| 公開 web + API，可選 admin／mobile | `saas`（預設） |
| Electron 對 API | `desktop` |
| 機器客戶端 + 營運控制台 | `gateway` |
| 只做 PHP／TS envelope 客戶端 | `php-bridge` |
| API + web，產品自有市場數據 | `trading` |
| Vite web，沒有 Prisma | `static-web3` |

見 [flavors](../guides/flavors.zh.md)。Agent 傳 `--flavor`／`--preset`／`--db`；不要等 TTY。

## 步驟

1. 用上表選擇 flavor、資料庫與 preset。預設是 `--preset thin --db mysql --flavor saas`。
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
9. `pnpm ysk-kit doctor`（需要機器報告時再跑 `pnpm ysk-kit doctor --json`）。`error` 檢查會 exit 1。

`php-bridge` 與 `static-web3` 略過 migrate／seed；改跟產生出來的 README。其後以 [升級](../guides/upgrade.zh.md) 更新 kit 護欄。

## 須由人填的欄位

起步程式會留下佔位。上線前必須由人設定（agent 不可發明密鑰）：

| 欄位 | 位置 | 備註 |
|---|---|---|
| `JWT_SECRET`、`DATABASE_URL` | `.env`（從 `.env.example`） | 有 API 的產品缺這些時 `doctor` 報 error |
| `CRYPTO_MASTER_KEY` | `.env` | 生產用 64 hex 字元 |
| Stripe／webhook 密鑰 | `.env` | 只在開了 billing 時 — 然後 [webhook-handling](webhook-handling.zh.md) |
| `LLM_API_KEY`／`XAI_API_KEY`、`LLM_SYSTEM_PROMPT` | `.env` | 只在開了 llm 時 — 然後 [llm-feature](llm-feature.zh.md) |
| Push 憑證 | `.env` | FCM／Expo — 只在開了 push 時 |
| EAS `projectId` | `apps/mobile/app.config.ts` 的 `extra.eas.projectId`（起步是 `replace-me`）與 `apps/mobile/eas.json` submit | `eas build`／submit 需要 |
| iOS `bundleIdentifier`／Android `package` | `app.config.ts` | 起步 `hk.ysk.kit` — 每個產品要改 |

十個已完成的產品系統在 [`examples/`](../../examples/README.zh.md)。用 `pnpm --filter @ysk-kit/examples start apply <slug> --yes` 套用。

## 驗證

```bash
pnpm ysk-kit doctor
```

預期：exit 0（只有 `ok`／`warn`）。`error` 代表 env、engines、migrations 或護欄。

- [ ] `.ysk-kit.json` 記錄 flavor、preset、db 與 kit 版本
- [ ] 工作區產品存在 `AGENTS.md` 與 `.agents/skills/add-module/SKILL.md`
- [ ] 有 API 的 flavor 可用種子帳戶登入
- [ ] 須由人填的欄位已列給擁有者（不是由 agent 發明）

## 輸出格式

```md
## New product — <name>
Flavor / preset / db: …
Doctor: ok | FAIL (<check>)
Human still to fill: JWT_SECRET | eas projectId | …
First resource: add-module <kebab> | none
```

## 完成條件

產品目錄可安裝，`doctor` 不是紅色，護欄檔已在，而且（若有要求）第一個資源跟隨 [加模組](add-module.zh.md)。

## 反模式

| 症狀 | 改為 |
|---|---|
| 人手複製本 kit | `pnpm create @ysk-kit/app` |
| 等 TTY 提問 | 傳 `--yes` 與旗標 |
| 發明 `eas.json` 的 projectId | 留下 `replace-me`；告訴人去填 |
| 把 salon／trading domain 寫回本 kit | 在 dest 產品工作 |

## 升級／詢問

flavor／db／preset 缺失且會改變切片時，問一次。生產密鑰或商店識別碼之前，先問。
