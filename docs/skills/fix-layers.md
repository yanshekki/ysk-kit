---
name: fix-layers
description: >
  Repair a pnpm layers (dependency-cruiser) failure without disabling hexagonal rules.
  Use when pnpm layers fails, a client imported Prisma, or /fix-layers.
---

# Skill: fix layers

Language: [中文](fix-layers.zh.md) · English

`pnpm layers` failed. Read [hexagonal](../guides/hexagonal.md) and `.dependency-cruiser.cjs`. Law: [AGENTS.md](../../AGENTS.md).

## Trigger

- `pnpm layers` exited non-zero.
- dependency-cruiser reported `clients-no-server-infra`, `domain-no-infra`, `api-no-react-ui`, `contracts-leaf`, or `sdk-ui-logic-no-node-react-prisma`.

## Inputs

| Input | Required | Notes |
|---|---|---|
| Cruiser rule name | yes | From the command output |
| Offending import | yes | File + specifier |

## Steps

1. Read the cruiser rule name.
2. Move the import. Do not disable the rule.
3. Typical repairs:
   - Client needed data → call `@ysk-kit/sdk` / `@ysk-kit/web-sdk`.
   - Application needed Prisma → inject a port; implement in `infra/`.
   - Domain imported a router → drop it.
   - Contracts imported an app → move the type into `@ysk-kit/contracts`.
4. Re-run `pnpm layers`.
5. Continue with [verify-change](verify-change.md).

## Verification

- [ ] `pnpm layers` is green
- [ ] No `forbidden` exception was added to `.dependency-cruiser.cjs` to hide the import

## Done criteria

The same behaviour exists, the import graph is legal, and [verify-change](verify-change.md) is green.
