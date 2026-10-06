---
name: envelope-api
description: >
  除非屬於四個例外之一，YSK Kit JSON 路由維持 { ok, data } / { ok, error }。
  加路由、SSE、PDF、錯誤形狀或 /envelope-api 時使用。
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
2. 使用既有 error code。不要另發明一套錯誤 JSON。
3. 若傳輸是 JSON，它就是 envelope 路由——包括單一資源。
4. 若傳輸不能是 JSON，必須屬於：LLM SSE、發票 PDF 302、`GET /docs`、`GET /openapi.json`。任何新例外都寫在這四項旁邊，留在 ts-rest 之外，而且**先問使用者**。
5. 入站 webhook 仍走 envelope（`{ ok: true, data: { received: true } }`），但要在 JSON parser 之前掛 raw body。跟隨 [webhook-handling](webhook-handling.zh.md)。
6. 客戶端呼叫 `@ysk-kit/sdk`。從 `GET /openapi.json` 發現路徑；不要 `fetch`。
7. [驗證改動](verify-change.zh.md)。

## 驗證

- [ ] JSON 夾具顯示 `{ ok: true, data }`／`{ ok: false, error }`
- [ ] 沒有未經使用者批准且未寫進文件的新例外
- [ ] 客戶端使用 SDK

## 完成條件

路由與合約一致，OpenAPI（或已文件化的例外）已更新，且 [驗證改動](verify-change.zh.md) 全綠。
