# Admin dual-pane layout

Language: [中文](admin-dual-pane-layout.zh.md) · English

Lay out a compact admin **list + detail** screen before picking components. Procedure: [layout-system](../skills/layout-system.md). Then [ui-design](../skills/ui-design.md). Not done until [ui-review](../skills/ui-review.md). Law: [AGENTS.md](../../AGENTS.md).

This walkthrough uses the living admin **Users** page (`apps/admin/src/features/users/users-page.tsx`) as the host. It does not add an industry domain, a second shell, or a new color token.

## When to use this

- The operator needs a table of rows and a selected row’s fields on the same route.
- A plan’s UI section still has no ASCII wireframe.
- You are about to write Tailwind grid classes for admin density.

Do not use this to change the zinc palette, invent a sidebar next to the existing admin top-nav, or skip the wireframe.

## Inputs (from layout-system)

| Input | This walkthrough |
|---|---|
| Surface | `admin` |
| Density | `compact` (tables, not public marketing) |
| Nav pattern | **existing admin top-nav** (`AppShell` in `apps/admin/src/router.tsx`). Do not invent a third chrome. |

## 1. ASCII wireframe first

Put this in the dated plan or the PR. Reading order is F-pattern: brand → primary nav → page title → primary action → list → detail.

```text
1280 (inside AppShell max-w-4xl)
[ AppShell: YSK Admin | Users Audit API keys Queues ........ Logout ]
[ PageHeader: Users                         Create user ]
[ md:grid-cols-12 gap-6
  list  col-span-5                 detail col-span-7
  [ filters / search ]             [ selected display name ]
  [ table: email | role | status ] [ fields, stacked labels ]
  numbers right-aligned            [ Suspend / Save ]
]

768: same two columns allowed; PageHeader actions wrap.

375:
  brand
  nav (wrap or menu)
  title
  primary (full width, wrap)
  list (full width)
  detail (full width, below list)
  no horizontal scroll except the table
```

zh-HK labels need about **1.5×** English width. Do not fix button `width` in `px`. Use `flex-wrap`.

## 2. Kit shell, then grid

Keep `AppShell` + `PageHeader`. Dual-pane lives in **page children**, not a new layout component.

```tsx
<section className="space-y-6">
  <PageHeader title="Users" description="Create and suspend accounts." />
  <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
    <div className="min-w-0 md:col-span-5">{/* table */}</div>
    <div className="min-w-0 md:col-span-7">{/* detail */}</div>
  </div>
</section>
```

| Rule | Do |
|---|---|
| One-column default | `grid-cols-1` until `md` |
| Two regions | `md:grid-cols-12` with `col-span-5` / `col-span-7` (list secondary, detail primary) or `md:grid-cols-2` |
| Gutters | `gap-4` / `gap-6` / `gap-8` only |
| Three equal columns | No, unless one pane is clearly primary |
| Card inside a card | One surface; `border` + `rounded-md` once |
| Stretch `AppShell` to the viewport | No — keep `max-w-4xl`. Ask before a wider shell. |

`min-w-0` stops the table from overflowing the grid track.

## 3. Alignment and zh-HK

- Stack with `space-y-4` or `space-y-6`. Labels **above** fields.
- Tables: text left, counts/status codes stay readable; money (if any) right.
- `PageHeader` actions already `flex-wrap`. Create / Suspend buttons must wrap at 375.
- Do not clip Traditional Chinese. Prefer `whitespace-normal` over English-width walls.

## 4. Verify 375 / 768 / 1280

Resize (or Playwright viewport) and confirm:

| Width | Expect |
|---|---|
| 375 | Single column; primary action full width; no overflow except the table |
| 768 | Two columns allowed; no overlap |
| 1280 | Still inside `AppShell` `max-w-4xl`; list and detail share one row |

Then [ui-design](../skills/ui-design.md) for tokens, empty/error/loading, and `@ysk-kit/web-sdk` hooks. [ui-review](../skills/ui-review.md) before you call the screen done.

## Layout report (copy this)

```md
## Layout — /users (admin)
Density: compact
Nav: top-nav (existing AppShell)
Wireframe: 1280 list+detail 5/7; 375 stacked list then detail
Grid: md:grid-cols-12 gap-6, min-w-0 on panes
Next: ui-design → ui-review
```
