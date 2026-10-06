---
name: webhook-handling
description: >
  處理 YSK Kit 入站 webhook：在 raw body 上驗簽、盡快確認、以 event id 冪等、亂序事件、重試、重放測試。
  以 Stripe 為主要例子；其他供應商同一套規則。
  新增或修改 /v1/*/webhook、加 billing，或除錯「扣了錢沒開通」／重複履約時使用。
  中文：webhook、驗簽、冪等、Stripe 回調、重送。
  不要用於出站 HTTP，或 diff 沒有 webhook 的泛安全審查。
---

# Skill：webhook 處理

Language: [English](webhook-handling.md) · 中文

入站供應商回調。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。Envelope：[envelope-api](envelope-api.zh.md)。安全：[security-review](security-review.zh.md)。Stripe 是實作例子（`POST /v1/billing/webhook`）；郵件退信、push 回執、partner callback 用同一套規則。

## 觸發

- 新增或修改任何 `/v1/*/webhook`。
- `pnpm ysk-kit add billing`。
- 新的 Stripe 事件類型；「扣了錢沒開通」；重複權益。

不要用於對 Stripe 的出站 SDK 呼叫，或 diff 沒有 webhook 的全倉安全審查（[security-review](security-review.zh.md)）。

## 輸入

| 輸入 | 必要 | 備註 |
|---|---|---|
| 供應商 | 是 | 先 Stripe；其他需要 HMAC／標頭方案 |
| 事件類型 | 是 | billing 最低集合見下表 |
| Raw-body 掛載 | 是 | 在 `express.json()`／Fastify JSON parser 之前 |

## 規則

1. **Raw body。** Express：webhook 路由用 `express.raw({ type: '*/*' })`，而且要在 `app.use(express.json())` **之前**（`apps/api/src/app.ts`）。Fastify：scoped `addContentTypeParser(..., { parseAs: 'buffer' })`（`app-fastify.ts`）。兩個 adapter 都要做。
2. **在該 buffer 上驗簽。** Kit helper：`apps/api/src/modules/billing/infra/stripe-billing.ts` 的 `verifyStripeSignature`（HMAC、時間戳容忍 5 分鐘、`timingSafeEqual`）。簽名錯 → `UNAUTHENTICATED`（經 `AppError` 變成 HTTP 401），永遠不要 200。
3. **盡快確認。** 驗簽 + 持久化 event id 之後，回 `200` `{ ok: true, data: { received: true } }`。不要在請求上 await 慢的履約。改入 `@ysk-kit/jobs` 隊列（測試用 `createMemoryQueue`）。起步程式目前在請求內 await `billingService.activate` — 視為熱點；新工作應該入隊。
4. **冪等。** `ProcessedWebhookEvent` 上 `(provider, eventId)` 唯一（Stripe `event.id`）。先 insert：重複 insert → 回 200 並略過工作。有些 handler 也用 `data.object.id + event.type`。
5. **次序。** Stripe **不保證**次序，而且會重試（live mode 最多 3 日）。不要把事件當成全序套用。狀態依賴次序時，經 billing port 向供應商 API 取最新物件（不要在 application 裡直接用 `sk_`）。
6. **重試／重放。** Handler 必須跑兩次也安全。測試要重放同一份已簽名 payload。
7. **密鑰。** `STRIPE_WEBHOOK_SECRET` 只從 env 讀。應用端 API 優先用 Stripe restricted key `rk_` 而不是 `sk_`。永遠不要 log secret 或完整 payload。

Webhook JSON 仍然用 envelope。因為 raw body，此路由 **不經 ts-rest**（與四個已文件化例外同一家族，但回應仍是 `{ ok, data }`）。不要發明第五個 envelope 例外。

## Stripe 最低事件集

| 事件 | 原因 |
|---|---|
| `checkout.session.completed` | 檢查 `payment_status`；付了才開通 |
| `checkout.session.async_payment_succeeded` | 延遲付款方式（例如部分銀行扣帳） |
| `customer.subscription.updated` | 座位／週期／狀態漂移 |
| `customer.subscription.deleted` | 取消 |
| `invoice.payment_failed` | 逾期；不要忽略 |

起步程式只處理 `checkout.session.completed`。新的 billing 工作必須覆蓋上表，而不是再加一個一次性 `if`。

## 測試（記憶體，不連 Stripe 網絡）

跟隨 `apps/api/src/modules/billing/infra/stripe-billing.test.ts`：固定 secret、HMAC 標頭、`verifyStripeSignature`。

| 案例 | 預期 |
|---|---|
| 簽名錯 | `UNAUTHENTICATED`／401，不履約 |
| 重放同一個 `event.id` | 履約一次，第二次 200 |
| 亂序的 subscription 事件 | 最終狀態跟供應商物件，不跟到達次序 |
| Express **與** Fastify | 同一個 envelope |

不要在 CI 呼叫 Stripe。本機可選：`stripe listen --forward-to localhost:3001/v1/billing/webhook` 然後 `stripe trigger checkout.session.completed`（使用者自己的 sandbox，非必要）。

## 步驟

1. 規劃協議要求時先寫計劃（webhook 已被點名）。
2. 在 Express 與 Fastify 掛 raw-body 路由。
3. 驗簽；持久化 event id；回 200；入隊 job。
4. 在 application 經 ports 履約（`IBillingPort`、org repo）。盡量不要讓 Stripe 型別進入 `application/` — 對應到 DTO／command。
5. 覆蓋事件表與測試矩陣。
6. [驗證改動](verify-change.zh.md)。

## 驗證

```bash
pnpm --filter @ysk-kit/api test
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

預期：`ysk-kit check agent: ok`。簽名單元測試維持綠。

- [ ] 兩個 adapter 都用 raw body
- [ ] 簽名 + 時間戳窗口
- [ ] 以 event id 冪等
- [ ] 非同步確認（若仍同步，文件化為熱點）
- [ ] Stripe 最低事件集（或其他供應商等價集合）
- [ ] 日誌沒有 webhook secret

## 輸出格式

```md
## Webhook — <provider> <path>
Signature: raw body + header <name>
Idempotency: <table/port or "missing — do not ship">
Ack: 200 envelope after persist
Events: <list>
Adapters: Express + Fastify
Tests: bad sig / replay / out-of-order
```

## 完成條件

簽名、冪等、快速 200、事件集，以及兩個 adapter 的 memory-port 測試都在。五條驗證命令全綠。

## 反模式

| 症狀 | 改為 |
|---|---|
| 先 `express.json()` 再對 `req.body` 做 HMAC | 先掛 `express.raw` |
| 簽名錯仍回 200 | `UNAUTHENTICATED` |
| 履約 10 秒才 200 | 入隊；否則 Stripe 會重試 |
| 相信 `event.created` 次序 | 取最新物件 |
| CI 跑 `stripe trigger` | 已簽名的 fixture buffer |
| 只做 Express | Fastify 一併掛 |

## 升級／詢問

在沒有 secret 的情況下暴露新的公開 webhook 路徑之前、在 log payload 之前，或只因為走 HTTPS 就把 partner callback 當成已認證之前，先問。

## 來源

- Stripe Webhooks（重試、不保證次序、盡快 2xx、`event.id`） — <https://docs.stripe.com/webhooks>
- stripe/ai `stripe-best-practices`（webhook 不是可選、`rk_`、非同步付款事件） — <https://github.com/stripe/ai>
- Stripe agent skills — <https://docs.stripe.com/skills>
