# Skill: new product

Language: [中文](new-product.zh.md) · English

Scaffold a product from YSK Kit. Law: [AGENTS.md](../../AGENTS.md). Manual: [create-ysk-app](../cli/create-ysk-app.md). Intro: [getting started](../guides/getting-started.md).

## Steps

1. Choose flavor, database, and preset. Default is `--preset thin --db mysql --flavor saas`. Agents pass those flags; do not wait for TTY prompts.
2. Run:

```bash
pnpm --filter @ysk-kit/create-app start <name> --preset thin --db mysql --flavor saas
```

3. In the new directory: `pnpm install`, copy `.env.example` to `.env`, start Compose if the database is MySQL or PostgreSQL.
4. `pnpm db:generate && pnpm db:migrate && pnpm db:seed`.
5. Add the first business resource with [add-module](add-module.md).
6. `pnpm gen:openapi` then `pnpm dev`.
7. Sign in as `admin@ysk.hk` / `ysk-admin-dev`.

Do not invent a parallel monorepo layout. Do not copy this kit by hand. `php-bridge` and `static-web3` skip migrate/seed; follow the generated README instead. Later, refresh kit guardrails with [upgrade](../guides/upgrade.md).

Ten worked product systems live in [`examples/`](../../examples/README.md). Apply them with `pnpm --filter @ysk-kit/examples start apply <slug> --yes` instead of inventing an industry module on the living kit.
