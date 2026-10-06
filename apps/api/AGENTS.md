# API app

Local notes for `apps/api`. Root law: [AGENTS.md](../../AGENTS.md).

- Prisma only in `src/modules/*/infra` and shared `src/infra`. Never from domain or application.
- Domain and application do not import Express, Fastify, Prisma, React, or BullMQ.
- JSON routes return `{ ok: true, data }` / `{ ok: false, error }`.
- Envelope exceptions stay listed in the root guide. Do not add one silently.
- Tests use in-memory ports. Do not start Redis, Stripe, Twilio, FCM, Jaeger, or Grafana.
