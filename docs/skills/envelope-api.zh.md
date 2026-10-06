---
name: envelope-api
description: >
  除非屬於四個例外之一，YSK Kit JSON 路由維持 { ok, data } / { ok, error }。
  加路由、SSE、PDF、錯誤形狀或 /envelope-api 時使用。
  中文：envelope、錯誤碼、AppError、webhook JSON。
  不要用於另發明一套錯誤 JSON，或未經詢問就加第五個 envelope 例外。
---

# Skill：envelope API

Language: [English](envelope-api.md) · 中文

新的 HTTP 行為必須維持 envelope，除非屬於四個例外之一。指南：[envelope](../guides/envelope.zh.md)。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。若協議要求計劃，先完成 [plan-feature](plan-feature.zh.md)。

## 觸發

- 新增或改動 HTTP 路由、狀態碼或錯誤本文。
- SSE、PDF 下載、OpenAPI UI，或任何非 JSON 傳輸。

## 輸入

| 輸入 | 必要 | 備註 |
|---|---|---|
| 路徑 + 方法 | 是 | 其後從 `GET /openapi.json` 發現 |
| JSON 與否 | 是 | 非 JSON 必須屬於四個例外之一 |
| Error codes | 是 | 重用既有代碼 |

## 步驟

1. 先在 `@ysk-kit/contracts` 加 DTO + command。回應以 `OkSchema`／`ErrSchema` 包裝。
2. 經 `throw new AppError('<CODE>')`（`@ysk-kit/domain-kernel`）使用既有 error code。預設訊息是 `ERROR_MESSAGE[code]['zh-HK']`。HTTP 狀態來自同一檔的 `HTTP_STATUS`。不要另發明一套錯誤 JSON。

### 錯誤碼決策

| Code | HTTP | 何時用 |
|---|---|---|
| `VALIDATION_FAILED` | 422 | Zod 失敗；command 形狀不對 |
| `UNAUTHENTICATED` | 401 | 沒有 session／壞 API key／壞 webhook 簽名 |
| `FORBIDDEN` | 403 | 已認證但角色不對，或不是成員 |
| `NOT_FOUND` | 404 | 列不存在，**或**對另一租戶隱藏存在 |
| `CONFLICT` | 409 | 重複／非法狀態轉換 |
| `RATE_LIMITED` | 429 | IP 限制器或 `LLM_QUOTA_*` |
| `INTERNAL` | 500（或傳 `status`，例如 503 LLM 未設定） | 意外錯誤；不要洩漏內部細節 |

**新** code 需要 `codes.ts` + `ERROR_MESSAGE`（`zh-HK` **與** `en`）+ `HTTP_STATUS`。兩個 locale 必須同步。

3. 若傳輸是 JSON，它就是 envelope 路由——包括單一資源。
4. 若傳輸不能是 JSON，必須屬於：LLM SSE、發票 PDF 302、`GET /docs`、`GET /openapi.json`。任何新例外都寫在這四項旁邊，留在 ts-rest 之外，而且**先問使用者**。
5. **Webhook 風格 JSON（不經 ts-rest，仍是 envelope）。** Stripe `POST /v1/billing/webhook` 回 `{ ok: true, data: { received: true } }`，但要在 JSON parser **之前**掛 `express.raw`／Fastify `parseAs: 'buffer'`，讓 HMAC 看到原始 bytes。就*路由*而言與四個例外同一家族，回應形狀仍是 envelope。跟隨 [webhook-handling](webhook-handling.zh.md)。不要把這些放上 ts-rest。
6. 客戶端呼叫 `@ysk-kit/sdk`。從 `GET /openapi.json` 發現路徑；不要 `fetch`。
7. [驗證改動](verify-change.zh.md)。

## 驗證

- [ ] JSON 夾具顯示 `{ ok: true, data }`／`{ ok: false, error }`
- [ ] `error.code` 對得上表；`ERROR_MESSAGE` 有 `zh-HK` 與 `en`
- [ ] 沒有未經使用者批准且未寫進文件的新例外
- [ ] Webhook 路由維持 envelope + raw-body，不經 ts-rest
- [ ] 客戶端使用 SDK

## 輸出格式

```md
## Envelope — <method> <path>
Transport: JSON envelope | SSE | PDF 302 | docs | openapi.json
Error codes: CODE → HTTP
AppError: thrown in application/ | n/a
Webhook raw-body: yes | n/a
```

## 完成條件

路由與合約一致，OpenAPI（或已文件化的例外）已更新，error code 兩個 locale 都有，且 [驗證改動](verify-change.zh.md) 全綠。

## 反模式

| 症狀 | 改為 |
|---|---|
| `{ success: true, payload }` | `{ ok, data }`／`{ ok, error }` |
| `res.status(401).json({ message })` | `throw new AppError('UNAUTHENTICATED')` |
| `ERROR_MESSAGE` 只有英文 | 同一 PR 加 `zh-HK` |
| Stripe webhook 用 ts-rest handler | raw-body 掛載，envelope ack |

## 升級／詢問

第五個 envelope 例外之前，或不在上表的新 error code 之前，先問。
