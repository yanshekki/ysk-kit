---
name: envelope-api
description: >
  Keep YSK Kit JSON routes on { ok, data } / { ok, error } unless the change is one of the four exceptions.
  Use when adding a route, SSE, PDF, error shape, or /envelope-api.
  中文：envelope、錯誤碼、AppError、webhook JSON。
  Do not use to invent a parallel error JSON or a fifth envelope exception without asking.
---

# Skill: envelope API

Language: [中文](envelope-api.zh.md) · English

New HTTP behaviour must keep the envelope unless it is one of the four exceptions. Guide: [envelope](../guides/envelope.md). Law: [AGENTS.md](../../AGENTS.md). If the protocol requires a plan, finish [plan-feature](plan-feature.md) first.

## Trigger

- New or changed HTTP route, status code, or error body.
- SSE, PDF download, OpenAPI UI, or any non-JSON transport.

## Inputs

| Input | Required | Notes |
|---|---|---|
| Path + method | yes | Discover later from `GET /openapi.json` |
| JSON vs non-JSON | yes | Non-JSON must be one of the four exceptions |
| Error codes | yes | Reuse existing codes |

## Steps

1. Add DTO + command in `@ysk-kit/contracts` first. Wrap responses with `OkSchema` / `ErrSchema`.
2. Use existing error codes via `throw new AppError('<CODE>')` (`@ysk-kit/domain-kernel`). Default message is `ERROR_MESSAGE[code]['zh-HK']`. HTTP status comes from `HTTP_STATUS` in the same file. Do not invent a parallel error JSON.

### Error-code decision

| Code | HTTP | When to use |
|---|---|---|
| `VALIDATION_FAILED` | 422 | Zod failed; malformed command |
| `UNAUTHENTICATED` | 401 | No session / bad API key / bad webhook signature |
| `FORBIDDEN` | 403 | Authenticated but wrong role or not a member |
| `NOT_FOUND` | 404 | Missing row **or** hide existence from another tenant |
| `CONFLICT` | 409 | Duplicate / illegal state transition |
| `RATE_LIMITED` | 429 | IP limiter or `LLM_QUOTA_*` |
| `INTERNAL` | 500 (or pass `status`, e.g. 503 LLM unconfigured) | Unexpected; do not leak internals |

A **new** code needs `codes.ts` + `ERROR_MESSAGE` (`zh-HK` **and** `en`) + `HTTP_STATUS`. Keep the two locales in lockstep.

3. If the transport is JSON, it is an envelope route — including single resources.
4. If the transport cannot be JSON, it must be one of: LLM SSE, invoice PDF 302, `GET /docs`, `GET /openapi.json`. Document any new exception next to those four, keep it off ts-rest, and **ask the user** before adding it.
5. **Webhook-style JSON (off ts-rest, still envelope).** Stripe `POST /v1/billing/webhook` returns `{ ok: true, data: { received: true } }` but mounts `express.raw` / Fastify `parseAs: 'buffer'` **before** JSON parsers so HMAC sees the bytes. Same family as the four exceptions for *routing*, not for the response shape. Follow [webhook-handling](webhook-handling.md). Do not put these on ts-rest.
6. Clients call `@ysk-kit/sdk`. Discover paths from `GET /openapi.json`; do not `fetch`.
7. [verify-change](verify-change.md).

## Verification

- [ ] JSON fixtures show `{ ok: true, data }` / `{ ok: false, error }`
- [ ] `error.code` matches the table; `ERROR_MESSAGE` has `zh-HK` and `en`
- [ ] No new exception exists unless the user approved it and docs list it
- [ ] Webhook routes stay envelope + raw-body, off ts-rest
- [ ] Clients use the SDK

## Output format

```md
## Envelope — <method> <path>
Transport: JSON envelope | SSE | PDF 302 | docs | openapi.json
Error codes: CODE → HTTP
AppError: thrown in application/ | n/a
Webhook raw-body: yes | n/a
```

## Done criteria

The route matches the contract, OpenAPI (or the documented exception) is updated, error codes have both locales, and [verify-change](verify-change.md) is green.

## Anti-patterns

| Symptom | Do this instead |
|---|---|
| `{ success: true, payload }` | `{ ok, data }` / `{ ok, error }` |
| `res.status(401).json({ message })` | `throw new AppError('UNAUTHENTICATED')` |
| English-only `ERROR_MESSAGE` | Add `zh-HK` in the same PR |
| ts-rest handler for Stripe webhook | Raw-body mount, envelope ack |

## Escalate / ask

Ask before a fifth envelope exception or a new error code that is not in the table.
