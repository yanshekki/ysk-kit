---
name: ui-design
description: >
  Design and implement YSK Kit UI with existing tokens, @ysk-kit/ui, WCAG 2.2 AA,
  forms mapped from the API envelope, and no generic AI-slop chrome.
  Use when adding or changing web, admin, mobile, or desktop screens.
  中文：畫面、zinc、表單、可及性。
  Do not use for API-only changes or to invent a second component library.
---

Read `docs/skills/ui-design.md`. Law: `AGENTS.md`.

1. Reuse `@ysk-kit/ui` zinc tokens (`rounded-md`, `h-9`). No new palette.
2. Loading / empty / error / disabled. Forms: FormField + contracts Zod.
3. WCAG 2.2 AA, `zh-HK` length, no raw fetch. Then ui-review.
Gotcha: no purple gradients, no placeholder-as-label, no `div` buttons.
Verify: ui-review checklist, then verify-change.
Full steps: `docs/skills/ui-design.md`.
