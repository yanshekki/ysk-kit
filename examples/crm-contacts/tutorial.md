# CRM contacts and follow-ups

Language: [中文](tutorial.zh.md) · English

A thin SaaS product that stores sales contacts and follow-up notes. Two hexagonal modules, no extra capabilities.

Screenshots below are 1280×800, captured against an applied destination (API **13001**, web **15173**).

## 1. What you get

After you finish:

- A new product directory with `--preset thin` identity, files, notifications, jobs, mail, API keys, crypto, and realtime.
- Module `contact` at `GET/POST /v1/contact` plus `POST /v1/contact/:id/status`.
- Module `follow-up` at `GET/POST /v1/follow-up`. A follow-up must point at a contact the author owns.
- Web pages `/contact` and `/follow-up` (nav labels **Contact** and **FollowUp**).
- Seed accounts `admin@ysk.hk` / `ysk-admin-dev` and `user@ysk.hk` / `ysk-user-dev`. One admin lead; the user list starts empty.

![Sign in](screenshots/01-login.png)

**Expected:** the Sign in form. Title **Sign in**.

## 2. Who it is for, and how long it takes

B2B sales and any “named people plus a next action”. About **20–30 minutes** the first time.

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

Industry CRM does **not** mount on the living kit API.

## 5. Scaffold commands

```bash
pnpm --filter @ysk-kit/examples start apply crm-contacts --dest ~/Projects/my-crm --yes
```

Default destination (gitignored): `examples/.runs/crm-contacts`. Replace a previous run with `--force`.

Equivalent manual steps (sqlite): `create-ysk-app` thin saas sqlite `--no-admin --no-mobile --yes`, then `ysk-kit add module contact --prisma --web`, `ysk-kit add module follow-up --prisma --web`, copy this overlay, replace Prisma models `Contact` and `FollowUp`, `prisma db push`, seed.

## 6. Modules and capabilities, and why that order

`spec.json` lists `contact` then `follow-up`. Capabilities are empty. Add the parent module first so the child Prisma fragment can declare `contact Contact @relation(...)`.

`examples/crm-contacts/patches.json` rewires the memory harness so both services share one in-memory contact repository (HTTP tests create a contact then a follow-up).

## 7. Data model

**Contact** (status is a `String`, not a TypeScript `enum`):

| Field | Type | Rule |
|---|---|---|
| `name` | 1–80 | Required |
| `email` | email | Unique per `authorId` |
| `phone` / `company` | optional | Nullable in Prisma |
| `status` | `LEAD` \| `ACTIVE` \| `CHURNED` | Create starts at `LEAD` |

**Follow-up:** `contactId`, `dueAt` (ISO datetime), `note` (1–500).

Who can read/write: the signed-in user lists **their** rows.

## 8. Business rules

1. Duplicate email for the same author → `CONFLICT` (HTTP 409).
2. Invalid email → `VALIDATION_FAILED` (HTTP 422).
3. Follow-up whose `contactId` is missing or owned by someone else → `NOT_FOUND` (HTTP 404).
4. Missing session → `UNAUTHENTICATED` (HTTP 401).
5. `POST /v1/contact/:id/status` updates `LEAD` / `ACTIVE` / `CHURNED` for the owner.

## 9. Overlay files versus the generator defaults

The generator still uses `title` / `body`. The overlay replaces DTOs, contracts, services, repos, HTTP tests, Prisma fragments, SDK, web-sdk, both pages, and seed. `app.ts` and `router.tsx` stay as the CLI patched them.

## 10. Seed data

| Email | Password | Role | Contacts |
|---|---|---|---|
| `admin@ysk.hk` | `ysk-admin-dev` | ADMIN | Wong Mei Ling, `wong@ysk.hk`, `LEAD` |
| `user@ysk.hk` | `ysk-user-dev` | USER | none |

## 11. Start and sign in

```bash
cd ~/Projects/my-crm
pnpm dev
```

Open http://localhost:5173/login. Sign in as `user@ysk.hk` / `ysk-user-dev`. After login the app lands on `/users`. Open **Contact** in the nav.

## 12. UI walkthrough

![Empty list](screenshots/02-empty.png)

**Expected:** heading **Contacts**, empty state **No contacts**.

Enter name `Chan Tai Man` and email `not-an-email`, then Create.

![Invalid](screenshots/03-invalid.png)

**Expected:** an alert banner with a Zod email message.

Correct the email to `chan@ysk.hk`, add phone `+85291234567` and company `YSK Limited`, Create.

![Created](screenshots/04-created.png)

**Expected:** a row for Chan Tai Man, status `LEAD`.

Open **FollowUp**, choose Contact **Chan Tai Man**, note `Call back about the proposal`, Create.

![Follow-up](screenshots/06-follow-up.png)

**Expected:** the note appears in the follow-up table.

## 13. HTTP walkthrough

Base URL http://localhost:3001 (or **13001** during capture). Cookie/Bearer from `POST /v1/auth/login`.

**Expected** (`expected/create-ok.json`): HTTP **201**

```json
{
  "ok": true,
  "data": {
    "name": "Chan Tai Man",
    "email": "chan@ysk.hk",
    "phone": "+85291234567",
    "company": "YSK Limited",
    "status": "LEAD"
  }
}
```

Bad email → HTTP **422** `{ "ok": false, "error": { "code": "VALIDATION_FAILED" } }`.

Second POST with the same email → HTTP **409** `CONFLICT`.

Follow-up with an unknown `contactId` → HTTP **404** `NOT_FOUND`.

No `Authorization` → HTTP **401** `UNAUTHENTICATED`.

## 14. Scalar `/docs`

![Scalar docs](screenshots/05-docs.png)

**Expected:** Scalar lists `GET`/`POST /v1/contact` and `POST /v1/contact/{id}/status`. `GET /openapi.json` also lists `/v1/follow-up`.

## 15. Verify commands

Inside the destination:

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

**Expected:** all green. Contact tests cover duplicate email, follow-up ownership, and the HTTP envelopes above.

## 16. Out of scope

- Mounting `contact` on the living kit
- Pipelines, scoring, or email sending
- `ysk-kit add team` (see helpdesk-tickets)

## 17. Next example

Stock in / out (`inventory-stock`) is the next worked system in the [examples index](../README.md).
