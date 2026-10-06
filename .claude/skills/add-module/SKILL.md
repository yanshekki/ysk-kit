---
name: add-module
description: >
  Add a hexagonal HTTP module with ysk-kit add module (contract, DTO, Express+Fastify, SDK, web page).
  Use when the user wants a new resource, new API route, ysk-kit add module, or /add-module.
  中文：加模組、HTTP 切片、org 範圍、Express 與 Fastify 測試。
  Do not use to mkdir apps/api/src/modules by hand or to restore llm/team/billing/push (add-capability).
---

Read `docs/skills/add-module.md`. Law: `AGENTS.md`.

1. `pnpm ysk-kit add module <kebab> --prisma --web`. Do not mkdir the slice.
2. Fill DTO then `application/` rules. Schema → db-migration. Org-scoped: requireBiller + negative test.
3. App tests on Express AND Fastify. Then verify-change.
Gotcha: no parallel tree; no TypeScript enum; clients use the SDK only.
Verify: `pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent`
Full steps: `docs/skills/add-module.md`.
