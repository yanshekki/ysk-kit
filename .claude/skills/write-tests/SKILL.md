---
name: write-tests
description: >
  Write professional YSK Kit tests: trophy per layer, in-memory ports, given/when/then,
  deterministic fixtures, envelope and authz cases, exact Vitest/Playwright commands.
  Use when adding tests, fixing a bug, or after test-plan.
  中文：寫測試、Vitest、Playwright、回歸。
  Do not use to plan cases (test-plan) or to start Redis/Stripe in CI.
---

Read `docs/skills/write-tests.md`. Law: `AGENTS.md`.

1. Put the case at the lowest layer that can fail it. Extend the generator test file.
2. given/when/then; envelope `ok` / `error.code`; other-tenant negative when owned.
3. Bug fixes: red regression test first. Express and Fastify for HTTP.
Gotcha: in-memory ports only. Never mock Prisma from a client.
Verify: `pnpm --filter @ysk-kit/<pkg> exec vitest run <file>`
Full steps: `docs/skills/write-tests.md`.
