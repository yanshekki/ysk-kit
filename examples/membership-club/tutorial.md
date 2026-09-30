# Membership club

Language: [中文](tutorial.zh.md) · English

A thin SaaS product that stores one member profile per organization and shows org billing. Capabilities are `team` then `billing` (apply already sorts that order).

Screenshots below are 1280×800, captured against an applied destination (API **13001**, web **15173**).

## 1. What you get

After you finish:

- A new product directory with `--preset thin` identity, files, notifications, jobs, mail, API keys, crypto, and realtime.
- Organizations from `ysk add team`: nav **Orgs**, heading **Organizations**, form label **Name**, button **Create**.
- Billing from `ysk add billing`: org detail has a **Billing** link for OWNER/ADMIN. Plans **Free** and **Pro**. Do **not** click Checkout (it calls `window.location.assign`).
- Module `member-profile` at `GET/POST /v1/member-profile`. List is the author’s profiles. Unique per `(authorId, organizationId)`.
- Web page `/member-profile` (nav **MemberProfile**): organization `<select>` and Display name. Empty **No member profiles**.
- Seed accounts only. The walker creates **Harbour Club** so the signed-in user is OWNER.

![Sign in](screenshots/01-login.png)

**Expected:** the Sign in form. Title **Sign in**.

## 2. Who it is for, and how long it takes

Clubs, associations, and any “named membership inside an org that can subscribe”. About **25–35 minutes** the first time.

## 3. Prerequisites

- **Node 24** and **pnpm 12**
- A checkout of this kit
- Optional: Docker MySQL 8.4 if you override `--db mysql`

## 4. Why this flavor, preset, and database

| Choice | Value | Why |
|---|---|---|
| Flavor | `saas` | Web + API |
| Preset | `thin` | Fifteen-minute path. Team and billing are added from `spec.json` |
| Database | sqlite in `spec.json` | No Docker. Pass `--db mysql` for Compose |
| Admin / mobile | off | Desktop web is enough |

Industry membership does **not** mount on the living kit API.

## 5. Scaffold commands

```bash
pnpm --filter @ysk/examples start apply membership-club --dest ~/Projects/my-club --yes
```

Default destination (gitignored): `examples/.runs/membership-club`. Replace a previous run with `--force`.

Equivalent manual steps (sqlite): `create-ysk-app` thin saas sqlite `--no-admin --no-mobile --yes`, then `ysk add team`, `ysk add billing`, `ysk add module member-profile --prisma --web`, copy this overlay, replace Prisma model `MemberProfile`, apply `patches.json`, `prisma db push`, seed.

## 6. Modules and capabilities, and why that order

`spec.json` lists `team` then `billing`, then module `member-profile`. Apply already sorts team before billing. Team must exist before billing (orgs and memberships). The industry module comes last.

`examples/membership-club/patches.json` rewires the memory harness so `createMemoryMemberProfileRepository(orgs)` reads the same memberships as `organizationService`. HTTP tests create an org then a profile in one `createApp()`.

## 7. Data model

**MemberProfile** (no TypeScript `enum`; no Prisma relation to Organization):

| Field | Type | Rule |
|---|---|---|
| `displayName` | 1–80 | Required |
| `organizationId` | UUID | Org the profile belongs to |
| `authorId` | UUID | Signed-in user |
| unique | `(authorId, organizationId)` | Duplicate → `CONFLICT` |

Who can read/write: the signed-in user lists **their** profiles. Create requires membership in that org.

## 8. Business rules

1. Non-member create → `FORBIDDEN` (HTTP 403), not `NOT_FOUND`.
2. Second profile for the same author and org → `CONFLICT` (HTTP 409).
3. Empty `displayName` → `VALIDATION_FAILED` (HTTP 422).
4. Missing session → `UNAUTHENTICATED` (HTTP 401).
5. List does not require `organizationId`; it returns the author’s rows.

Membership lookup matches helpdesk-tickets: Prisma `membership.findUnique` on `organizationId_userId`; memory repo accepts the org repository or `seedMembership`.

## 9. Overlay files versus the generator defaults

The generator still uses `title` / `body`. The overlay replaces DTOs, contracts, services, repos, HTTP tests, Prisma fragment, SDK, web-sdk, the page, and seed. `app.ts` and `router.tsx` stay as the CLI patched them (nav **MemberProfile**, path `/member-profile`).

## 10. Seed data

| Email | Password | Role | Orgs / profiles |
|---|---|---|---|
| `admin@ysk.hk` | `ysk-admin-dev` | ADMIN | none |
| `user@ysk.hk` | `ysk-user-dev` | USER | none |

## 11. Start and sign in

```bash
cd ~/Projects/my-club
pnpm dev
```

Open http://localhost:5173/login. Sign in as `user@ysk.hk` / `ysk-user-dev`. After login the app lands on `/users`. Open **Orgs** in the nav.

## 12. UI walkthrough

Create organization **Name** `Harbour Club`, **Create**, wait for the table text.

Click the **Harbour Club** link in the table (org detail). Owners see **Billing**. Click **Billing**.

![Billing](screenshots/06-billing.png)

**Expected:** heading **Billing**, plan names **Free** and **Pro**. Do not click **Checkout Pro**.

Open `/member-profile` (nav **MemberProfile**).

![Empty list](screenshots/02-empty.png)

**Expected:** heading **Member profiles**, empty state **No member profiles**.

Choose Organization **Harbour Club**, leave Display name empty, Create.

![Invalid](screenshots/03-invalid.png)

**Expected:** an alert banner.

Set Display name to `Harbour Member`, Create.

![Created](screenshots/04-created.png)

**Expected:** a row for **Harbour Member**.

## 13. HTTP walkthrough

Base URL http://localhost:3001 (or **13001** during capture). Cookie/Bearer from `POST /v1/auth/login`. Create an org first.

**Expected** (`expected/create-ok.json`): HTTP **201**

```json
{
  "ok": true,
  "data": {
    "displayName": "Harbour Member"
  }
}
```

Empty displayName → HTTP **422** `{ "ok": false, "error": { "code": "VALIDATION_FAILED" } }`.

Second POST for the same author and org → HTTP **409** `CONFLICT`.

A second user posting to that org → HTTP **403** `FORBIDDEN`.

No `Authorization` → HTTP **401** `UNAUTHENTICATED`.

Log billing adapter (default when Stripe keys are unset) returns the checkout URL in `expected/checkout-log.json`:

```json
{
  "ok": true,
  "data": {
    "url": "https://billing.local/checkout?plan=pro&seats=1"
  }
}
```

Do not click Checkout in the UI; billing HTTP tests already cover the route from `ysk add billing`.

## 14. Scalar `/docs`

![Scalar docs](screenshots/05-docs.png)

**Expected:** Scalar lists `GET`/`POST /v1/member-profile`. `GET /openapi.json` also lists `/v1/organizations` and `/v1/billing/plans`.

## 15. Verify commands

Inside the destination:

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk check agent
```

**Expected:** all green. Member-profile tests cover membership, duplicate, and the HTTP envelopes above. Billing tests from `ysk add billing` stay in the dest.

## 16. Out of scope

- Mounting `member-profile` on the living kit
- Live Stripe checkout or customer portal
- Push / mobile (see field-work-orders)

## 17. Next example

Course enrolment (`course-enrollment`) is the next worked system in the [examples index](../README.md).
