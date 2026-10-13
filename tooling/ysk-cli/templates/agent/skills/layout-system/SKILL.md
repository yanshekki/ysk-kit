---
name: layout-system
description: >
  Design predictable layout inside existing zinc + @ysk-kit/ui: ASCII wireframe,
  AppShell, grid, alignment, 375/768/1280, zh-HK width. Use when adding a shell,
  dashboard columns, nav/sidebar, list+detail, or multi-column form.
  中文：版面系統、殼、分欄、閱讀順序、響應式結構。
  Do not use to change the palette, invent a second component library, or for
  API-only work (use ui-design for components; ui-review when finishing).
---

Read `docs/skills/layout-system.md`. Law: `AGENTS.md`.

1. ASCII wireframe (desktop + 375): grouping and reading order.
2. AppShell + PageHeader; sidebar vs top-nav; 1-col max-w-4xl or md:grid-cols-2.
3. Rhythm space-y-4|6; numbers right, text left; zh-HK 1.5× width; then ui-design.
Gotcha: no hero/gradient, no card-in-card, no DOM @ysk-kit/ui on mobile.
Verify: 375/768/1280 clean, then ui-review visual+responsive.
Full steps: `docs/skills/layout-system.md`.
