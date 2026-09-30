# Field work orders

Language: [中文](tutorial.zh.md) · English

A thin SaaS product for field technicians: work orders on the web, the same inbox on Expo. One hexagonal module, plus `ysk add push`.

Screenshots below are 1280×800, captured against an applied destination (API **13001**, web **15173**). There are no fabricated mobile screenshots; Expo reads the same `GET /v1/notifications`.

## 1. What you get

After you finish:

- A new product directory with `--preset thin` identity, files, notifications, jobs, mail, API keys, crypto, and realtime, **plus mobile** and **push**.
- Module `work-order` at `GET/POST /v1/work-order`, `POST /v1/work-order/:id/assign`, `POST /v1/work-order/:id/complete`.
- Web page `/work-order` (nav **WorkOrder**). **Assign** on `NEW` rows, **Complete** on `ASSIGNED`. Thin+push already has **Inbox**.
- Assign enqueues `notification.create` with type `work.assigned`. In development with `RUN_WORKERS=1`, the worker runs in-process and the row appears in Inbox.
- Seed accounts `admin@ysk.hk` / `ysk-admin-dev` and `user@ysk.hk` / `ysk-user-dev`. One admin `NEW` work order; the user list starts empty.

![Sign in](screenshots/01-login.png)

**Expected:** the Sign in form. Title **Sign in**.

## 2. Who it is for, and how long it takes

Facilities, HVAC, and any “site visit plus a status”. About **20–30 minutes** the first time.

## 3. Prerequisites

- **Node 24** and **pnpm 12**
- A checkout of this kit
- Optional: Docker MySQL 8.4 if you override `--db mysql`

Expo is scaffolded; you do not need a device to finish the web walkthrough.

## 4. Why this flavor, preset, and database

| Choice | Value | Why |
|---|---|---|
| Flavor | `saas` | Web + API + mobile |
| Preset | `thin` | Fifteen-minute path, then restore **push** |
| Database | sqlite in `spec.json` | No Docker. Pass `--db mysql` for Compose |
| Admin | off | Practitioner / dispatcher web UI |
| Mobile | on | Expo InboxScreen shares `GET /v1/notifications` |

Industry work orders do **not** mount on the living kit API.

## 5. Scaffold commands

```bash
pnpm --filter @ysk-kit/examples start apply field-work-orders --dest ~/Projects/my-field --yes
```

Default destination (gitignored): `examples/.runs/field-work-orders`. Replace a previous run with `--force`.

Equivalent manual steps (sqlite): `create-ysk-app` thin saas sqlite `--no-admin --yes` (keep mobile), then `ysk add push`, `ysk add module work-order --prisma --web`, copy this overlay, replace Prisma model `WorkOrder`, apply `patches.json`, `prisma db push`, seed.

## 6. Modules and capabilities, and why that order

`spec.json` capabilities: `["push"]`. Modules: `work-order` with `--prisma --web`. Apply runs `ysk add push` **before** the module so devices, workers, and Inbox stay wired.

`examples/field-work-orders/patches.json` must pass the composition `queue` into the service:

1. `apps/api/src/composition.ts` — `createWorkOrderService(..., queue)`
2. `apps/api/src/create-memory-input.ts` — same for the memory harness

The overlay also replaces `packages/contracts/src/enums/notification-type.ts` so `WORK_ASSIGNED: 'work.assigned'` sits next to `AUTH_WELCOME`, `AUTH_RESET`, `USER_CREATED`, and `ORG_INVITED`. Do not import BullMQ; the application layer uses `IJobQueue` from `@ysk-kit/jobs` (auth-service already does).

## 7. Data model

**WorkOrder** (status is a Prisma `String`, `as const` + Zod in contracts — no TypeScript `enum`):

| Field | Type | Rule |
|---|---|---|
| `title` | 1–80 | Required |
| `address` | 1–200 | Required |
| `status` | `NEW` \| `ASSIGNED` \| `DONE` | Create starts `NEW` |

Who can read/write: the signed-in user lists **their** rows. Assign and complete require the same `authorId`.

## 8. Business rules

All of these live in `createWorkOrderService(repo, jobs?: IJobQueue)`.

1. Empty title → `VALIDATION_FAILED` (HTTP 422).
2. `POST /v1/work-order/:id/assign`: owner + `NEW` → `ASSIGNED`. Else `CONFLICT`. Unknown id or another author’s row → `NOT_FOUND`.
3. On assign, `jobs.enqueue('notification.create', { userId: authorId, type: 'work.assigned', title: row.title, body: \`Assigned: ${row.address}\` })`.
4. `POST /v1/work-order/:id/complete`: owner + `ASSIGNED` → `DONE`. Else `CONFLICT`.
5. Missing session → `UNAUTHENTICATED` (HTTP 401).

Memory tests pass a fake queue (`vi.fn` or an array push). HTTP assign returns **200** with `status: ASSIGNED`.

## 9. Overlay files versus the generator defaults

The generator still uses `title` / `body`. The overlay replaces DTO, contract, service, repos, HTTP tests, Prisma fragment, SDK, web-sdk, the page, seed, and `notification-type.ts`. `app.ts` and `router.tsx` stay as the CLI patched them. `patches.json` injects `queue` — do not overlay a full `composition.ts`.

## 10. Seed data

| Email | Password | Role | Work orders |
|---|---|---|---|
| `admin@ysk.hk` | `ysk-admin-dev` | ADMIN | Inspect lift, 1 Queen's Road, `NEW` |
| `user@ysk.hk` | `ysk-user-dev` | USER | none |

## 11. Start and sign in

```bash
cd ~/Projects/my-field
pnpm dev
```

`.env` keeps `NODE_ENV=development` and `RUN_WORKERS=1` so assign writes Inbox in the API process.

Open http://localhost:5173/login. Sign in as `user@ysk.hk` / `ysk-user-dev`. After login the app lands on `/users`. Open **WorkOrder** in the nav.

## 12. UI walkthrough

![Empty list](screenshots/02-empty.png)

**Expected:** heading **Work orders**, empty state **No work orders**.

Click **Create** with an empty title.

![Invalid](screenshots/03-invalid.png)

**Expected:** an alert banner. The table stays empty.

Set Title to `Fix AC`, Address to `18 Harbour Road`, Create.

![Created](screenshots/04-created.png)

**Expected:** a row for **Fix AC**, status `NEW`, button **Assign**.

Open Scalar (below), return to `/work-order`, click **Assign**. Status becomes `ASSIGNED`; the button becomes **Complete**.

![Assigned](screenshots/06-assigned.png)

Open **Inbox** (nav `/notifications`). Wait for **Fix AC**.

![Inbox](screenshots/07-inbox.png)

**Expected:** a notification titled **Fix AC**, body `Assigned: 18 Harbour Road`.

Expo `InboxScreen` calls the same `GET /v1/notifications`. Do not expect a separate mobile PNG in this tutorial.

## 13. HTTP walkthrough

Base URL http://localhost:3001 (or **13001** during capture). Bearer from `POST /v1/auth/login`.

**Expected** (`expected/create-ok.json`): HTTP **201**

```json
{
  "ok": true,
  "data": {
    "title": "Fix AC",
    "address": "18 Harbour Road",
    "status": "NEW"
  }
}
```

Empty title → HTTP **422** `{ "ok": false, "error": { "code": "VALIDATION_FAILED" } }`.

Assign (`expected/assign-ok.json`): HTTP **200** `{ "ok": true, "data": { "status": "ASSIGNED" } }`.

Assign again, or complete a `NEW` row → HTTP **409** `CONFLICT`.

No `Authorization` → HTTP **401** `UNAUTHENTICATED`.

Assign: `POST /v1/work-order/:id/assign` with `{}`. Complete: `POST /v1/work-order/:id/complete`.

## 14. Scalar `/docs`

![Scalar docs](screenshots/05-docs.png)

**Expected:** Scalar lists `GET`/`POST /v1/work-order` plus `/v1/work-order/{id}/assign` and `/complete`. After `pnpm gen:openapi` the destination `docs/openapi.yaml` contains the same paths.

## 15. Verify commands

Inside the destination:

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk check agent
```

**Expected:** all green. Work-order tests cover assign enqueue, HTTP 200 `ASSIGNED`, empty title, and 401. `ysk check agent` reports no TypeScript `enum`.

## 16. Out of scope

- Mounting `work-order` on the living kit
- Dispatch maps, technician roles, or a separate mobile work-order screen
- Fabricated Expo screenshots (InboxScreen is the same notifications list)
- Live FCM / Redis in CI

## 17. Next example

This is the last worked system in the catalogue. Return to the [examples index](../README.md).
