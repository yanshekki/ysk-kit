---
name: db-migration
description: >
  Apply Prisma 7.10 migrations in YSK Kit: review generated SQL, expand/contract
  for breaking changes, backfills, never migrate reset without explicit consent.
  Use when schema.prisma changes, after add-module --prisma or add <capability>
  with Prisma, or the user says migrate / rename column / backfill / reset.
  中文：資料庫遷移、改欄位、改名、回填、migrate reset。
  Do not use for Prisma 8 commands or for application rules with no schema change.
---

# Skill: database migration

Language: [中文](db-migration.zh.md) · English

Change Prisma schema without destroying data. Law: [AGENTS.md](../../AGENTS.md). Related: [add-module](add-module.md), [add-capability](add-capability.md). This repo pins **Prisma 7.10.0** (`apps/api/package.json`). Official Prisma docs may already describe Prisma 8 — **do not copy those commands**.

## Trigger

- `apps/api/prisma/schema.prisma` or `modules/*/prisma/*.prisma` changes.
- After `pnpm ysk-kit add module <name> --prisma` or `pnpm ysk-kit add <capability>` when a fragment merged.
- The user says migrate, rename a column, backfill, or `migrate reset`.
- `prisma migrate dev` asks to reset.

Do not use this skill for application-only rules, or to run Prisma 8 `prisma contract emit`, `prisma migration plan`, or `prisma db migrate`.

## Inputs

| Input | Required | Notes |
|---|---|---|
| Additive vs breaking | yes | See classification table |
| Database | no | Kit default MySQL; products may be PostgreSQL or SQLite |
| User consent | for destructive ops | Must be explicit in **this** turn |

## Prisma 7.10 commands (only these)

| Intent | Command |
|---|---|
| Create SQL without applying | `pnpm --filter @ysk-kit/api exec prisma migrate dev --create-only --name <snake_name>` |
| Apply locally (dev) | `pnpm db:migrate` (= `prisma migrate dev`) |
| Apply in CI / production | `pnpm --filter @ysk-kit/api prisma:migrate:deploy` (`prisma migrate deploy`) |
| Status | `pnpm --filter @ysk-kit/api exec prisma migrate status` |
| Validate schema | `pnpm --filter @ysk-kit/api exec prisma validate` |
| Diff (optional) | `pnpm --filter @ysk-kit/api exec prisma migrate diff --from-migrations apps/api/prisma/migrations --to-schema-datamodel apps/api/prisma/schema.prisma --shadow-database-url <url>` |
| Generate client | `pnpm db:generate` |

Do **not** use: `prisma db push` as a substitute for migrations; `migrate reset`; `db push --force-reset` / `--accept-data-loss`; Prisma 8 `contract.prisma` / `contract emit` / `migration plan` / `db migrate`.

## Classification

| Change | How |
|---|---|
| New table, new **nullable** column, new index | One additive migration |
| Rename, drop, type change, add `NOT NULL` to a populated column, tighten unique | Expand/contract: several migrations and deploys |

Expand/contract (Prisma data guide):

1. Add the new column/table (nullable / dual-write compatible).
2. Dual-write old and new in `infra/` (not in `application/` HTTP).
3. Backfill (SQL in a dedicated migration, batched if large).
4. Verify counts / checksums.
5. Switch reads to the new column.
6. Stop writing the old column.
7. Drop the old column in a later release.

Never rename-and-drop in the same production deploy.

## Steps

1. If the planning protocol applies, record the migration name, deploy count, and rollback in the plan’s data-model section.
2. Edit schema (or let `add module --prisma` merge a fragment). Keep Prisma enums in sync with `@ysk-kit/contracts` (`pnpm --filter @ysk-kit/db-prisma test` runs `assertPrismaEnumsMatchContracts`).
3. `pnpm --filter @ysk-kit/api exec prisma migrate dev --create-only --name <snake_name>`.
4. **Read** `apps/api/prisma/migrations/<timestamp>_<name>/migration.sql`. Alarm words: `DROP`, `RENAME`, `NOT NULL` without default, `ALTER ... TYPE`. Edit the SQL for backfills before applying.
5. Apply with `pnpm db:migrate` locally. Then `pnpm db:generate`.
6. Update **both** `infra/prisma-*-repository.ts` and `infra/memory-*-repository.ts`. Tests use memory ports; production uses Prisma — behaviour must match.
7. `pnpm db:seed` on a **dev** database only (upserts `admin@ysk.hk`). Do not seed production as a backfill.
8. [verify-change](verify-change.md).

## Destructive operations

`migrate reset`, `db push --accept-data-loss`, and dropping a populated table **require the human to consent in this conversation**, after you listed what will be deleted. Do not infer consent from an earlier turn. Do not set `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` yourself (Prisma’s agent-safety checkpoint).

Production and CI use **only** `prisma migrate deploy`. Never reset a shared or production database.

## Immutable history

Do not edit a migration that is already committed or deployed. Add a new migration. Do not change `apps/api/prisma/migrations/migration_lock.toml` `provider` to “fix” a flavor — `create-ysk-app --db` rewrites provider for new products.

## Rollback

Prisma 7 migrate has no automatic down. Rollback is a **forward** migration (restore column, copy data back) or restore from backup. Write that in the plan.

## Tests and CI

Unit tests must not start MySQL. Memory repositories cover behaviour. CI `e2e` runs `prisma:migrate:deploy` against the job’s MySQL. After schema change, commit the new directory under `apps/api/prisma/migrations/`.

## Verification

```bash
pnpm --filter @ysk-kit/api exec prisma validate
pnpm --filter @ysk-kit/api exec prisma migrate status
pnpm --filter @ysk-kit/db-prisma test
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

Expected: `The schema at … is valid.` / `Database schema is up to date!` (when the DB is migrated) / `ysk-kit check agent: ok`.

```bash
git status apps/api/prisma/migrations
```

- [ ] New migration directory is committed; SQL reviewed
- [ ] Memory repo matches Prisma repo
- [ ] Breaking changes split into expand/contract
- [ ] No reset without on-the-record consent

## Output format

```md
## Migration — <name>
Type: additive | expand/contract
SQL review: <drop/rename/not-null findings or "clean">
Deploys: <1 or N>
Rollback: <forward migration / backup>
Consent: <n/a | quoted user sentence>
```

## Done criteria

SQL reviewed, both repositories updated, enums match contracts, destructive ops either avoided or explicitly consented, five verify commands green.

## Anti-patterns

| Symptom | Do this instead |
|---|---|
| `db push` because it is faster | `migrate dev --create-only`, review, then migrate |
| One PR renames and drops | Expand/contract across deploys |
| Prisma repo updated, memory repo not | Tests stay green and production is wrong — update both |
| Edit an old `migration.sql` | New migration |
| Follow Prisma 8 docs | Pin 7.10 commands above |
| Reset to fix drift | Ask; dump what would be lost; wait |

## Escalate / ask

Ask before reset, data-loss flags, changing `migration_lock.toml` provider, or a breaking column change on a database that already has rows.

## Sources

- Prisma 7 “Customizing migrations” / expand and contract — <https://www.prisma.io/docs/orm/prisma-migrate/workflows/customizing-migrations>
- Prisma Data Guide expand-and-contract — <https://www.prisma.io/dataguide/types/relational/expand-and-contract-pattern>
- prisma/skills `prisma-cli` AI Safety Checkpoint (`migrate reset`, `db push --accept-data-loss`) — <https://github.com/prisma/skills>
