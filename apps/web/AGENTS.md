# Web client

Local notes for this client app. Root law: [AGENTS.md](../../AGENTS.md). The same rule applies to web, admin, mobile, and desktop.

- Call the API only through `@ysk-kit/sdk` (React Query via `@ysk-kit/web-sdk`).
- No raw `fetch` to kit paths. No `@prisma/client`, `@ysk-kit/db-prisma`, or `apps/api/src/generated`.
- Do not import `@ysk-kit/observability`, Express, Fastify, jobs, mail, push, or the AWS SDK.
- Screens: `docs/skills/ui-design.md`. Not done until `docs/skills/ui-review.md` is green.
