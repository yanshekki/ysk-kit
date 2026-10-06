# Tenancy and authorization

Language: [中文](tenancy.zh.md) · English

Parent: [security-review](../../security-review.md). ASVS 5.0 V8, especially V8.4.1 (cross-tenant controls at L2).

## Rule

Every use case that takes `organizationId` (or another tenant key) must verify **membership and role in `application/`**, then keep that tenant key on every repository query. Routers only parse the envelope.

## Template in this repo

`apps/api/src/modules/billing/application/billing-service.ts` → `requireBiller`:

1. `orgs.findById(organizationId)` → missing org → `NOT_FOUND` (do not leak whether the id exists to a stranger if the product prefers that; billing uses `NOT_FOUND` then `FORBIDDEN` on failed membership).
2. `orgs.findMembership(organizationId, userId)` + `orgRoleCan(role, 'org.billing')` from `@ysk-kit/contracts` → fail → `FORBIDDEN`.
3. Repositories keyed by `organizationId` (`findByOrganizationId`, never “all rows”).

Organizations module: `requireMember` / `requireOrg` in `organization-service.ts`. `orgRoleCan` permissions live in `packages/contracts/src/enums/org-role.ts`.

## Generated modules

`ysk-kit add module` scaffolds `authorId`, not `organizationId`. If the resource is org-scoped:

- Replace owner with `organizationId` in the Prisma model **and** the DTO.
- Check membership in `application/<name>-service.ts` before reads or writes.
- Memory and Prisma repositories both filter by org.
- Tests: actor in org A cannot read/write org B (`FORBIDDEN` or `NOT_FOUND`).

## Files and other owners

`createFileService` keys objects by `ownerId`. Listing or downloading another user’s `fileId` without an ownership check is IDOR. Same idea for API keys (`apps/api/src/modules/api-keys`).

## Error codes

| Situation | Code |
|---|---|
| Not signed in | `UNAUTHENTICATED` |
| Signed in, wrong tenant or role | `FORBIDDEN` |
| Hide existence from the caller | `NOT_FOUND` (product decision; record it in the plan) |
| Body fails Zod | `VALIDATION_FAILED` |

Do not authorize in Fastify/Express `register*Routes`. Domain stays free of HTTP.

## Memory-port tests (required)

In `application/*.test.ts` with `create-memory-input` / in-memory repos:

- Happy path for a member with the right role.
- Other organization’s user → `FORBIDDEN` or `NOT_FOUND`.
- Member without permission (e.g. `MEMBER` calling `org.billing`) → `FORBIDDEN`.
- Unauthenticated path covered at HTTP layer (`app.test.ts` + `app-fastify.test.ts`).

Do not boot Stripe or the database to prove tenancy.
