# Skill：envelope API

Language: [English](envelope-api.md) · 中文

新的 HTTP 行為必須維持 envelope，除非屬於四個例外之一。指南：[envelope](../guides/envelope.zh.md)。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。

## 步驟

1. 先在 `@ysk/contracts` 加 DTO + command。回應以 `OkSchema` / `ErrSchema` 包裝。
2. 使用既有 error code。不要另發明一套錯誤 JSON。
3. 若傳輸是 JSON，它就是 envelope 路由——包括單一資源。
4. 若傳輸不能是 JSON，必須屬於：LLM SSE、發票 PDF 302、`GET /docs`、`GET /openapi.json`。任何新例外都寫在這四項旁邊，並留在 ts-rest 之外。
5. 客戶端呼叫 `@ysk/sdk`。從 `GET /openapi.json` 發現路徑；不要 `fetch`。
6. [驗證改動](verify-change.zh.md)。
