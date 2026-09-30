# Skill: verify a change

Language: [中文](verify-change.zh.md) · English

Run after every feature. Law: [AGENTS.md](../../AGENTS.md). Testing: [testing guide](../guides/testing.md).

## Steps

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk check agent
```

All five must succeed. `pnpm layers` catching a client → Prisma import is a failed change, not a warning. `pnpm ysk check agent` catching a TypeScript `enum`, a client Prisma import, or raw `fetch` in web/admin/mobile/desktop is a failed change.

Optional:

- `pnpm lint`
- `pnpm e2e` when the login or shell path changed and ports 3001/5173 are free
- Open `GET /docs` and confirm new paths after `gen:openapi`

Do not start Redis, Stripe, Twilio, FCM, Jaeger, or Grafana to make unit tests pass.
