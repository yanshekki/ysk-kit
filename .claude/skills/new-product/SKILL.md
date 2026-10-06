---
name: new-product
description: >
  Scaffold a product from YSK Kit with create-ysk-app (flavor, preset, database).
  Use when the user wants a new product, create-ysk-app, or /new-product.
  中文：開新產品、create-ysk-app、flavor、doctor。
  Do not use to add a module inside this kit (add-module) or to invent a parallel monorepo.
---

Read `docs/skills/new-product.md`. Law: `AGENTS.md`.

1. Pick flavor (saas default; desktop / gateway / php-bridge / trading / static-web3).
2. `pnpm create @ysk-kit/app <name> --preset thin --db mysql --flavor saas --yes`.
3. migrate/seed when the flavor has an API. Run `pnpm ysk-kit doctor`.
Gotcha: leave `eas.json` / `app.config.ts` projectId as `replace-me` for a human.
Verify: `pnpm ysk-kit doctor`
Full steps: `docs/skills/new-product.md`.
