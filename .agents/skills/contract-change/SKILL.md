---
name: contract-change
description: >
  Change YSK Kit contracts first: breaking-change table, gen:openapi diff
  (optional oasdiff), deprecation, new error codes, lockstep changeset bump.
  Use when editing packages/contracts, ts-rest paths, DTOs, error codes,
  OpenAPI, or a client-visible field.
  中文：合約、OpenAPI、破壞性變更、錯誤碼、changeset。
  Do not use for application-only rules with no DTO/path change, or for Prisma SQL (use db-migration).
---

Read `docs/skills/contract-change.md`. Law: `AGENTS.md`.

1. Classify additive vs breaking. Ask before dropping a published field.
2. Edit `@ysk-kit/contracts` first. `pnpm gen:openapi` then `git diff --exit-code docs/openapi.yaml`.
3. Lockstep changeset (all 26) + CHANGELOG. Optional `npx oasdiff`.
Gotcha: new error codes need ERROR_MESSAGE zh-HK+en and HTTP_STATUS.
Verify: `pnpm --filter @ysk-kit/contracts test && pnpm gen:openapi`
Full steps: `docs/skills/contract-change.md`.
