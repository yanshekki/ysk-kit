---
name: audit-slice
description: >
  Orchestrate a scoped Staff / Security / QA Architect review of a YSK Kit
  git diff or named module: architecture, dead-code candidates, performance,
  adversarial given/when/then, environment via doctor.
  Use when Staff review, full audit, 完整審查, 切片審計, 對抗性測試, dead-code,
  死碼, 效能, or a 9-part mega-prompt.
  中文：切片審計、Staff 審查、完整審查、對抗性測試、死碼、效能。
  Do not use to implement a feature (plan-feature), ordinary PR review
  (review-change), authz-only diffs (security-review), or to delete files /
  add Cypress/Jest.
---

Read `docs/skills/audit-slice.md`. Law: `AGENTS.md`.

1. Scope = git diff or a named module. Never a silent whole-tree kit saas audit.
2. Environment = `ysk-kit doctor` + engines + flavor. Do not install USB/Cypress/Jest/Python.
3. Dead code = candidates + risk (do not delete). Security → security-review + supply-scan; adversarial as given/when/then mapped to kit error codes (no PoC).
4. Emit test-plan headings; write Vitest only if the user asked. Performance: N+1, unbounded findMany, extra HTTP, bundle. No Redis without asking. Review ≠ merge.
Gotcha: Fastify twins, memory repos, and flavor stubs are not dead code.
Verify: 9-part report for the named slice; tree unchanged unless the user asked to implement tests.
Full steps: `docs/skills/audit-slice.md`.
