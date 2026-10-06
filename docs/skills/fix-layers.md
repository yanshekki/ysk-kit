---
name: fix-layers
description: >
  Repair a pnpm layers (dependency-cruiser) failure without disabling hexagonal rules.
  Use when pnpm layers fails, a client imported Prisma, or /fix-layers.
  中文：分層、dependency-cruiser、客戶端 Prisma。
  Do not use to edit .dependency-cruiser.cjs without explicit approval.
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
3. Apply the table. **Do not edit `.dependency-cruiser.cjs`** unless the user explicitly approved a rule change in this turn.

| Rule | Typical bad import | Correct fix |
|---|---|---|
| `clients-no-server-infra` | `apps/web` → `@prisma/client`, Express, jobs, mail, llm, `@ysk-kit/observability` | Call `@ysk-kit/sdk` / `@ysk-kit/web-sdk`. Keep Prisma in API `infra/` |
| `domain-no-infra` | `application/` or `domain/` → Prisma, Express, Fastify, BullMQ | Inject a port; implement in `infra/` |
| `api-no-react-ui` | `apps/api` → `react`, `@ysk-kit/ui`, `@ysk-kit/web-sdk` | Keep UI in apps/web\|admin; API returns envelope JSON |
| `contracts-leaf` | `packages/contracts` → sdk, apps, Prisma | Move the type into contracts; other packages import contracts |
| `sdk-ui-logic-no-node-react-prisma` | `packages/sdk` → `react`, `node:fs`, Prisma | Keep sdk fetch-based; UI in `@ysk-kit/ui` |

4. Re-run `pnpm layers`.
5. Continue with [verify-change](verify-change.md).

## Verification

- [ ] `pnpm layers` is green
- [ ] `.dependency-cruiser.cjs` is unchanged, or the user approved the rule edit in this turn

## Output format

```md
## Layers — <rule>
From: <file>
To: <specifier>
Fix: moved to <path> | injected port
Cruiser file: unchanged | edited (quoted approval)
```

## Done criteria

The same behaviour exists, the import graph is legal, the cruiser file was not silently edited, and [verify-change](verify-change.md) is green.

## Anti-patterns

| Symptom | Do this instead |
|---|---|
| Comment out a `forbidden` rule | Move the import |
| `doNotFollow` a folder to hide it | Fix the source |
| Client `fetch` to avoid Prisma import | SDK still required |

## Escalate / ask

Ask before any edit to `.dependency-cruiser.cjs`. Quote the user’s approval in the output.
