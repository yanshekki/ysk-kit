# Review error logs

Language: [中文](review-error-logs.zh.md) · English

How to capture kit JSON logs, run `ysk-kit check logs`, and turn an INTERNAL into a red test. Law: [AGENTS.md](../../AGENTS.md). Skill: [error-log-review](../skills/error-log-review.md). Guide: [observability](../guides/observability.md).

## Capture production-format JSON

Pretty logs in development are for humans. The log contract is **JSON lines** (`NODE_ENV=production` or a destination stream in tests).

```bash
NODE_ENV=production pnpm --filter @ysk-kit/api start > /tmp/api.jsonl 2>&1
# reproduce the failure, then:
pnpm ysk-kit check logs --file /tmp/api.jsonl
```

Pipe stdin instead of `--file` when the capture is already on stdout.

## What a good ERROR line looks like

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

The HTTP body is still `{ ok: false, error: { code, message, requestId } }` with **no** stack. Fastify access lines may use `reqId` instead of `requestId`.

Key off `code`, not a translated `message`. Same `requestId` in the envelope, the ERROR log, and (when OTel is on) `trace_id`.

## Expected 4xx

`AppError('NOT_FOUND')` and Zod 422 do **not** emit `logger.error`. The access log still has status. If you need a 4xx spike, query access lines or metrics — do not raise them to ERROR.

## From log to test

1. Copy one `requestId`.
2. Reproduce with `createApp(createMemoryInput())` **and** `createFastifyApp(createMemoryInput())`.
3. Assert `res.body.error.code` and `res.body.error.requestId`.
4. Map the failure to `throw new AppError('<CODE>')` in `application/`.
5. Re-run `pnpm ysk-kit check errors`.

Do not add a Prisma `ErrorLog` or an admin inbox. Audit logs are domain events (`GET /v1/audit-logs`), not stacks.
