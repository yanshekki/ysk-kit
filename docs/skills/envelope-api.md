# Skill: envelope API

Language: [中文](envelope-api.zh.md) · English

New HTTP behaviour must keep the envelope unless it is one of the four exceptions. Guide: [envelope](../guides/envelope.md). Law: [AGENTS.md](../../AGENTS.md).

## Steps

1. Add DTO + command in `@ysk-kit/contracts` first. Wrap responses with `OkSchema` / `ErrSchema`.
2. Use existing error codes. Do not invent a parallel error JSON.
3. If the transport is JSON, it is an envelope route — including single resources.
4. If the transport cannot be JSON, it must be one of: LLM SSE, invoice PDF 302, `GET /docs`, `GET /openapi.json`. Document any new exception next to those four and keep it off ts-rest.
5. Clients call `@ysk-kit/sdk`. Discover paths from `GET /openapi.json`; do not `fetch`.
6. [verify-change](verify-change.md).
