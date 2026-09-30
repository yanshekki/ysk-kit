# Quotes

Language: [中文](tutorial.zh.md) · English

A thin SaaS product that stores HKD quotes in cents and walks them from `DRAFT` to `SENT` to `ACCEPTED`. One hexagonal module, no extra capabilities.

Screenshots below are 1280×800, captured against an applied destination (API **13001**, web **15173**). Living-kit ports 3001 / 5173 stay free.

## 1. What you get

After you finish:

- A new product directory (not this kit) with identity, files, notifications, jobs, mail, API keys, crypto, and realtime from `--preset thin`.
- Hexagonal module `quote` at `GET/POST /v1/quote`, plus send and accept.
- Web page `/quote`: list, create form, **Send** on `DRAFT` rows and **Accept** on `SENT` rows. Amounts render with `formatHkd` from `@ysk-kit/ui-logic`.
- Seed accounts `admin@ysk.hk` / `ysk-admin-dev` and `user@ysk.hk` / `ysk-user-dev`. One admin draft; the user list starts empty.
- Memory-port tests for amount `0`, send/accept transitions, and missing rows.

![Sign in](screenshots/01-login.png)

**Expected:** the Sign in form with Email and Password. Title **Sign in**.

## 2. Who it is for, and how long it takes

Freelancers, agencies, and any “named client plus a HKD figure”. About **15–25 minutes** the first time (scaffold + overlay + seed). Reading this page without applying is enough to see field names and envelopes.

## 3. Prerequisites

- **Node 24** and **pnpm 12**
- A checkout of this kit (the apply CLI lives here)
- Optional: Docker MySQL 8.4 if you override `--db mysql`

SQLite needs no Compose. The apply command defaults to sqlite from `spec.json`.

## 4. Why this flavor, preset, and database

| Choice | Value | Why |
|---|---|---|
| Flavor | `saas` | Web + API. Gateway / php-bridge / trading / static-web3 already have flavor manuals. |
| Preset | `thin` | Fifteen-minute path. No llm, billing, organizations, or push devices. |
| Database | sqlite in CI and in `spec.json` | No Docker. Production-like local work can pass `--db mysql`. |
| Admin app | off | This example is the salesperson web UI. |
| Mobile | off | Field work is a later example. |

Industry quotes do **not** mount on the living kit API. Overlay files copy into the **destination** only.

## 5. Scaffold commands

From the kit checkout:

```bash
pnpm --filter @ysk-kit/examples start apply invoice-quotes --dest ~/Projects/my-quotes --yes
```

`--yes` is passed to `create-ysk-app` so agents and CI never wait for a TTY. Default destination (gitignored) is `examples/.runs/invoice-quotes`. Replacing a previous run:

```bash
pnpm --filter @ysk-kit/examples start apply invoice-quotes --yes --force
```

Equivalent manual steps (sqlite): `create-ysk-app` thin saas sqlite `--no-admin --no-mobile --yes`, then `ysk-kit add module quote --prisma --web`, copy this overlay, replace Prisma model `Quote`, `prisma db push`, seed.

## 6. Modules and capabilities, and why that order

`spec.json` lists one module: `quote` with `--prisma --web`. **Capabilities are empty.** Team and billing would come first on later examples (`team` then `billing`).

`ysk-kit add module` writes the hexagonal slice and patches Express, Fastify, composition, SDK, web-sdk, and the web router (`/quote`). The generator still uses `title` / `body`. The overlay then overwrites those files with quote fields. There is no `patches.json`.

## 7. Data model

Prisma model `Quote` (status is a `String`, not a TypeScript `enum`):

| Field | Type | Rule |
|---|---|---|
| `id` | UUID | Generated |
| `clientName` | string, 1–80 | Required |
| `amountHkd` | int `> 0` | Cents. `z.number().int().positive()` |
| `status` | `DRAFT` \| `SENT` \| `ACCEPTED` | `as const` + Zod in `@ysk-kit/contracts`. Create starts at `DRAFT` |
| `authorId` | UUID | Owner of the row (the signed-in user) |
| `createdAt` / `updatedAt` | datetime | Prisma |

Who can read/write: the signed-in user lists **their** rows. Send and accept require the same `authorId`.

## 8. Business rules

All of these live in `apps/api/src/modules/quote/application/quote-service.ts`.

1. `amountHkd <= 0` on create → `VALIDATION_FAILED` (HTTP 422, Zod `positive()`).
2. `POST /v1/quote/:id/send` is allowed only when `amountHkd > 0` (already true after Zod) **and** `status` is `DRAFT`; otherwise `CONFLICT` (HTTP 409). Success sets `DRAFT` → `SENT`.
3. `POST /v1/quote/:id/accept` is allowed only when `status` is `SENT`; otherwise `CONFLICT`. Success sets `SENT` → `ACCEPTED`.
4. Unknown id or another author’s row → `NOT_FOUND` (HTTP 404).
5. Missing session → `UNAUTHENTICATED` (HTTP 401).

## 9. Overlay files versus the generator defaults

| Path | Generator | Overlay |
|---|---|---|
| `packages/contracts/src/dto/quote.ts` | `title`, `body` | `clientName`, `amountHkd`, `status` |
| `packages/contracts/src/api/quote.ts` | list + create | list, create, send, accept |
| `application/quote-service.ts` | passthrough | send / accept transitions |
| `infra/*-quote-repository.ts` | title/body rows | quote fields + `getById` / `updateStatus` |
| `infra/quote-router.ts` | list + create | four handlers |
| `infra/quote.test.ts` | create/list | rules + HTTP envelopes |
| `modules/quote/prisma/quote.prisma` | title/body | quote model (also **replaces** the model in `schema.prisma`) |
| `packages/sdk` / `web-sdk` | list/create | + send/accept |
| `apps/web/.../quote-page.tsx` | title/body form | Client name, Amount (cents), `formatHkd`, Send / Accept |
| `apps/api/src/infra/seed.ts` | two users | two users + one admin `DRAFT` |

`app.ts` and `router.tsx` stay as the CLI patched them.

## 10. Seed data

`pnpm db:seed` upserts:

| Email | Password | Role | Quotes |
|---|---|---|---|
| `admin@ysk.hk` | `ysk-admin-dev` | ADMIN | Harbour Sales, `50000` cents, `DRAFT` |
| `user@ysk.hk` | `ysk-user-dev` | USER | none |

Screenshots of the empty list sign in as **user@ysk.hk** so the table is empty even after seed.

## 11. Start and sign in

```bash
cd ~/Projects/my-quotes   # or examples/.runs/invoice-quotes
pnpm dev
```

| Surface | URL |
|---|---|
| API | http://localhost:3001 |
| Web | http://localhost:5173 |
| Scalar | http://localhost:3001/docs |

Open http://localhost:5173/login.

**Expected:** heading **Sign in**, fields Email and Password, button **Sign in**.

Sign in as `user@ysk.hk` / `ysk-user-dev`. The login page navigates to `/users`. Open **Quote** in the nav (path `/quote`).

## 12. UI walkthrough

### Empty list

![Empty quotes](screenshots/02-empty.png)

**Expected:** heading **Quotes**, the create form, and EmptyState title **No quotes**.

### Invalid amount

Set Client name to `YSK Limited`, Amount (cents) to `0`. Click **Create**.

![Validation error](screenshots/03-invalid.png)

**Expected:** an error banner (role `alert`) with a Zod positive-integer message (`Too small: expected number to be >0`). The table stays empty.

### Created row

Set Amount (cents) to `128000`. Click **Create**.

![Created quote](screenshots/04-created.png)

**Expected:** a table row for **YSK Limited**, amount `$1,280` (`formatHkd(item.amountHkd / 100)`), status `DRAFT`, button **Send**. EmptyState is gone.

Send on that row sets status to `SENT` and shows **Accept**. Accept sets `ACCEPTED` and hides the buttons. Sending a non-`DRAFT` row or accepting a non-`SENT` row returns `CONFLICT`.

## 13. HTTP walkthrough

All JSON routes use `{ ok: true, data }` / `{ ok: false, error }`. Register or login first; send `Authorization: Bearer <accessToken>` and `x-ysk-platform: web`.

### Success — `POST /v1/quote`

```bash
curl -sS http://localhost:3001/v1/quote \
  -H 'content-type: application/json' \
  -H 'x-ysk-platform: web' \
  -H "authorization: Bearer $TOKEN" \
  -d '{"clientName":"YSK Limited","amountHkd":128000}'
```

**Expected** (id and timestamps vary; see `expected/create-ok.json`):

```json
{
  "ok": true,
  "data": {
    "clientName": "YSK Limited",
    "amountHkd": 128000,
    "status": "DRAFT"
  }
}
```

HTTP status **201**.

### Invalid amount

Use `"amountHkd":0`.

**Expected** (`expected/create-invalid.json`): HTTP **422**

```json
{ "ok": false, "error": { "code": "VALIDATION_FAILED" } }
```

### Wrong status

`POST /v1/quote/:id/accept` on a `DRAFT`, or `POST /v1/quote/:id/send` on a `SENT` row.

**Expected** (`expected/conflict.json`): HTTP **409**

```json
{ "ok": false, "error": { "code": "CONFLICT" } }
```

Send: `POST /v1/quote/:id/send` with `{}`. Accept: `POST /v1/quote/:id/accept`.

### No session

Omit the Authorization header.

**Expected** (`expected/unauthenticated.json`): HTTP **401**

```json
{ "ok": false, "error": { "code": "UNAUTHENTICATED" } }
```

## 14. Scalar `/docs`

Open http://localhost:3001/docs (or port 13001 when using `capture`).

![Scalar docs](screenshots/05-docs.png)

**Expected:** Scalar API reference HTML. `GET /openapi.json` lists `/v1/quote`, `/v1/quote/{id}/send`, and `/v1/quote/{id}/accept`. After `pnpm gen:openapi` the destination `docs/openapi.yaml` contains the same paths.

## 15. Verify commands

Inside the destination:

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

**Expected:** all green. Quote tests cover amount `0`, send/accept, wrong-status `CONFLICT`, and the HTTP envelopes above. `ysk-kit check agent` reports `ysk-kit check agent: ok` (no TypeScript `enum`, no Prisma in web, no raw `fetch`).

The apply CLI already runs that bar unless you pass `--skip-verify`.

## 16. Out of scope

- Mounting `quote` on the living kit
- PDF invoices, tax, or Stripe Checkout (see membership-club when it ships)
- `ysk-kit add team` or billing
- Live Stripe, Twilio, FCM, Redis, Jaeger, Grafana
- Visual screenshot diffs in CI (PNG files are documentation; CI applies sqlite and runs tests)

## 17. Next example

Event RSVP (`event-rsvp`) is the next worked system in the [examples index](../README.md).
