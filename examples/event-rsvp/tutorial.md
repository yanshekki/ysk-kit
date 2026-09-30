# Event RSVP

Language: [中文](tutorial.zh.md) · English

A thin SaaS product that hosts events and records RSVPs. Two hexagonal modules, no extra capabilities.

Screenshots below are 1280×800, captured against an applied destination (API **13001**, web **15173**).

## 1. What you get

After you finish:

- A new product directory with `--preset thin` identity, files, notifications, jobs, mail, API keys, crypto, and realtime.
- Module `event` at `GET/POST /v1/event`.
- Module `rsvp` at `GET/POST /v1/rsvp`. An RSVP must point at an existing event. Duplicate email on the same event, or a full house, is `CONFLICT`.
- Web pages `/event` and `/rsvp` (nav labels **Event** and **Rsvp**).
- Seed accounts `admin@ysk.hk` / `ysk-admin-dev` and `user@ysk.hk` / `ysk-user-dev`. One admin event; the user list starts empty.

![Sign in](screenshots/01-login.png)

**Expected:** the Sign in form. Title **Sign in**.

## 2. Who it is for, and how long it takes

Meetups, talks, and any “named event plus a guest list”. About **20–30 minutes** the first time.

## 3. Prerequisites

- **Node 24** and **pnpm 12**
- A checkout of this kit
- Optional: Docker MySQL 8.4 if you override `--db mysql`

## 4. Why this flavor, preset, and database

| Choice | Value | Why |
|---|---|---|
| Flavor | `saas` | Web + API |
| Preset | `thin` | Fifteen-minute path. No llm, billing, organizations, or push |
| Database | sqlite in `spec.json` | No Docker. Pass `--db mysql` for Compose |
| Admin / mobile | off | Desktop web is enough |

Industry events do **not** mount on the living kit API.

## 5. Scaffold commands

```bash
pnpm --filter @ysk/examples start apply event-rsvp --dest ~/Projects/my-events --yes
```

Default destination (gitignored): `examples/.runs/event-rsvp`. Replace a previous run with `--force`.

Equivalent manual steps (sqlite): `create-ysk-app` thin saas sqlite `--no-admin --no-mobile --yes`, then `ysk add module event --prisma --web`, `ysk add module rsvp --prisma --web`, copy this overlay, replace Prisma models `Event` and `Rsvp`, `prisma db push`, seed.

## 6. Modules and capabilities, and why that order

`spec.json` lists `event` then `rsvp`. Capabilities are empty. Add the parent module first so the child Prisma fragment can declare `event Event @relation(...)`.

`examples/event-rsvp/patches.json` rewires the memory harness so both services share one in-memory event repository (`rsvpService` is inserted above `eventService`; the patch wraps them around `eventRepo`).

## 7. Data model

**Event** (no TypeScript `enum`):

| Field | Type | Rule |
|---|---|---|
| `title` | 1–80 | Required |
| `venue` | 1–80 | Required |
| `startsAt` | ISO datetime | Required |
| `capacity` | positive int | Must be ≥ 1 |

**RSVP:** `eventId`, `attendeeName` (1–80), `email`. Unique `[eventId, email]`.

Who can read/write: the signed-in user lists **their** rows.

## 8. Business rules

1. Capacity `0` or a non-positive integer → `VALIDATION_FAILED` (HTTP 422).
2. RSVP whose `eventId` is missing → `NOT_FOUND` (HTTP 404).
3. Same `eventId` + `email` again → `CONFLICT` (HTTP 409).
4. RSVP count already at `capacity` → `CONFLICT` (HTTP 409).
5. Missing session → `UNAUTHENTICATED` (HTTP 401).

Child repository methods: `getEvent`, `countForEvent`, `findByEventEmail`.

## 9. Overlay files versus the generator defaults

The generator still uses `title` / `body`. The overlay replaces DTOs, contracts, services, repos, HTTP tests, Prisma fragments, SDK, web-sdk, both pages, and seed. `app.ts` and `router.tsx` stay as the CLI patched them. `patches.json` shares `eventRepo` in the memory harness.

## 10. Seed data

| Email | Password | Role | Events |
|---|---|---|---|
| `admin@ysk.hk` | `ysk-admin-dev` | ADMIN | Town Hall, Admiralty, capacity 50 |
| `user@ysk.hk` | `ysk-user-dev` | USER | none |

## 11. Start and sign in

```bash
cd ~/Projects/my-events
pnpm dev
```

Open http://localhost:5173/login. Sign in as `user@ysk.hk` / `ysk-user-dev`. After login the app lands on `/users`. Open **Event** in the nav.

## 12. UI walkthrough

![Empty list](screenshots/02-empty.png)

**Expected:** heading **Events**, empty state **No events**.

Enter title `Harbour Talk`, venue `Central`, a future **Starts at**, capacity `0`, then Create.

![Invalid](screenshots/03-invalid.png)

**Expected:** an alert banner (capacity must be a positive integer). The table stays empty.

Set Capacity to `20`. Create.

![Created](screenshots/04-created.png)

**Expected:** a row for **Harbour Talk**, venue Central, capacity 20.

Open **Rsvp**, choose Event **Harbour Talk**, attendee name `Chan Tai Man`, email `chan@ysk.hk`, Create.

![RSVP](screenshots/06-rsvp.png)

**Expected:** the attendee appears in the RSVP table.

## 13. HTTP walkthrough

Base URL http://localhost:3001 (or **13001** during capture). Bearer from `POST /v1/auth/login`.

**Expected** (`expected/create-ok.json`): HTTP **201**

```json
{
  "ok": true,
  "data": {
    "title": "Harbour Talk",
    "venue": "Central",
    "capacity": 20
  }
}
```

Capacity `0` → HTTP **422** `{ "ok": false, "error": { "code": "VALIDATION_FAILED" } }`.

Unknown `eventId` on RSVP → HTTP **404** `NOT_FOUND`.

Second RSVP with the same email, or a full event → HTTP **409** `CONFLICT`.

No `Authorization` → HTTP **401** `UNAUTHENTICATED`.

## 14. Scalar `/docs`

![Scalar docs](screenshots/05-docs.png)

**Expected:** Scalar lists `GET`/`POST /v1/event`. `GET /openapi.json` also lists `/v1/rsvp`.

## 15. Verify commands

Inside the destination:

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk check agent
```

**Expected:** all green. Event tests cover capacity `0`. RSVP tests cover missing event, duplicate email, and a full house.

## 16. Out of scope

- Mounting `event` on the living kit
- Public event catalogues, waitlists, or calendar invites
- `ysk add team` or billing

## 17. Next example

Job board (`job-board`) is the next worked system in the [examples index](../README.md).
