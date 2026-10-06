---
applyTo: "**/*.test.ts,**/*.test.tsx,**/*.spec.ts,apps/web/e2e/**"
---

Follow `AGENTS.md`. Plan tests with `docs/skills/test-plan.md`. Write them with `docs/skills/write-tests.md`. Red CI: `docs/skills/debug-issue.md`. In-memory ports only. Assert the envelope. No Redis, Stripe, Twilio, FCM, Jaeger, or Grafana in unit tests.
