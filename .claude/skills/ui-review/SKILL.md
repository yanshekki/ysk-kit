---
name: ui-review
description: >
  QA checklist before declaring YSK Kit UI work done: visual, a11y, responsive,
  states, copy, performance — with Playwright, keyboard, and axe verification.
  Use when finishing a screen or when the user asks to review UI / UX / a11y.
  中文：UI 審查、鍵盤、375 視埠。
  Do not use to design the screen (ui-design) or to treat one screenshot as proof.
---

Read `docs/skills/ui-review.md`. Law: `AGENTS.md`.

1. Walk visual, a11y, states, copy. Fail if any required box is unchecked.
2. Keyboard-only on web/admin/desktop. Check 375 / 768 / 1280.
3. Exercise the flow (click, type, submit). Screenshot is not proof.
Gotcha: do not add axe or screenshot diffs to CI unless asked.
Verify: checklist + `pnpm e2e` when login/shell changed.
Full steps: `docs/skills/ui-review.md`.
