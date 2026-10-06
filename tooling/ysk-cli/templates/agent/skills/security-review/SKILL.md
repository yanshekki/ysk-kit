---
name: security-review
description: >
  Review YSK Kit authz, tenant isolation, secrets, logging redaction, token
  storage, webhook signatures, and LLM input against hexagonal modules and
  the {ok,data}/{ok,error} envelope. Optional lightweight threat-model mode.
  Use when the user asks for a security review or audit; the diff touches
  auth, apikey, organizations, billing, files, crypto, webhooks, env/secrets,
  or a new capability; or the plan's security section is not "none".
  中文：安全審查、權限、跨租戶、密鑰、日誌遮罩、webhook 簽名。
  Do not use for pure UI styling, docs typos, or generic dependency bumps.
---

Read `docs/skills/security-review.md`. Law: `AGENTS.md`.

1. Diff is the report scope; the repo is research. HIGH confidence only.
2. AuthZ in `application/` (membership + role). Cross-tenant memory tests.
3. No secrets in logs. Webhook signatures. Client token stores.
4. Threat-model sub-mode only when the user asks or a new trust boundary lands.
Full steps: `docs/skills/security-review.md`.
