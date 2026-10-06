---
name: new-product
description: >
  Scaffold a product from YSK Kit with create-ysk-app (flavor, preset, database).
  Use when the user wants a new product, create-ysk-app, or /new-product.
  中文：開新產品、create-ysk-app、flavor、doctor。
  Do not use to add a module inside this kit (add-module) or to invent a parallel monorepo.
---

# Skill: new product

Language: [中文](new-product.zh.md) · English

Scaffold a product from YSK Kit. Law: [AGENTS.md](../../AGENTS.md). Manual: [create-ysk-app](../cli/create-ysk-app.md). Intro: [getting started](../guides/getting-started.md).

## Trigger

- The user wants a new product repository, not a module inside this kit.
- The user says `create-ysk-app`, `pnpm create @ysk-kit/app`, `npm create @ysk-kit/app`, or “new SaaS”.

Do not invent a parallel monorepo layout. Do not copy this kit by hand. Do not put the industry domain back into this kit.

## Inputs

| Input | Required | Default |
|---|---|---|
| Product name | yes | — |
| `--flavor` | no | `saas` |
| `--preset` | no | `thin` |
| `--db` | no | `mysql` |
| `--yes` | agents: yes | Skip TTY prompts |

Agents pass flags. Do not wait for TTY prompts.

## Flavor hint

| Need | Flavor |
|---|---|
| Public web + API, optional admin/mobile | `saas` (default) |
| Electron talks to the API | `desktop` |
| Machine clients + operator console | `gateway` |
| PHP/TS envelope client only | `php-bridge` |
| API + web, product owns market data | `trading` |
| Vite web, no Prisma | `static-web3` |

See [flavors](../guides/flavors.md). Agents pass `--flavor` / `--preset` / `--db`; do not wait for TTY.

## Steps

1. Choose flavor, database, and preset using the table. Default is `--preset thin --db mysql --flavor saas`.
2. Run:

```bash
pnpm create @ysk-kit/app <name> --preset thin --db mysql --flavor saas
# or: npm create @ysk-kit/app <name> --preset thin --db mysql --flavor saas
```

There is no unscoped `create-ysk-app` package on npm. From a kit checkout: `pnpm --filter @ysk-kit/create-app start <name> --preset thin --db mysql --flavor saas`.

3. In the new directory: `pnpm install`, copy `.env.example` to `.env`, start Compose if the database is MySQL or PostgreSQL.
4. `pnpm db:generate && pnpm db:migrate && pnpm db:seed`.
5. Confirm agent pointers exist (`AGENTS.md`, `.agents/skills/`, `docs/plans/_template.md`, `.github/copilot-instructions.md`, `.gemini/settings.json`).
6. Add the first business resource with [add-module](add-module.md). Plan first when [plan-feature](plan-feature.md) requires it.
7. `pnpm gen:openapi` then `pnpm dev`.
8. Sign in as `admin@ysk.hk` / `ysk-admin-dev`.
9. `pnpm ysk-kit doctor` (and `pnpm ysk-kit doctor --json` if you need a machine report). Exit 1 on `error` checks.

`php-bridge` and `static-web3` skip migrate/seed; follow the generated README instead. Later, refresh kit guardrails with [upgrade](../guides/upgrade.md).

## Human-filled fields

The scaffold leaves placeholders. A human must set these before production (agents must not invent secrets):

| Field | Where | Notes |
|---|---|---|
| `JWT_SECRET`, `DATABASE_URL` | `.env` (from `.env.example`) | `doctor` errors if missing on an API product |
| `CRYPTO_MASTER_KEY` | `.env` | 64 hex chars in production |
| Stripe / webhook secrets | `.env` | only if billing is on — then [webhook-handling](webhook-handling.md) |
| `LLM_API_KEY` / `XAI_API_KEY`, `LLM_SYSTEM_PROMPT` | `.env` | only if llm is on — then [llm-feature](llm-feature.md) |
| Push credentials | `.env` | FCM / Expo — only if push is on |
| EAS `projectId` | `apps/mobile/app.config.ts` `extra.eas.projectId` (starter is `replace-me`) and `apps/mobile/eas.json` submit | required to `eas build` / submit |
| iOS `bundleIdentifier` / Android `package` | `app.config.ts` | starter `hk.ysk.kit` — change per product |

Ten worked product systems live in [`examples/`](../../examples/README.md). Apply them with `pnpm --filter @ysk-kit/examples start apply <slug> --yes`.

## Verification

```bash
pnpm ysk-kit doctor
```

Expected: exit 0 (`ok` / `warn` only). `error` means env, engines, migrations, or guardrails.

- [ ] `.ysk-kit.json` records flavor, preset, db, and kit version
- [ ] `AGENTS.md` and `.agents/skills/add-module/SKILL.md` exist (workspace products)
- [ ] Seed login works on flavors that have an API
- [ ] Human-filled fields are listed for the owner (not invented by the agent)

## Output format

```md
## New product — <name>
Flavor / preset / db: …
Doctor: ok | FAIL (<check>)
Human still to fill: JWT_SECRET | eas projectId | …
First resource: add-module <kebab> | none
```

## Done criteria

The product directory is installable, `doctor` is not red, guardrail files are present, and the first resource (if requested) follows [add-module](add-module.md).

## Anti-patterns

| Symptom | Do this instead |
|---|---|
| Copy this kit by hand | `pnpm create @ysk-kit/app` |
| Wait for TTY prompts | Pass `--yes` and flags |
| Invent an `eas.json` projectId | Leave `replace-me`; tell the human |
| Put salon/trading domain back in this kit | Work in the dest product |

## Escalate / ask

Ask once if flavor/db/preset is missing and it changes the slice. Ask before production secrets or store identifiers.
