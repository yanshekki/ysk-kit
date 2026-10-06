---
name: ui-design
description: >
  Design and implement YSK Kit UI with existing tokens, @ysk-kit/ui, WCAG 2.2 AA,
  forms mapped from the API envelope, and no generic AI-slop chrome.
  Use when adding or changing web, admin, mobile, or desktop screens.
  中文：畫面、zinc、表單、可及性。
  Do not use for API-only changes or to invent a second component library.
---

# Skill: UI design

Language: [中文](ui-design.zh.md) · English

Build screens that look like this kit, not like a generated marketing page. Law: [AGENTS.md](../../AGENTS.md). Components: `@ysk-kit/ui`. Copy-free view rules: `@ysk-kit/ui-logic`. Review before done: [ui-review](ui-review.md).

## Trigger

- New or changed page, form, table, empty state, or shell in web / admin / mobile / desktop.
- The user asks for UI, UX, layout, dark mode, or accessibility.

## Inputs

| Input | Required | Notes |
|---|---|---|
| Surface | yes | `apps/web`, `apps/admin`, `apps/mobile`, `apps/desktop` |
| Copy locale | no | Default product locale is `zh-HK` (`@ysk-kit/i18n`). Labels must survive Traditional Chinese length |

## Reuse this system (do not invent a parallel one)

Web, admin, and desktop already share Tailwind 4 + `@ysk-kit/ui`. Mobile uses React Native primitives and `@ysk-kit/ui-logic` (no DOM).

**Components** (import from `@ysk-kit/ui`): `AppShell`, `PageHeader`, `Button`, `Input`, `FormField`, `ErrorBanner`, `EmptyState`, `Spinner`, `Can`, `Table` (+ `TableHeader` / `TableBody` / `TableRow` / `TableHead` / `TableCell`).

**Tokens actually in the tree** (zinc + red, `rounded-md`, `h-9`):

| Token | Value | Use |
|---|---|---|
| Page | `min-h-screen bg-zinc-50 text-zinc-900` | `AppShell` |
| Header | `border-b border-zinc-200 bg-white` | Shell nav |
| Content width | `mx-auto max-w-4xl px-4 py-8` | Main |
| Title | `text-2xl font-semibold` | `PageHeader` |
| Body / controls | `text-sm` | Forms, tables, nav |
| Muted | `text-zinc-600` | Descriptions, empty copy |
| Control | `h-9 … rounded-md border border-zinc-300 bg-white px-3` | `Input`; Button `h-9 px-4` (`sm`: `h-8 px-3 text-xs`) |
| Primary button | `bg-zinc-900 text-white hover:bg-zinc-800` | Default `Button` |
| Outline button | `border border-zinc-300 bg-white hover:bg-zinc-50` | Secondary / destructive confirm |
| Radius | `rounded-md` | One radius. Nested: child ≤ parent |
| Danger | `border-red-200 bg-red-50 text-red-700` banner; `text-red-600` field error | `ErrorBanner`, `FormField` |
| Empty | `border-dashed border-zinc-300 bg-white px-4 py-10 text-center` | `EmptyState` |
| Stack | `space-y-4` / `space-y-6`, `gap-3` / `gap-4` | Sections, forms |
| Focus (target) | Visible ring. Do not `outline-none` without a replacement | Prefer `focus-visible:border-zinc-500` + ring |

Spacing scale: Tailwind 1 / 2 / 3 / 4 / 6 / 8 (4 / 8 / 12 / 16 / 24 / 32 px). Do not invent `13px` gaps.

Breakpoints: Tailwind defaults. Verify **375**, **768**, **1280**. Main column stays `max-w-4xl`. Use `flex-wrap` on headers and form rows (`PageHeader` already does).

Dark mode: **not shipped**. `:root { color-scheme: light; }`. Do not add a palette unless the user asks. If they do: set `color-scheme: dark` on `html`, invert zinc, keep contrast, do not ship a purple gradient theme.

## Layout and states

Every list/detail screen implements:

| State | Kit pattern |
|---|---|
| Loading | `Spinner` (`role="status"` `aria-label="Loading"`). Button: keep the label, set `disabled` while pending (`login.isPending`) |
| Empty | `EmptyState` with a next action when the user can create |
| Error | `ErrorBanner` with `error.message` from the SDK (`AppError`). Field errors on `FormField` |
| Success | Navigate or clear the form (see `UsersPage`). Do not toast unless the surface already has one |
| Disabled | `disabled:pointer-events-none disabled:opacity-50` on `Button` |
| Skeleton | Optional. If used, mirror the final layout (no CLS). Prefer `Spinner` on first load in this kit |
| Optimistic | Allowed for non-destructive toggles. Rollback on envelope error. Confirm destructive (`window.confirm` on suspend) or provide Undo |

`Can` gates mutations by `UserRole` / `Permission` from contracts. Hide the control; do not leave a dead button.

## Forms

- Visible `<label>` via `FormField` (`label` + `htmlFor` matching `Input` `id`). Placeholder is **not** a label.
- Validate with the command Zod schema from `@ysk-kit/contracts` (`LoginPasswordCommandSchema.safeParse`). Do not re-implement email rules.
- Timing: allow typing; validate on submit (`noValidate` on the form is fine). On submit error, focus the first invalid field.
- Inline field error: `FormField` `error` (`role="alert"`). Form-level / API error: `ErrorBanner` with `error.message` (SDK unwraps `{ ok: false, error }`).
- `type="email"` / `type="password"` / `autocomplete` where it matches. Do not block paste.
- Enter submits. Keep the submit button enabled until the mutation starts, then disable + keep the label.
- Keyboard: every control is reachable. Do not use `<div onClick>` for submit.

## WCAG 2.2 AA (testable)

| Rule | Do |
|---|---|
| Contrast | Zinc-900 on zinc-50; do not use zinc-400 text on zinc-50. Red-700 on red-50 for errors |
| Focus | Visible, not covered by sticky header. Never `outline: none` with no ring |
| Target size | ≥ 24px (kit `h-9` = 36px). Mobile ≥ 44px |
| Semantics | `h1` in `PageHeader`, `table` for tables, `button` / `a` (TanStack `Link`) for actions. No `<div>` buttons |
| Name | Icon-only controls get `aria-label`. `Spinner` already has `aria-label="Loading"` |
| Status | Errors use `role="alert"`. Do not use color alone |
| Motion | Honor `prefers-reduced-motion` (disable `animate-spin` / transitions). Animate `opacity` / `transform` only. No `transition: all` |
| Zoom | Do not set `user-scalable=no` or `maximum-scale=1` |
| Skip / headings | One `h1` per page. Do not skip levels |
| i18n | Default `zh-HK`. Traditional Chinese runs longer — `flex-wrap`, no fixed-width English-only buttons. `userStatusLabel(status)` already has `zh-HK` / `en` |

## Motion, microcopy, consistency

- Motion only to show cause/effect (open, pending spinner). No page-load stagger, no gradient mesh, no hover on every card.
- Copy: sentence case. CTA names the action (`Sign in`, `Create`, `Suspend`). Empty state explains the next step. Errors are specific (`error.message`), not “Something went wrong”.
- Same words across web / admin / desktop. Mobile uses the same verbs even when the chrome is React Native.
- `formatHkd` / `userStatusLabel` from `@ysk-kit/ui-logic` for money and status. Do not hard-code `ACTIVE` in the table.

## Platform

| App | Convention |
|---|---|
| Web / admin | Vite + Tailwind + `@ysk-kit/ui`. TanStack Router `Link` for navigation (middle-click works). No raw `fetch` |
| Desktop (Electron) | Same UI package and `styles.css` as web. Keyboard shortcuts do not steal system Find/Copy. Window chrome stays native |
| Mobile (Expo) | React Native `Text` / `TextInput` / `Button`. Hit targets ≥ 44px. `keyboardType="email-address"`, `secureTextEntry` for passwords. Follow iOS HIG on iOS and Material 3 on Android for navigation patterns; do not import `@ysk-kit/ui` (DOM) |

## Performance

- No giant un-sized images. If you add `<img>`, set width/height (CLS).
- Lists in this kit are small pages; do not virtualize until > 50 rows is real.
- Mutations go through `@ysk-kit/web-sdk` hooks. Do not add a second HTTP client.

## Anti-patterns (never)

- Purple/blue AI gradients, glassmorphism, aurora backgrounds, “hero” numbers with a terracotta accent
- Inter / Roboto / Comic Neue as a “redesign”; this kit is zinc + system/Tailwind defaults
- A second radius (`rounded-2xl` cards next to `rounded-md` inputs)
- Placeholder-as-label, `div`+`onClick` “buttons”, `outline-none` with no focus ring
- Raw `fetch('/v1/…')` in a client app
- New CSS framework, component library, or color tokens without an explicit user decision
- Dark cream serif landing-page chrome, acid-green-on-black, or ALL-CAPS eyebrows
- `user-scalable=no`, color-only errors, inaccessible icon buttons

Spend boldness nowhere in kit product screens: the memorable thing is the data, not the chrome.

## Output format

```md
## UI — <route> (<web|admin|mobile|desktop>)
Tokens: zinc / rounded-md / h-9
States: loading / empty / error / disabled
Forms: FormField + contracts Zod
Next: ui-review
```

## Done criteria

- [ ] Screen uses `@ysk-kit/ui` (or RN primitives on mobile) and the zinc tokens above
- [ ] Loading, empty, error, and disabled states exist
- [ ] Forms have labels, Zod from contracts, envelope errors inline
- [ ] Contrast, focus, target size, and `zh-HK` length hold
- [ ] [ui-review](ui-review.md) checklist is green

## Escalate / ask

Ask before a new color token, dark mode, component library, or `user-scalable=no`.

## References

- Vercel Web Interface Guidelines (keyboard, focus, forms, motion, contrast)
- Anthropic frontend-design skill (avoid generic AI aesthetics; here: stay on kit tokens)
- WCAG 2.2 AA; Nielsen heuristics (visibility of status, error recovery, consistency)
- Apple HIG / Material 3 (mobile only)
