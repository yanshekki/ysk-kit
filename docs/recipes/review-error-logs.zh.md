# 複盤錯誤日誌

Language: [English](review-error-logs.md) · 中文

如何捕捉 kit JSON 日誌、跑 `ysk-kit check logs`，以及把 INTERNAL 變成紅燈測試。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。Skill：[error-log-review](../skills/error-log-review.zh.md)。指南：[觀測](../guides/observability.zh.md)。

## 捕捉生產格式 JSON

開發環境的 pretty log 是給人看的。日誌合約是 **JSON 行**（`NODE_ENV=production` 或測試裏的 destination stream）。

```bash
NODE_ENV=production pnpm --filter @ysk-kit/api start > /tmp/api.jsonl 2>&1
# 重現失敗，然後：
pnpm ysk-kit check logs --file /tmp/api.jsonl
```

已在 stdout 的 capture 可以改用 stdin，不必 `--file`。

## 一條好的 ERROR 行長這樣

```json
{
  "level": 50,
  "requestId": "0f1c2a3b-…",
  "code": "INTERNAL",
  "status": 500,
  "err": { "type": "Error", "message": "…", "stack": "…" },
  "msg": "request failed"
}
```

HTTP 本文仍是 `{ ok: false, error: { code, message, requestId } }`，**沒有** stack。Fastify access line 可能用 `reqId` 而不是 `requestId`。

用 `code` 當鍵，不要用翻譯過的 `message`。同一個 `requestId` 出現在 envelope、ERROR log，以及（開啟 OTel 時）`trace_id`。

## 預期 4xx

`AppError('NOT_FOUND')` 與 Zod 422 **不會**發出 `logger.error`。Access log 仍有 status。若要看 4xx 驟升，查 access line 或指標 — 不要把它們升成 ERROR。

## 從日誌到測試

1. 複製一個 `requestId`。
2. 用 `createApp(createMemoryInput())` **與** `createFastifyApp(createMemoryInput())` 重現。
3. 斷言 `res.body.error.code` 與 `res.body.error.requestId`。
4. 在 `application/` map 成 `throw new AppError('<CODE>')`。
5. 再跑 `pnpm ysk-kit check errors`。

不要加 Prisma `ErrorLog` 或 admin 收件箱。Audit log 是領域事件（`GET /v1/audit-logs`），不是 stack。
