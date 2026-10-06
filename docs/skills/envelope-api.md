---
name: envelope-api
description: >
  Keep YSK Kit JSON routes on { ok, data } / { ok, error } unless the change is one of the four exceptions.
  Use when adding a route, SSE, PDF, error shape, or /envelope-api.
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
2. Use existing error codes. Do not invent a parallel error JSON.
3. If the transport is JSON, it is an envelope route — including single resources.
4. If the transport cannot be JSON, it must be one of: LLM SSE, invoice PDF 302, `GET /docs`, `GET /openapi.json`. Document any new exception next to those four, keep it off ts-rest, and **ask the user** before adding it.
5. Inbound webhooks stay on the envelope (`{ ok: true, data: { received: true } }`) but mount on the raw body before JSON parsers. Follow [webhook-handling](webhook-handling.md).
6. Clients call `@ysk-kit/sdk`. Discover paths from `GET /openapi.json`; do not `fetch`.
7. [verify-change](verify-change.md).

## Verification

- [ ] JSON fixtures show `{ ok: true, data }` / `{ ok: false, error }`
- [ ] No new exception exists unless the user approved it and docs list it
- [ ] Clients use the SDK

## Done criteria

The route matches the contract, OpenAPI (or the documented exception) is updated, and [verify-change](verify-change.md) is green.
