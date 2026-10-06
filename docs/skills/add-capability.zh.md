---
name: add-capability
description: >
  用 ysk-kit add 合併已編目的 YSK Kit 能力（llm、team、billing、push、jobs、mail 等）。
  使用者要 ysk-kit add llm/team/billing/push、還原 thin 能力或 /add-capability 時使用。
  中文：加能力、llm、billing、push、doctor。
  不要用於在目錄以外發明能力，或加入行業 domain。
---

# Skill：加能力

Language: [English](add-capability.md) · 中文

合併一項已編目的平台功能。跟隨 [docs/recipes/add-capability.zh.md](../recipes/add-capability.zh.md)。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。目錄：[能力](../guides/capabilities.zh.md)。若協議要求計劃，先完成 [plan-feature](plan-feature.zh.md)。

## 觸發

- 在 thin 產品還原 llm／team／billing／push。
- 合併其他目錄名稱（`auth`、`jobs`、`mail` 等）。
- 使用者說 `ysk-kit add <name>` 或「把 billing 加回來」。

不要在目錄以外發明新的能力資料夾。不要用這條路加入行業 domain。

## 輸入

| 輸入 | 必要 | 備註 |
|---|---|---|
| 目錄名稱 | 是 | `auth`、`rbac`、`audit-log`、`storage`、`i18n`、`jobs`、`mail`、`notifications`、`llm`、`websocket`、`push`、`mobile`、`team`、`apikey`、`crypto`、`billing`。別名 `org` → `team` |
| `billing` 之前先有 `team` | 名稱是 `billing` 時 | `schema.prisma` 沒有 `model Organization` 會丟錯 |

## 步驟

1. 確認名稱在目錄內。
2. 若名稱是 `billing`，先執行 `pnpm ysk-kit add team`。
3. `pnpm ysk-kit add <name>`。
4. Prisma 有變就跟隨 [db-migration](db-migration.zh.md)，然後 `pnpm db:migrate`。
5. 從 `.env.example` 填環境變數（不要提交密鑰）。
6. 上線前先做該能力的一行項目（下表），然後 `pnpm ysk-kit doctor`。
7. [驗證改動](verify-change.zh.md)。

## 上線前（各一行）

| 能力 | 上線前 |
|---|---|
| `billing` | [webhook-handling](webhook-handling.zh.md)：webhook secret、raw-body 驗簽、`ProcessedWebhookEvent` 冪等。維持 `requireBiller`。 |
| `llm` | [llm-feature](llm-feature.zh.md)：伺服器持有的 `LLM_SYSTEM_PROMPT`、配額、`createFakeLlm` evals。 |
| `push` | env 用真實 FCM／Expo 憑證（不是例子佔位）；裝置維持 user-scoped。 |
| `apikey` | 每個 key 都有 scope；以撤銷 + 新發輪換（`ysk_live_…`）；永遠不要 log secret。 |
| `team` | 在 `application/` 查 membership（[security-review](security-review.zh.md)）。 |
| 其他目錄名稱 | 仍然要跑 `pnpm ysk-kit doctor` |

`app.ts` 或 `composition.ts` 已有 skip token 時，第二次加 `llm`／`team`／`billing`／`push` 是 no-op。

## 驗證

```bash
pnpm ysk-kit doctor
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

- [ ] 所要求的服務只接一次（沒有重複的 `register*Routes`）
- [ ] `.env.example` 有環境鍵；密鑰不進 git
- [ ] 該能力的上線前一行已完成，或已列給人去做

## 輸出格式

```md
## Add capability — <name>
Order: team before billing | n/a
Doctor: ok | FAIL
Before production: <one-liner status>
Adapters: Express + Fastify | n/a
```

## 完成條件

capability 已掛上 Express 與 Fastify（產品有 API 時），Prisma fragments 已合併，模板有提供的 SDK／web-sdk 補丁已在，`doctor` 不是紅色，上述五條命令全綠。

## 反模式

| 症狀 | 改為 |
|---|---|
| 沒有 Organization 就 `ysk-kit add billing` | 先 `add team` |
| 發明 `ysk-kit add salon` | 只用目錄名稱 |
| 因為「稍後才接 Stripe」而略過 webhook skill | 沒有 [webhook-handling](webhook-handling.zh.md) 就不要出貨 billing |

## 升級／詢問

目錄以外的名稱之前，或生產憑證之前，先問。
