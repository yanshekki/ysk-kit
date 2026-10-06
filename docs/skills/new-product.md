---
name: new-product
description: >
  Scaffold a product from YSK Kit with create-ysk-app (flavor, preset, database).
  Use when the user wants a new product, create-ysk-app, or /new-product.
---

# Skill: new product

Language: [中文](new-product.zh.md) · English

Scaffold a product from YSK Kit. Law: [AGENTS.md](../../AGENTS.md). Manual: [create-ysk-app](../cli/create-ysk-app.md). Intro: [getting started](../guides/getting-started.md).

## Trigger

- The user wants a new product repository, not a module inside this kit.
- The user says `create-ysk-app`, `pnpm create @ysk-kit/app`, or “new SaaS”.

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

## Steps

1. Choose flavor, database, and preset. Default is `--preset thin --db mysql --flavor saas`.
2. Run:

```bash
pnpm create @ysk-kit/app <name> --preset thin --db mysql --flavor saas
```

From a kit checkout: `pnpm --filter @ysk-kit/create-app start <name> --preset thin --db mysql --flavor saas`.

3. In the new directory: `pnpm install`, copy `.env.example` to `.env`, start Compose if the database is MySQL or PostgreSQL.
4. `pnpm db:generate && pnpm db:migrate && pnpm db:seed`.
5. Confirm agent pointers exist (`AGENTS.md`, `.agents/skills/`, `docs/plans/_template.md`, `.github/copilot-instructions.md`, `.gemini/settings.json`).
6. Add the first business resource with [add-module](add-module.md). Plan first when [plan-feature](plan-feature.md) requires it.
7. `pnpm gen:openapi` then `pnpm dev`.
8. Sign in as `admin@ysk.hk` / `ysk-admin-dev`.

`php-bridge` and `static-web3` skip migrate/seed; follow the generated README instead. Later, refresh kit guardrails with [upgrade](../guides/upgrade.md).

Ten worked product systems live in [`examples/`](../../examples/README.md). Apply them with `pnpm --filter @ysk-kit/examples start apply <slug> --yes`.

## Verification

- [ ] `.ysk-kit.json` records flavor, preset, db, and kit version
- [ ] `AGENTS.md` and `.agents/skills/add-module/SKILL.md` exist (workspace products)
- [ ] Seed login works on flavors that have an API

## Done criteria

The product directory is installable, guardrail files are present, and the first resource (if requested) follows [add-module](add-module.md).
