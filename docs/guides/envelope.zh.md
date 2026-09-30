# Envelope

Language: [English](envelope.md) · 中文

JSON 路由只回兩種形狀。列表、單一資源與空的成功一律使用 envelope。分頁放在 `data` 內。

```ts
{ ok: true, data: T }
{ ok: false, error: { code, message, details?, requestId? } }
```

`@ysk-kit/contracts` 的輔助：

```ts
export const OkSchema = <T extends z.ZodType>(data: T) =>
  z.object({ ok: z.literal(true), data });

export const ErrSchema = z.object({
  ok: z.literal(false),
  error: ApiErrorBodySchema,
});
```

每條 ts-rest 成功與錯誤回應都應以 `OkSchema` / `ErrSchema` 包裝。`@ysk-kit/sdk` 會解開 `ok: true`，並在 `ok: false` 時丟出錯誤。客戶端不要對 kit 路徑直接 `fetch`。

錯誤 `code` 寫在 contracts（`VALIDATION_FAILED`、`UNAUTHENTICATED`、`FORBIDDEN`、`NOT_FOUND`、`CONFLICT`、`RATE_LIMITED`、`INTERNAL`……）。前端、日誌與監控以 `code` 為鍵，不以翻譯後的 `message` 為鍵。

## 例外

只有這四種傳輸略過 JSON envelope：

| 路徑 | 客戶端看到甚麼 | 原因 |
|---|---|---|
| `POST /v1/llm/stream` | SSE：`event: delta` 然後 `event: done` | 權杖串流不能等一個 JSON body |
| `GET /v1/billing/invoices/:id/pdf` | HTTP 302 到 Stripe `invoice_pdf`（後備 `hosted_invoice_url`） | 瀏覽器下載；kit 不存放 PDF 位元組 |
| `GET /docs` | Scalar HTML | 給人看的 OpenAPI 介面 |
| `GET /openapi.json` | OpenAPI 文件 | 機器發現；呼叫路由仍然經 `@ysk-kit/sdk` |

LLM complete（`POST /v1/llm/complete`）仍用 envelope。發票列表（`GET /v1/billing/invoices`）仍用 envelope。

新路由預設使用 envelope。若傳輸不能是 JSON，把它寫在這四項旁邊，並讓 handler 留在 ts-rest 之外。程序：[envelope-api skill](../skills/envelope-api.zh.md)。
