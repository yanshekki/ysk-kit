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

# Skill: layout system

Language: [中文](layout-system.zh.md) · English

Predictable structure inside the existing zinc theme and `@ysk-kit/ui`. Do not redesign the brand. Law: [AGENTS.md](../../AGENTS.md). Implement components with [ui-design](ui-design.md). Finish with [ui-review](ui-review.md).

## Trigger

- New or changed shell, dashboard columns, sidebar vs top-nav, list+detail, or a multi-column form.
- The user says “layout”, “排版”, “reading order”, or “responsive structure”.
- A plan’s UI section still has no wireframe.

Do not use to pick a new palette, add dark mode, or invent a second component library. Do not use for API-only changes. Copy-only i18n is not this skill.

## Inputs

| Input | Required | Notes |
|---|---|---|
| Surface | yes | `web` \| `admin` \| `mobile` \| `desktop` |
| Density | yes | `comfortable` (public web) or `compact` (admin tables) |
| Nav pattern | yes | sidebar (prefer for admin) or top-nav (prefer for public web) |

## Steps

1. **ASCII wireframe** for desktop (1280) and 375. Mark grouping and reading order (F-pattern: brand → primary nav → page title → primary action → body). Put the wireframe in the dated plan or the PR. Example:

   ```text
   [ AppShell: brand | nav ........ trailing ]
   [ PageHeader: title              primary ]
   [ main max-w-4xl
     [ filters ]
     [ table / form  ]
   ]
   375: brand
        nav (stack or menu)
        title
        primary (full width, wrap)
        single column
   ```

2. **Kit shell.** Use `AppShell` + `PageHeader`. Admin: sidebar (or the existing admin top-nav — do not invent a third chrome). Public web: top-nav. Desktop matches web. Mobile: React Native navigation (HIG / Material); do not import DOM `@ysk-kit/ui`.

3. **Grid.** Prefer one column `mx-auto max-w-4xl px-4`. When two regions share a row, `md:grid-cols-2` or a 12-column `grid` with `gap-4` / `gap-6` / `gap-8` (Tailwind 4 / 6 / 8). No three equal columns unless one is clearly primary. Gutters stay on the spacing scale.

4. **Alignment and rhythm.** Stack with `space-y-4` or `space-y-6`. Labels above fields, not a ragged baseline. Tables: text left, numbers (money, counts) right. `PageHeader` actions already `flex-wrap`.

5. **Responsive.** 375: single column, actions wrap, no horizontal scroll except tables. 768: two columns allowed. 1280: keep `max-w-4xl` (do not stretch a form to the full viewport). Verify all three widths.

6. **CJK / zh-HK.** Buttons, nav, and table headers need about **1.5×** the English width. Do not fix `width` in `px` for labels. Use `flex-wrap`; never clip Traditional Chinese at 375.

7. **Hand off.** Implement tokens and states with [ui-design](ui-design.md). Do not declare the screen done until [ui-review](ui-review.md) visual + responsive boxes are green.

## Anti-patterns

| Symptom | Do this instead |
|---|---|
| Hero, gradient mesh, purple glow | Zinc page, `AppShell`, data first |
| Three columns with no priority | One column, or two with a primary pane |
| Card inside a card | One surface; `border` + `rounded-md` once |
| Fixed `px` type walls / English-only button widths | `flex-wrap`, 1.5× zh-HK room |
| Mobile imports DOM `@ysk-kit/ui` | RN primitives + `@ysk-kit/ui-logic` |
| Skip the wireframe and invent a grid in CSS | ASCII first, then Tailwind grid |

Spend boldness nowhere in kit product screens. Taste operators (`bolder`, `delight`, aurora) are out of scope.

## Output format

```md
## Layout — <route> (<web|admin|mobile|desktop>)
Density: comfortable | compact
Nav: sidebar | top-nav
Wireframe: (desktop 1280 + 375, grouping / reading order)
Grid: 1-col max-w-4xl | md:grid-cols-2 | 12-col + gutters 4/6/8
Next: ui-design → ui-review
```

## Done criteria

- [ ] Wireframe (desktop + 375, grouping and reading order) lives in the plan or PR
- [ ] `AppShell` + `PageHeader` (or RN chrome on mobile); no third shell
- [ ] 375 / 768 / 1280: no overlap, no horizontal scroll except tables
- [ ] zh-HK labels wrap; controls are not English-width
- [ ] [ui-review](ui-review.md) visual + responsive green

## Escalate / ask

Ask before a new nav pattern, a third breakpoint, dark mode, or a new color token. Do not add a `design-tokens` skill in the same change as a screen.

## References

- [ui-design](ui-design.md) (zinc tokens, `@ysk-kit/ui`, forms)
- [ui-review](ui-review.md) (visual, reading order, 375/768/1280)
- Worked example: [admin dual-pane layout](../recipes/admin-dual-pane-layout.md)
- jakubkrehel `better-layout` (grouping, alignment, translation room — adapted, not vendored)
- Anthropic frontend-design wireframe step (structure only; stay on kit zinc)
