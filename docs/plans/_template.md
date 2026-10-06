# Plan: {{title}}

Language: Chinese pair `{{date}}-{{slug}}.zh.md` · English `{{date}}-{{slug}}.md`

| | |
|---|---|
| **Slug** | `{{slug}}` |
| **Date** | {{date}} |
| **Status** | draft |
| **Canonical file** | `docs/plans/{{date}}-{{slug}}.md` |
| **Session pointer** | `/plan.md` (gitignored) |

Law: [AGENTS.md](../../AGENTS.md). Procedure: [plan-feature](../skills/plan-feature.md). Check: `pnpm ysk-kit plan --check docs/plans/{{date}}-{{slug}}.md`.

## Goal and user problem

What outcome the user needs, and why the current tree does not provide it.

## Scope

- In:

## Non-goals

- Out:

## Assumptions

Anything not verified in the tree or by the user. Do not guess silently. If it is still unresolved, put it under Open questions instead.

- 

## Affected flavors / presets / capabilities

| Axis | Value | Notes |
|---|---|---|
| Flavor | saas / desktop / gateway / trading / static-web3 / php-bridge / kit itself | |
| Preset | thin / full / n/a | |
| Capabilities | auth, team, billing, llm, push, … | |

## Current state and reuse

Explore the tree before proposing new files. List the relevant existing files and symbols with repo paths (modules, contracts, SDK resources, hooks, generators such as `ysk-kit add module`). Say what will be reused instead of written new.

| Path | Symbol | Reuse as |
|---|---|---|
| | | |

## Options considered

At least two viable approaches when a real alternative exists. Each row: tradeoffs for complexity, layers touched, migration risk, and client impact. Then the chosen option and why. For trivial single-path work: `single obvious approach — reason`.

| Option | Complexity | Layers | Migration | Clients | Notes |
|---|---|---|---|---|---|
| A | | | | | |
| B | | | | | |

**Chosen:**  
**Why:**

## Contracts first

DTO names, fields, error codes, and ts-rest paths. Add `OkSchema` / `ErrSchema` before handlers.

| Item | Name / path | Notes |
|---|---|---|
| DTO | | |
| Command | | |
| Error codes | reuse existing unless a new code is justified | |
| Paths | `/v1/…` | |

## Data model / Prisma and migrations

Models, fields, relations. Prisma stays in `apps/api/src/modules/*/infra`. Note whether `pnpm db:migrate` is required. Breaking column changes: [db-migration](../skills/db-migration.md) (expand/contract; no silent reset).

## Module slices and layers

Which `apps/api/src/modules/<name>/{domain,application,infra}` files change. Domain and application stay free of Express, Fastify, Prisma, React, and BullMQ.

## SDK / web-sdk / client surfaces

`packages/sdk` resources, `packages/web-sdk` hooks, and web / admin / mobile / desktop screens. No raw `fetch`. No Prisma in clients.

## Jobs / mail / realtime / notifications

Queue names, mail templates, socket events, in-app notifications — or “none”.

## Security and privacy

Authz (role / permission), rate limits, secrets (never log OTP, Stripe `sk_`, webhook secrets), personal data. Procedure: [security-review](../skills/security-review.md). Inbound webhooks: [webhook-handling](../skills/webhook-handling.md). Desktop main/preload: [desktop-electron](../skills/desktop-electron.md).

## Test plan

Fill with [test-plan](../skills/test-plan.md) (risk-ranked `given / when / then`, fixtures, out of scope, layer map). In-memory ports only. Do not start Redis, Stripe, Twilio, FCM, Jaeger, or Grafana.

- [ ] Memory-repo service cases
- [ ] Envelope / error-code cases
- [ ] Authz / tenancy / other-author cases when the resource is owned
- [ ] Client hooks only via SDK (if UI changed)
- [ ] Playwright / ui-review only when login, shell, or a user-visible path changed

## Verification commands

Each command has an expected result. Add or drop rows to match the change.

| Command | Expected result |
|---|---|
| `pnpm layers` | exit 0; clients stay off Express / Prisma / jobs / mail / push / AWS SDK |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | exit 0 |
| `pnpm gen:openapi` | `docs/openapi.yaml` matches the ts-rest contract |
| `pnpm ysk-kit check agent` | prints `ysk-kit check agent: ok` |
| `pnpm ysk-kit plan --check docs/plans/{{date}}-{{slug}}.md` | prints `ysk-kit plan --check: ok` |

Optional: `pnpm lint`. `pnpm e2e` when login or shell changed and ports 3001/5173 are free. On Grok Build: `grok inspect`.

### Manual checks

Omit this subsection only when there is no UI, HTTP, or authz change. Otherwise list the flows.

- [ ] UI flow:
- [ ] Envelope shape `{ ok: true, data }` / `{ ok: false, error }`
- [ ] Auth roles:

## Docs / changelog / changeset

- [ ] `docs/skills/` or recipe if the procedure changed
- [ ] `CHANGELOG.md` / `CHANGELOG.zh.md` and README latest-three window
- [ ] Changeset for publishable packages

## Risks and rollback

What can go wrong, and how to revert (migration down, revert commit, leave capability unmounted).

## Task checklist

Ordered. Each step names files to change, interface / contract / data changes, risk, rollback, and acceptance criteria.

1. [ ] Contracts
   - **Files:**
   - **Interface / contract / data:**
   - **Risk:**
   - **Rollback:**
   - **Acceptance:** DTO + `OkSchema` / `ErrSchema` exist; no TypeScript `enum`
2. [ ] Scaffold
   - **Files:**
   - **Interface / contract / data:**
   - **Risk:**
   - **Rollback:**
   - **Acceptance:** `ysk-kit add module` / `add <capability>` used when applicable
3. [ ] Application rules
   - **Files:**
   - **Interface / contract / data:**
   - **Risk:**
   - **Rollback:**
   - **Acceptance:** tests on memory ports pass
4. [ ] Clients
   - **Files:**
   - **Interface / contract / data:**
   - **Risk:**
   - **Rollback:**
   - **Acceptance:** SDK / web-sdk only
5. [ ] Verify
   - **Files:**
   - **Interface / contract / data:**
   - **Risk:**
   - **Rollback:**
   - **Acceptance:** the verification table above is green
6. [ ] Docs
   - **Files:**
   - **Interface / contract / data:**
   - **Risk:**
   - **Rollback:**
   - **Acceptance:** EN + zh pairs match

## Open questions

Unresolved items stay here. Do not fill them with guesses.

- 
