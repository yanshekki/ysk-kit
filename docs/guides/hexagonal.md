# Hexagonal layers

Language: [中文](hexagonal.zh.md) · English

Each HTTP feature is a bounded context with three folders. Identity is the reference: `apps/api/src/modules/identity/`.

```
apps/api/src/modules/identity/
  domain/         entities + repository / sender ports
  application/    auth-service, user-service
  infra/          prisma + memory repos, HTTP routers, Twilio adapter
```

`apps/api/src/composition.ts` is the only place that constructs adapters and injects them into services. `apps/api/src/app.ts` (Express) and `app-fastify.ts` register routes. Tests build the same services with memory ports via `create-memory-input.ts`.

## Dependency direction

```
HTTP adapter → application → domain ports
                    ▲
                    │ implements
                  infra
```

| Layer | May import | Must not import |
|---|---|---|
| domain | `@ysk/domain-kernel`, `@ysk/contracts` | Express, Fastify, Prisma, React, BullMQ |
| application | domain, contracts | Prisma, HTTP frameworks, React |
| infra | everything needed to implement a port | React, `@ysk/ui` |
| web / admin / mobile / desktop | `@ysk/sdk`, `@ysk/web-sdk`, `@ysk/ui`, `@ysk/contracts` | Prisma, Express, Fastify, `@ysk/auth`, jobs, mail, push, AWS SDK, `@ysk/observability` |

`pnpm layers` runs dependency-cruiser (`.dependency-cruiser.cjs`). Typical failures:

- A Vite page imports `@prisma/client` or `apps/api/src/generated`.
- A domain file imports `infra/`.
- Contracts import `@ysk/sdk`.

Fix by moving the import to the correct layer, not by weakening the rule. Procedure: [fix-layers skill](../skills/fix-layers.md).

## Adding a feature

Do not invent a fourth folder. Run `pnpm ysk add module <kebab> --prisma --web`, then:

1. Extend the DTO and command in `@ysk/contracts`.
2. Put invariants in `application/<name>-service.ts`.
3. Implement persistence only in `infra/prisma-*-repository.ts`.
4. Keep the memory repository in sync so Vitest stays off MySQL.

Walkthrough: [add-module recipe](../recipes/add-module.md).
