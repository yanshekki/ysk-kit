# Contracts package

Local notes for `@ysk-kit/contracts`. Root law: [AGENTS.md](../../AGENTS.md).

- This package is the only source of enums, DTOs, error codes, and ts-rest paths.
- Add DTO + `OkSchema` / `ErrSchema` before routers or handlers.
- No TypeScript `enum`. Use `as const` + Zod.
- Do not import apps, Prisma, Express, Fastify, React, or BullMQ.
- After path changes run `pnpm gen:openapi`. Still call paths through `@ysk-kit/sdk`.
