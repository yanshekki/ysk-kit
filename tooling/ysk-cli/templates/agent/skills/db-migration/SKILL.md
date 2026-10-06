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

Read `docs/skills/db-migration.md`. Law: `AGENTS.md`.

1. Pin Prisma 7.10: `migrate dev --create-only`, `migrate deploy`. No Prisma 8 CLI.
2. Read generated SQL. Breaking changes use expand/contract + backfill.
3. Update Prisma **and** memory repositories. Never `migrate reset` without this-turn consent.
Full steps: `docs/skills/db-migration.md`.
