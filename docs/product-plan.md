# Product direction

Language: [中文](product-plan.zh.md) · English

YSK Kit exists so a new product spends its first day on business rules, not on reinventing enums, HTTP envelopes, auth, or four client apps. Humans and AI agents follow the same path: scaffold thin, add a module, fill `application/` and Prisma, then verify with `pnpm layers`.

## What you can do today

| Area | Available now |
|---|---|
| Scaffold | `create-ysk-app --preset thin\|full` (default thin) and six flavors. TTY prompts for omitted flags; `--yes` skips prompts |
| Slice | `ysk add module` writes contract, DTO, repos, Express + Fastify, SDK, web-sdk, page, test |
| Capabilities | Sixteen catalogued adds; `llm`, `team`, `billing`, `push` copy source when missing |
| Clients | Vite 8 web/admin with AppShell; Expo mobile with organisation list and invite; Electron desktop |
| Data | `pnpm db:seed` upserts `admin@ysk.hk` and `user@ysk.hk` |
| Verify | `pnpm layers`, typecheck, Vitest (memory ports), Testing Library login, one Playwright smoke |
| Docs | Bilingual public manuals, CLI reference, agent skills, `AGENTS.md` |
| Guardrails | `.ysk-kit.json` records kit version, flavor, preset, and database. `ysk upgrade` copies allowlisted law, skills, and compiler/lint config from a kit checkout |
| Agent scan | `ysk check agent` flags TypeScript `enum`, Prisma in clients, and raw `fetch` in web/admin/mobile/desktop. Biome `noEnum` is error. CI runs the scan |

Fifteen-minute path:

```text
create-ysk-app my-clinic --flavor saas --preset thin --db mysql
ysk add module appointment --prisma --web
pnpm db:migrate && pnpm db:seed && pnpm test && pnpm layers && pnpm dev
```

Result: `GET/POST /v1/appointments` in the envelope, SDK `client.appointments`, a web list+create page on the same Zod schema, a memory-repo test, and an OpenAPI path.

## Planned

| Work | Why |
|---|---|
| GitHub Packages when the owner matches `@ysk` | Publishable libraries already set `publishConfig`. The registry path is usable when the GitHub owner matches the npm scope. Daily refresh uses `ysk upgrade`. |

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
