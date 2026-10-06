---
applyTo: "apps/api/**"
---

Follow `AGENTS.md`. Prisma stays in `src/modules/*/infra`. Domain and application do not import Express, Fastify, Prisma, React, or BullMQ. JSON uses `{ ok: true, data }` / `{ ok: false, error }`. LLM product features: `docs/skills/llm-feature.md`. Schema: `docs/skills/db-migration.md`.
