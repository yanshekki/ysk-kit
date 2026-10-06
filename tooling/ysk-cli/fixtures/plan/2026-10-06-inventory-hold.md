# Plan: Inventory Hold

Language: Chinese pair `2026-10-06-inventory-hold.zh.md` · English `2026-10-06-inventory-hold.md`

| | |
|---|---|
| **Slug** | `inventory-hold` |
| **Date** | 2026-10-06 |
| **Status** | draft |
| **Canonical file** | `docs/plans/2026-10-06-inventory-hold.md` |
| **Session pointer** | `/plan.md` (gitignored) |

Law: [AGENTS.md](../../../../AGENTS.md). Procedure: [plan-feature](../../../../docs/skills/plan-feature.md). Check: `pnpm ysk-kit plan --check docs/plans/2026-10-06-inventory-hold.md`.

## Goal and user problem

Staff need to reserve stock for an order without decrementing on-hand until pickup. The notes-shaped module has no hold quantity.

## Scope

- In: list and create holds for the signed-in user on `/v1/inventory-hold`

## Non-goals

- Out: warehouse transfers, barcode scanning, multi-warehouse stock

## Assumptions

- Product SKUs already live in a sibling inventory table that this slice will reference by id.
- Holds expire after 30 minutes unless the user said otherwise.

## Affected flavors / presets / capabilities

| Axis | Value | Notes |
|---|---|---|
| Flavor | kit itself | SaaS API + web |
| Preset | n/a | |
| Capabilities | auth | `requireAuth` on create |

## Current state and reuse

Reuse `ysk-kit add module inventory-hold --prisma --web`. Keep `parsePageQuery` from `@ysk-kit/application`. Do not invent a second HTTP adapter.

| Path | Symbol | Reuse as |
|---|---|---|
| `packages/contracts/src/errors.ts` | `FORBIDDEN` | authz miss |
| `packages/sdk/src/client.ts` | `YskClient` | new resource |
| `packages/web-sdk/src/` | query-key helpers | `inventory-hold-hooks.ts` |

## Options considered

| Option | Complexity | Layers | Migration | Clients | Notes |
|---|---|---|---|---|---|
| A: new hexagonal slice via `add module` | low | contracts, api, sdk, web | one Prisma model | web list/create | matches kit generators |
| B: column on an existing stock row | medium | existing module + clients | alter in place | every stock screen | couples holds to stock writes |

**Chosen:** A  
**Why:** A new resource keeps Prisma in a new infra folder and does not widen the stock DTO.

## Contracts first

DTO names, fields, error codes, and ts-rest paths. Add `OkSchema` / `ErrSchema` before handlers.

| Item | Name / path | Notes |
|---|---|---|
| DTO | `InventoryHoldDto` | id, skuId, qty, expiresAt |
| Command | `CreateInventoryHoldCommand` | skuId, qty |
| Error codes | reuse `VALIDATION_FAILED`, `UNAUTHORIZED` | no new code |
| Paths | `/v1/inventory-hold` | list + create |

## Data model / Prisma and migrations

Model `InventoryHold` with `skuId`, `qty`, `authorId`, `expiresAt`. Prisma stays in `apps/api/src/modules/inventory-hold/infra`. `pnpm db:migrate` is required.

## Module slices and layers

`apps/api/src/modules/inventory-hold/{domain,application,infra}` from the generator. Application enforces qty > 0 and expiry. No Express or Prisma in application.

## SDK / web-sdk / client surfaces

`packages/sdk/src/resources/inventory-hold.ts` list/create. `packages/web-sdk/src/inventory-hold-hooks.ts`. Vite page under `apps/web/src/features/inventory-hold/`. No raw `fetch`.

## Jobs / mail / realtime / notifications

none

## Security and privacy

`requireAuth` on create. List scoped to the caller. Do not log SKU payloads with secrets. No new envelope exception.

## Test plan

Memory-repo only: create hold, reject qty 0, list returns caller rows, envelope error codes.

- [ ] Memory-repo service cases for qty and expiry
- [ ] Envelope / error-code cases for unauthorized
- [ ] Client hooks only via SDK

## Verification commands

| Command | Expected result |
|---|---|
| `pnpm layers` | exit 0; clients stay off Express / Prisma / jobs / mail / push / AWS SDK |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | exit 0, including inventory-hold memory-repo tests |
| `pnpm gen:openapi` | `/v1/inventory-hold` present |
| `pnpm ysk-kit check agent` | prints `ysk-kit check agent: ok` |
| `pnpm ysk-kit plan --check docs/plans/2026-10-06-inventory-hold.md` | prints `ysk-kit plan --check: ok` |

### Manual checks

- [ ] UI flow: sign in, open Holds, create qty 1, table shows the row
- [ ] Envelope shape `{ ok: true, data }` / `{ ok: false, error }`
- [ ] Auth roles: anonymous create returns 401

## Docs / changelog / changeset

- [ ] Recipe unchanged; no skill edit
- [ ] No changelog (kit demo module only in the product)
- [ ] No changeset

## Risks and rollback

Expired holds could leak reserved qty. Rollback: revert the migration and unmount the generated slice.

## Task checklist

1. [ ] Contracts
   - **Files:** `packages/contracts/src/dto/inventory-hold.ts`, `packages/contracts/src/api/inventory-hold.ts`
   - **Interface / contract / data:** DTO + command + list/create paths
   - **Risk:** extra error code
   - **Rollback:** delete the two files
   - **Acceptance:** DTO + `OkSchema` / `ErrSchema` exist; no TypeScript `enum`
2. [ ] Scaffold
   - **Files:** generator output under `apps/api/src/modules/inventory-hold/`
   - **Interface / contract / data:** Prisma model merge
   - **Risk:** hand-made folders
   - **Rollback:** delete the slice
   - **Acceptance:** `ysk-kit add module inventory-hold --prisma --web`
3. [ ] Application rules
   - **Files:** `application/inventory-hold-service.ts`
   - **Interface / contract / data:** qty > 0, expiry 30m
   - **Risk:** writing Prisma in application
   - **Rollback:** revert the service
   - **Acceptance:** tests on memory ports pass
4. [ ] Clients
   - **Files:** sdk resource, web-sdk hooks, Vite page
   - **Interface / contract / data:** none beyond the contract
   - **Risk:** raw fetch
   - **Rollback:** delete the three client files
   - **Acceptance:** SDK / web-sdk only
5. [ ] Verify
   - **Files:** none extra
   - **Interface / contract / data:** OpenAPI path added
   - **Risk:** layers graph
   - **Rollback:** revert the commit
   - **Acceptance:** the verification table above is green
6. [ ] Docs
   - **Files:** this plan pair
   - **Interface / contract / data:** none
   - **Risk:** EN/zh drift
   - **Rollback:** delete the plan files
   - **Acceptance:** EN + zh pairs match

## Open questions

- Should expired holds auto-release via a job, or only on read?
