---
name: test-plan
description: >
  Produce a risk-ranked YSK Kit test plan (given/when/then, fixtures, out of scope)
  mapped to contract, memory-port, API, SDK, client, and Playwright layers.
  Use when the user asks how to test a feature, what cases to cover, or for a QA
  checklist before writing tests or shipping.
  中文：測試計劃、風險、given/when/then。
  Do not use for comment-only edits or to write the tests themselves (write-tests).
---

Read `docs/skills/test-plan.md`. Law: `AGENTS.md`.

1. Restate the change. Rank data loss, auth, money, tenancy, secrets first.
2. Map each risk to a layer and file. Write given/when/then cases.
3. Name in-memory fixtures and explicit out of scope. Then write-tests.
Gotcha: do not start Redis or Stripe to plan tests. E2E stays thin.
Verify: every case has layer + file; out of scope is written.
Full steps: `docs/skills/test-plan.md`.
