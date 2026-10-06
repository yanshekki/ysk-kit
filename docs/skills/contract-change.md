---
name: contract-change
description: >
  Change YSK Kit contracts first: breaking-change table, gen:openapi diff
  (optional oasdiff), deprecation, new error codes, lockstep changeset bump.
  Use when editing packages/contracts, ts-rest paths, DTOs, error codes,
  OpenAPI, or a client-visible field. 中文：合約、OpenAPI、破壞性變更、錯誤碼、changeset。
  Do not use for application-only rules with no DTO/path change, or for Prisma
  SQL (use db-migration).
---

# Skill: contract change

Language: [中文](contract-change.zh.md) · English

`@ysk-kit/contracts` is the only source of enums, DTOs, error codes, and ts-rest paths. Law: [AGENTS.md](../../AGENTS.md). Related: [envelope-api](envelope-api.md), [add-module](add-module.md), [db-migration](db-migration.md).

## Trigger

- Edits under `packages/contracts/**`.
- New or renamed `/v1/…` path, DTO field, error code, or enum value.
- `pnpm gen:openapi` would change `docs/openapi.yaml`.

Do not use for application rules that keep the same DTO, or for Prisma SQL ([db-migration](db-migration.md)).

## Inputs

| Input | Required | Notes |
|---|---|---|
| Change class | yes | Additive / deprecating / breaking (table below) |
| Consumers | yes | SDK, web-sdk, OpenAPI, PHP bridge, examples |
| Bump | yes | Lockstep: one of `patch` / `minor` / `major` on **all 26** public packages |

## Breaking-change decision

| Change | Breaking for published SDK? | Bump (lockstep) | Deprecation |
|---|---|---|---|
| New optional DTO field, new path, new error code | no | `patch` | n/a |
| New required field on an existing command | yes | `minor` | Prefer optional + default for one release |
| Remove or rename a field / path / enum value | yes | `minor` (kit is pre-2.0; still lockstep) | Keep the old name one release; document in CHANGELOG |
| Tighten Zod (shorter max, fewer enum members) | yes | `minor` | Dual-parse old payloads if clients are in the wild |
| Loosen Zod (longer max, extra enum member) | no | `patch` | n/a |
| New envelope exception | **ask first** | n/a until approved | Document next to the four exceptions |

Ask the user before a breaking contract change (AGENTS.md). Do not silently drop a field.

## Steps

1. Classify the change with the table. If breaking, stop and ask unless the user already approved it.
2. Edit `@ysk-kit/contracts` **first**: DTO, `as const` + Zod (no TypeScript `enum`), `OkSchema` / `ErrSchema`, ts-rest path. New error codes go in `packages/contracts/src/errors/codes.ts` **and** `ERROR_MESSAGE` (`zh-HK` + `en`) in `messages.ts`. `AppError` HTTP status lives in `packages/domain-kernel/src/index.ts` `HTTP_STATUS`.
3. Update SDK resource / web-sdk hooks / capability templates so they byte-match living trees when the file is templated.
4. `pnpm gen:openapi`. Then:

   ```bash
   git diff --exit-code docs/openapi.yaml
   ```

   A silent no-op after a path change is a failed change. Commit the YAML with the DTO.
5. Optional OpenAPI semantic diff (not a workspace dependency):

   ```bash
   npx --yes oasdiff diff origin/main:docs/openapi.yaml docs/openapi.yaml
   ```

   Skip if `npx` is unavailable. Treat `oasdiff` output as a review aid, not a CI gate.
6. Changelog: one bullet under the current version, category that matches (usually Fixes or New features). README three-version window. Patch/minor/major changeset listing **all 26** public `@ysk-kit` packages (lockstep test).
7. [verify-change](verify-change.md). Call new paths only through `@ysk-kit/sdk`.

## Deprecation

Keep the old field or path for one published version. Mark it in CHANGELOG. Do not generate a second DTO tree. Dual-read in `application/` if old clients still send the previous shape.

## Verification

```bash
pnpm --filter @ysk-kit/contracts test
pnpm gen:openapi
git diff --exit-code docs/openapi.yaml
pnpm layers && pnpm typecheck && pnpm test && pnpm ysk-kit check agent
```

Expected: contract tests green; OpenAPI committed; `ysk-kit check agent: ok`.

- [ ] DTO landed before handlers and clients
- [ ] No TypeScript `enum`
- [ ] `ERROR_MESSAGE` has `zh-HK` and `en` when a code was added
- [ ] Lockstep changeset lists all 26 names at one bump type

## Output format

```md
## Contract change — <path or DTO>
Class: additive | deprecating | breaking
Bump: patch | minor | major (all 26)
OpenAPI: gen:openapi + git diff (oasdiff: ran | skipped)
Deprecation: n/a | keep <old> until vX.Y.Z
Error codes: <none | CODE → HTTP>
Consumers: SDK / web-sdk / templates / examples
```

## Done criteria

Contracts first, OpenAPI updated, bump and changelog recorded, five verify commands green. Breaking changes have written user approval.

## Anti-patterns

| Symptom | Do this instead |
|---|---|
| Client-only TypeScript type for an API field | Add the Zod DTO in contracts |
| `enum Foo {}` | `as const` + `z.enum` |
| New error string in a handler | Reuse a code or add `ERROR_MESSAGE` + `HTTP_STATUS` |
| OpenAPI edited by hand | `pnpm gen:openapi` |
| Changeset for one package | All 26 at one bump type |
| Drop a field in the same release clients use | Deprecate one version |

## Escalate / ask

Ask before removing a published field or path, adding an envelope exception, or choosing `major`.

## Sources

- OpenAPI Initiative — <https://spec.openapis.org/oas/latest.html>
- oasdiff (optional CLI) — <https://github.com/tufin/oasdiff>
- Changesets versioning — <https://github.com/changesets/changesets>
- ts-rest contracts as source of truth — [architecture](../architecture.md)
