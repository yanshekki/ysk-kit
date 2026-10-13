# PHP OpenAPI client

Language: [中文](php-openapi-client.zh.md) · English

Call an existing Kit API from PHP (or another HTTP client) through **OpenAPI + the JSON envelope**. Do not copy `apps/api`, Prisma, or `application/`. Decision: [ADR 0002](../adr/0002-polyglot-clients.md). Flavor table: [Client language choice](../guides/flavors.md#client-language-choice). Envelope: [envelope guide](../guides/envelope.md).

Kit TypeScript apps still use `@ysk-kit/sdk`. This recipe is for a **non-TypeScript caller** pointed at `API_PUBLIC_URL`.

## What you generate

From a kit checkout (or any product that already runs the API):

```bash
# 1. Catalogue — discover paths here, not by guessing
pnpm gen:openapi
# writes docs/openapi.yaml  (also GET /openapi.json on a running API)

# 2. PHP + TypeScript envelope-aware clients. No Node apps, no Prisma.
pnpm --filter @ysk-kit/create-app start my-php-client --flavor php-bridge --yes
```

`php-bridge` ignores `--preset` and `--db`. It emits:

| Path | Role |
|---|---|
| `docs/openapi.yaml` (copied from the kit at scaffold time) | Machine catalogue. Refresh from the **running API** (`GET /openapi.json`) when routes change |
| `php/src/YskClient.php` | Envelope-aware PHP client (`health`, `login`, generic `request`) |
| `ts/src/client.ts` | Same unwrap in TypeScript (`unwrapEnvelope`) |
| bilingual README | How to point `baseUrl` at the API |

Typed kit clients (`@ysk-kit/sdk` / `@ysk-kit/web-sdk`) stay in TypeScript products. PHP does not import them.

## What you must not copy

| Do not | Why |
|---|---|
| Copy `apps/api/src/modules/*/application/` into PHP | Rules would drift; `pnpm layers` cannot see a second domain |
| Copy Prisma schema / `@prisma/client` / `generated/prisma` | The database is an adapter behind the API |
| `file_get_contents` / Guzzle against kit paths **without** unwrapping `{ ok, data }` / `{ ok, error }` | Same bug as TypeScript `fetch('/v1/…')` |
| Re-implement tenancy, billing, or membership in PHP | Those stay in Node `application/` |
| Add FastAPI, Axum, Tauri, or Flutter “so PHP has a sibling” | Deferred per ADR 0002 |

## Point the client at the API

Run the living kit (or a generated product) so `http://localhost:3001` serves JSON. Then:

```php
<?php
require __DIR__ . '/src/YskClient.php';

$client = new Ysk\YskClient('http://localhost:3001');
$tokens = $client->login('admin@ysk.hk', 'ysk-admin-dev');
$authed = new Ysk\YskClient(
    'http://localhost:3001',
    $tokens->accessToken ?? $tokens['accessToken'],
);

$me = $authed->request('GET', '/v1/me');
```

`YskClient::request` already:

1. Sends `Accept: application/json` and `x-ysk-platform`.
2. Adds `Authorization: Bearer …` when a token is set.
3. Returns `data` when `ok === true`.
4. Throws `YskApiError` with `error.code` when `ok === false`.

Do not wrap the result in a second envelope. Do not log the password, OTP, or access token.

## Discover the rest of the catalogue

Named helpers on the scaffold cover `GET /health` and `POST /v1/auth/login` only. Remaining paths use generic `request()` **after** you read OpenAPI:

```bash
curl -s http://localhost:3001/openapi.json | jq '.paths | keys'
```

Examples (still envelope JSON except the four documented exceptions):

```php
$page = $authed->request('GET', '/v1/notifications?limit=20');
$created = $authed->request('POST', '/v1/files', [
    'fileName' => 'report.pdf',
    'contentType' => 'application/pdf',
    'byteSize' => 1024,
]);
```

SSE (`POST /v1/llm/stream`), invoice PDF 302, `GET /docs`, and `GET /openapi.json` are the only envelope exceptions. A PHP caller that needs SSE is a new transport, not a reason to fork the API.

## OpenAPI pointer (what to generate next)

When you add a typed method, generate it from `docs/openapi.yaml` (or `GET /openapi.json`). Keep unwrap in one place (`YskClient::request` / `unwrapEnvelope`). Extra languages later follow the same boundary — they are codegen, not a second hexagonal tree.

Machine keys stay `error.code` (`UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, …), not a translated `message`.

## Verify

```bash
pnpm gen:openapi
curl -s http://localhost:3001/health
# PHP: login then GET /v1/me — expect unwrapped data, or YskApiError with a code
```

Kit TypeScript verification is unchanged: `pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent`.
