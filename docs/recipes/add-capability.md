# Add a capability

Language: [中文](add-capability.zh.md) · English

Restore or merge a catalogued platform feature. Law: [AGENTS.md](../../AGENTS.md). Catalogue: [capabilities](../guides/capabilities.md), [ysk-kit CLI](../cli/ysk-kit.md).

## When to use this

- The product was created with `--preset thin` and you now need llm, organisations, billing, or push.
- A flavor omitted a surface (no web) but you still want API-side jobs, mail, or API keys.
- You are aligning `.env.example` and Prisma fragments with the catalogue.

Do not use this for a new business resource. That is [add-module](add-module.md).

## Command

```bash
pnpm ysk-kit add team
pnpm ysk-kit add billing
pnpm ysk-kit add llm
pnpm ysk-kit add push
pnpm db:migrate
pnpm gen:openapi
pnpm layers && pnpm typecheck && pnpm test
```

`billing` requires `team` first (`model Organization`). The CLI throws otherwise.

## What happens

1. Merge Prisma fragment and User / Organization relation fields when listed in the catalogue.
2. Append missing keys to `.env.example`.
3. Add missing `apps/api` workspace dependencies.
4. For `llm`, `team`, `billing`, `push`: copy `tooling/ysk-cli/templates/capabilities/<name>/` unless `app.ts` or `composition.ts` already contains the skip token. `team` also copies Expo organisation screens when `apps/mobile` exists.
5. String-patch Express, Fastify, composition, main, SDK, web-sdk, web router, worker, and mobile org screens when the recipe defines a patch.

A second run is a no-op. This living repository already wires those services, so add prints “already part of the saas flavor” plus hints.

The command does not run `prisma migrate`. Run it yourself, then regenerate OpenAPI if routes changed.
