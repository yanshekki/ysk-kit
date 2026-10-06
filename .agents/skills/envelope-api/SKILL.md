---
name: envelope-api
description: >
  Keep YSK Kit JSON routes on { ok, data } / { ok, error } unless the change is one of the four exceptions.
  Use when adding a route, SSE, PDF, error shape, or /envelope-api.
  中文：envelope、錯誤碼、AppError、webhook JSON。
  Do not use to invent a parallel error JSON or a fifth envelope exception without asking.
---

Read `docs/skills/envelope-api.md`. Law: `AGENTS.md`.

1. DTO + OkSchema/ErrSchema first. `throw new AppError('<CODE>')`.
2. JSON stays envelope. Exceptions: LLM SSE, invoice PDF 302, GET /docs, GET /openapi.json.
3. Webhooks: still envelope, raw body, off ts-rest. Sync ERROR_MESSAGE zh-HK and en.
Gotcha: ask before a fifth exception. New codes need HTTP_STATUS too.
Verify: fixtures show `{ ok, data }` / `{ ok, error }`.
Full steps: `docs/skills/envelope-api.md`.
