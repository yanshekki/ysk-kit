# Envelope

Language: [中文](envelope.zh.md) · English

JSON routes return one of two shapes. Lists, single resources, and empty successes all use the envelope. Pagination sits inside `data`.

```ts
{ ok: true, data: T }
{ ok: false, error: { code, message, details?, requestId? } }
```

Helpers in `@ysk/contracts`:

```ts
export const OkSchema = <T extends z.ZodType>(data: T) =>
  z.object({ ok: z.literal(true), data });

export const ErrSchema = z.object({
  ok: z.literal(false),
  error: ApiErrorBodySchema,
});
```

Every ts-rest success and error response should wrap with `OkSchema` / `ErrSchema`. `@ysk/sdk` unwraps `ok: true` and throws on `ok: false`. Do not `fetch` kit paths from a client.

Error `code` values live in contracts (`VALIDATION_FAILED`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL`, …). Frontends, logs, and metrics key off `code`, not a translated `message`.

## Exceptions

Only these four transports skip the JSON envelope:

| Path | What the client sees | Why |
|---|---|---|
| `POST /v1/llm/stream` | SSE: `event: delta` then `event: done` | Token stream cannot wait for one JSON body |
| `GET /v1/billing/invoices/:id/pdf` | HTTP 302 to Stripe `invoice_pdf` (fallback `hosted_invoice_url`) | Browser download; no PDF bytes stored in the kit |
| `GET /docs` | Scalar HTML | Human OpenAPI UI |
| `GET /openapi.json` | OpenAPI document | Machine discovery; still call routes through `@ysk/sdk` |

LLM complete (`POST /v1/llm/complete`) stays in the envelope. Invoice list (`GET /v1/billing/invoices`) stays in the envelope.

New routes default to the envelope. If a transport cannot be JSON, document it next to these four and keep the handler off ts-rest. Procedure: [envelope-api skill](../skills/envelope-api.md).
