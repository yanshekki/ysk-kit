# Helpdesk tickets

Language: [中文](tutorial.zh.md) · English

A thin SaaS product that stores support tickets inside an organization. This example adds `ysk add team` before the industry module.

Screenshots below are 1280×800, captured against an applied destination (API **13001**, web **15173**). Living-kit ports 3001 / 5173 stay free.

## 1. What you get

After you finish:

- A new product directory (not this kit) with identity, files, notifications, jobs, mail, API keys, crypto, and realtime from `--preset thin`.
- Organizations from `ysk add team`: nav label **Orgs**, page heading **Organizations**, create form label **Name**, button **Create**.
- Hexagonal module `ticket` at `GET/POST /v1/ticket` plus `POST /v1/ticket/:id/status`.
- Web page `/ticket` (nav **Ticket**): organization `<select>`, Title, Body. List loads only when an org is selected.
- Seed accounts `admin@ysk.hk` / `ysk-admin-dev` and `user@ysk.hk` / `ysk-user-dev`. **No organization is seeded**; the walker creates **Acme Support** so the signed-in user is OWNER.
- Memory-port tests for membership, MEMBER vs OWNER status, and HTTP envelopes.

![Sign in](screenshots/01-login.png)

**Expected:** the Sign in form with Email and Password. Title **Sign in**.

## 2. Who it is for, and how long it takes

Internal helpdesks and any “tickets that belong to an org, not to a lone user”. About **20–30 minutes** the first time (scaffold + team + overlay + seed). Reading this page without applying is enough to see field names and envelopes.

## 3. Prerequisites

- **Node 24** and **pnpm 12**
- A checkout of this kit (the apply CLI lives here)
- Optional: Docker MySQL 8.4 if you override `--db mysql`

SQLite needs no Compose. The apply command defaults to sqlite from `spec.json`.

## 4. Why this flavor, preset, and database

| Choice | Value | Why |
|---|---|---|
| Flavor | `saas` | Web + API. Gateway / php-bridge / trading / static-web3 already have flavor manuals. |
| Preset | `thin` | Fifteen-minute path. Team is added explicitly; no llm, billing, or push. |
| Database | sqlite in CI and in `spec.json` | No Docker. Production-like local work can pass `--db mysql`. |
| Admin app | off | This example is the agent web UI. |
| Mobile | off | Field work is a later example. |

Industry tickets do **not** mount on the living kit API. Overlay files copy into the **destination** only.

## 5. Scaffold commands

From the kit checkout:

```bash
pnpm --filter @ysk-kit/examples start apply helpdesk-tickets --dest ~/Projects/my-helpdesk --yes
```

`--yes` is passed to `create-ysk-app` so agents and CI never wait for a TTY. Default destination (gitignored) is `examples/.runs/helpdesk-tickets`. Replacing a previous run:

```bash
pnpm --filter @ysk-kit/examples start apply helpdesk-tickets --yes --force
```

Equivalent manual steps (sqlite):

```bash
pnpm --filter @ysk-kit/create-app start my-helpdesk --preset thin --flavor saas --db sqlite --no-admin --no-mobile --yes
cd my-helpdesk
pnpm install
cp .env.example .env
pnpm ysk add team
pnpm ysk add module ticket --prisma --web
# then copy examples/helpdesk-tickets/overlay/ over this tree
# replace model Ticket in apps/api/prisma/schema.prisma with the overlay fragment
# apply examples/helpdesk-tickets/patches.json so the memory ticket repo reads org memberships
pnpm db:generate && pnpm --filter @ysk-kit/api exec prisma db push && pnpm db:seed
pnpm gen:openapi
pnpm dev
```

SQLite skips Compose and uses `prisma db push` instead of `migrate dev` (migrate is interactive).

## 6. Modules and capabilities, and why that order

`spec.json` lists capability `team`, then module `ticket` with `--prisma --web`. **Team comes first** so `Organization` / `Membership` exist before ticket `getMembership` reads them. Apply already sorts `team` before `billing` when both appear; this example has no billing.

`ysk add module` writes the hexagonal slice and patches Express, Fastify, composition, SDK, web-sdk, and the web router (`/ticket`, nav **Ticket**). The generator still uses `title` / `body` without an org. The overlay then overwrites those files.

`examples/helpdesk-tickets/patches.json` rewires `create-memory-input.ts` so `createMemoryTicketRepository(orgs)` looks up memberships on the **same** in-memory organization repository that `organizationService` writes. Overlaying a full `create-memory-input.ts` is forbidden. HTTP tests register user A, `POST /v1/organizations`, then `POST /v1/ticket` with that org id.

## 7. Data model

Prisma model `Ticket` (status is a `String`, not a TypeScript `enum`). There is **no** Prisma relation to `Organization` (the overlay must not replace the team Organization model).

| Field | Type | Rule |
|---|---|---|
| `id` | UUID | Generated |
| `title` | string, 1–200 | Required |
| `body` | string, ≤ 8000 | Default `""` |
| `organizationId` | UUID | Org the ticket belongs to |
| `status` | `OPEN` \| `PENDING` \| `RESOLVED` | `as const` + Zod in `@ysk-kit/contracts`. Create starts at `OPEN` |
| `authorId` | UUID | Signed-in user who opened the ticket |
| `createdAt` / `updatedAt` | datetime | Prisma |

Who can read/write: any **member** of the organization. List query **must** include `organizationId` (UUID). Missing membership is `FORBIDDEN` (HTTP 403), not `NOT_FOUND`.

## 8. Business rules

All of these live in `apps/api/src/modules/ticket/application/ticket-service.ts`.

1. No membership for the `organizationId` → `FORBIDDEN` (HTTP 403). Unknown org is still 403, not 404.
2. Create starts at `OPEN`. Any member may create.
3. `MEMBER` may set status `PENDING`. `MEMBER` setting `RESOLVED` (or `OPEN`) → `FORBIDDEN`.
4. `OWNER` and `ADMIN` may set `RESOLVED` (and the other statuses).
5. Unknown ticket id on status → `NOT_FOUND` (HTTP 404).
6. Empty title → `VALIDATION_FAILED` (HTTP 422).
7. Missing session → `UNAUTHENTICATED` (HTTP 401).
8. List without `organizationId` → `VALIDATION_FAILED` (HTTP 422).

The repository port `getMembership(userId, orgId)` returns `{ role: 'OWNER' | 'ADMIN' | 'MEMBER' } | null`. Prisma uses `prisma.membership.findUnique({ where: { organizationId_userId: { organizationId, userId } } })`. Memory tests either `seedMembership` or pass the org memory repo.

## 9. Overlay files versus the generator defaults

| Path | Generator | Overlay |
|---|---|---|
| `packages/contracts/src/dto/ticket.ts` | `title`, `body` | + `organizationId`, `status`, list query extends `PageQuerySchema` |
| `packages/contracts/src/api/ticket.ts` | list + create | list (org query), create, status |
| `application/ticket-service.ts` | passthrough | membership + status roles |
| `infra/*-ticket-repository.ts` | title/body rows | org list, `getMembership`, `updateStatus` |
| `infra/ticket-router.ts` | list + create | three handlers |
| `infra/ticket.test.ts` | create/list | rules + HTTP envelopes (201 after org create, 403 for user B) |
| `modules/ticket/prisma/ticket.prisma` | title/body | ticket model **without** Organization relation |
| `packages/sdk` / `web-sdk` | list/create | list requires `organizationId`; `useList` `enabled: Boolean(organizationId)` |
| `apps/web/.../ticket-page.tsx` | title/body form | org select, EmptyState **No tickets**, noValidate |
| `apps/api/src/infra/seed.ts` | two users | two users, **no org** |
| `app.ts` / `router.tsx` | CLI patches | **not** in the overlay |

## 10. Seed data

`pnpm db:seed` upserts:

| Email | Password | Role | Organizations / tickets |
|---|---|---|---|
| `admin@ysk.hk` | `ysk-admin-dev` | ADMIN | none |
| `user@ysk.hk` | `ysk-user-dev` | USER | none |

Screenshots sign in as **user@ysk.hk** and create **Acme Support** in the UI so that user is OWNER.

## 11. Start and sign in

```bash
cd ~/Projects/my-helpdesk   # or examples/.runs/helpdesk-tickets
pnpm dev
```

| Surface | URL |
|---|---|
| API | http://localhost:3001 |
| Web | http://localhost:5173 |
| Scalar | http://localhost:3001/docs |

Open http://localhost:5173/login.

**Expected:** heading **Sign in**, fields Email and Password, button **Sign in**.

Sign in as `user@ysk.hk` / `ysk-user-dev`. The login page navigates to `/users`. Open **Orgs** in the nav (path `/orgs`). Heading is **Organizations**.

## 12. UI walkthrough

### Create an organization

![Organizations](screenshots/06-orgs.png)

Fill **Name** `Acme Support`. Click **Create**.

**Expected:** the table shows **Acme Support**.

### Empty list

Open **Ticket** (path `/ticket`).

![Empty tickets](screenshots/02-empty.png)

**Expected:** heading **Tickets**, the create form, and EmptyState title **No tickets**.

### Invalid title

Choose Organization **Acme Support**. Leave Title empty (or a space). Click **Create**. The form uses `noValidate` so the browser does not block submit.

![Validation error](screenshots/03-invalid.png)

**Expected:** an error banner (role `alert`). The table stays empty.

### Created row

Set Title to `Printer jam`, Body to `3F copier`. Click **Create**.

![Created ticket](screenshots/04-created.png)

**Expected:** a table row for **Printer jam**, body `3F copier`, status `OPEN`. EmptyState is gone.

## 13. HTTP walkthrough

All JSON routes use `{ ok: true, data }` / `{ ok: false, error }`. Register or login first; send `Authorization: Bearer <accessToken>` and `x-ysk-platform: web`. Create an organization, then use its id.

### Success — `POST /v1/ticket`

```bash
curl -sS http://localhost:3001/v1/ticket \
  -H 'content-type: application/json' \
  -H 'x-ysk-platform: web' \
  -H "authorization: Bearer $TOKEN" \
  -d '{"title":"Printer jam","body":"3F copier","organizationId":"'"$ORG_ID"'"}'
```

**Expected** (id and timestamps vary; see `expected/create-ok.json`):

```json
{
  "ok": true,
  "data": {
    "title": "Printer jam",
    "body": "3F copier",
    "status": "OPEN"
  }
}
```

HTTP status **201**.

### Invalid title

Use `"title":""`.

**Expected** (`expected/create-invalid.json`): HTTP **422**

```json
{ "ok": false, "error": { "code": "VALIDATION_FAILED" } }
```

### Forbidden

Register a second user. POST a ticket with user A’s `organizationId`.

**Expected** (`expected/forbidden.json`): HTTP **403**

```json
{ "ok": false, "error": { "code": "FORBIDDEN" } }
```

### No session

Omit the Authorization header.

**Expected** (`expected/unauthenticated.json`): HTTP **401**

```json
{ "ok": false, "error": { "code": "UNAUTHENTICATED" } }
```

Status: `POST /v1/ticket/:id/status` with `{ "status": "PENDING" }` or `"RESOLVED"`. List: `GET /v1/ticket?organizationId=<uuid>`.

## 14. Scalar `/docs`

Open http://localhost:3001/docs (or port 13001 when using `capture`).

![Scalar docs](screenshots/05-docs.png)

**Expected:** Scalar API reference HTML. `GET /openapi.json` lists `/v1/ticket` and `/v1/ticket/{id}/status`. After `pnpm gen:openapi` the destination `docs/openapi.yaml` contains the same paths. Team routes `/v1/organizations` are also present.

## 15. Verify commands

Inside the destination:

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk check agent
```

**Expected:** all green. Ticket tests cover membership, MEMBER vs OWNER status, HTTP 201 after org create, 403 for an outsider, 422, and 401. `ysk check agent` reports `ysk check agent: ok` (no TypeScript `enum`, no Prisma in web, no raw `fetch`).

The apply CLI already runs that bar unless you pass `--skip-verify`.

## 16. Out of scope

- Mounting `ticket` on the living kit
- SLA clocks, assignment queues, or email replies
- `ysk add billing` (see membership-club)
- Live Stripe, Twilio, FCM, Redis, Jaeger, Grafana
- Visual screenshot diffs in CI (PNG files are documentation; CI applies sqlite and runs tests)

## 17. Next example

Membership subscription (`membership-club`) is the next worked system in the [examples index](../README.md). It keeps team and adds billing.
