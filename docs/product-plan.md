# Product direction

Language: [中文](product-plan.zh.md) · English

YSK Kit exists so a new product spends its first day on business rules, not on reinventing enums, HTTP envelopes, auth, or four client apps. Humans and AI agents follow the same path: scaffold thin, add a module, fill `application/` and Prisma, then verify with `pnpm layers`.

## What you can do today

| Area | Available now |
|---|---|
| Scaffold | `pnpm create @ysk-kit/app` or `create-ysk-app --preset thin\|full` (default thin) and six flavors. TTY prompts for omitted flags; `--yes` skips prompts |
| npmjs | Public `@ysk-kit/*` libraries and `@ysk-kit/create-app` 1.0.2 on [npmjs.com/org/ysk-kit](https://www.npmjs.com/org/ysk-kit). Dest products still use copy-tree + `ysk-kit upgrade` |
| Slice | `ysk-kit add module` writes contract, DTO, repos, Express + Fastify, SDK, web-sdk, page, test |
| Capabilities | Sixteen catalogued adds; `llm`, `team`, `billing`, `push` copy source when missing |
| Clients | Vite 8.3 web/admin with AppShell; Expo 57 mobile with organisation list and invite; Electron 44 desktop (Vite 7) |
| Data | `pnpm db:seed` upserts `admin@ysk.hk` and `user@ysk.hk` |
| Verify | `pnpm layers`, typecheck, Vitest (memory ports), Testing Library login, one Playwright smoke |
| Docs | Bilingual public manuals, CLI reference, agent skills, `AGENTS.md`. Ten worked examples in `examples/` |
| Guardrails | `.ysk-kit.json` records kit version, flavor, preset, and database. `ysk-kit upgrade` copies allowlisted law, skills, and compiler/lint config from a kit checkout |
| Agent scan | `ysk-kit check agent` flags TypeScript `enum`, Prisma in clients, and raw `fetch` in web/admin/mobile/desktop. Biome `noEnum` is error. CI runs the scan |

Fifteen-minute path:

```text
create-ysk-app my-clinic --flavor saas --preset thin --db mysql
ysk-kit add module appointment --prisma --web
pnpm db:migrate && pnpm db:seed && pnpm test && pnpm layers && pnpm dev
```

Result: `GET/POST /v1/appointments` in the envelope, SDK `client.appointments`, a web list+create page on the same Zod schema, a memory-repo test, and an OpenAPI path.

## Planned

First-wave public items are shipped in [v1.0.0](https://github.com/yanshekki/ysk-kit/releases/tag/v1.0.0). GitHub Packages is unused (GitHub owner is `yanshekki`). Leftovers stay in the table below.

## Outside the default stack

These stay out of the default so the kit remains one opinionated path:

| Choice | Reason |
|---|---|
| Hono, Nest, Next.js as default HTTP/SSR | Express + Fastify already cover adapter swapping; Next is a product decision for SEO/SSR apps |
| Drizzle as default ORM | Prisma is the hiring and migration default; domain ports allow a later adapter |
| tRPC or GraphQL as default | Public REST, webhooks, and non-TypeScript clients need OpenAPI |
| Kubernetes manifests | Compose + PM2 match local and single-host production; cluster charts belong in the product |
| Tax ID UI, metered billing | Stripe Checkout + org seats cover the common SaaS case |
| Electron installer / auto-update | Desktop is an API client template, not an app store pipeline |
| APNs or web push | Expo Push + FCM HTTP v1 cover the mobile template |

Industry domains (marketplace listings, exchange connectors, salon booking) belong in the product repository, not in this kit.
