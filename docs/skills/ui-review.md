---
name: ui-review
description: >
  QA checklist before declaring YSK Kit UI work done: visual, a11y, responsive,
  states, copy, performance — with Playwright, keyboard, and axe verification.
  Use when finishing a screen or when the user asks to review UI / UX / a11y.
---

# Skill: review UI

Language: [中文](ui-review.zh.md) · English

Run this checklist before marking UI work done. Design rules: [ui-design](ui-design.md). Law: [AGENTS.md](../../AGENTS.md). Tests: [write-tests](write-tests.md).

## Trigger

- A web / admin / mobile / desktop screen changed.
- The user asks to review UI, UX, accessibility, or “does this look done?”.

## How to verify

| Method | When | How |
|---|---|---|
| Code pass | always | Read the file against the boxes below |
| Testing Library | page/component tests | `getByRole` / `getByLabelText`; assert `role="alert"` on errors |
| Keyboard | web / admin / desktop | Tab through the flow; Enter submits; Esc does not trap focus unless a dialog exists |
| Playwright | login/shell or layout change | `pnpm --filter @ysk-kit/web build && pnpm e2e`. Optional: `setViewportSize` 375 / 768 / 1280 and screenshot |
| axe | **optional** | `@axe-core/playwright` is **not** in this repo. Do not add it unless asked. If available locally, run against `/login` and the changed route; zero serious/critical |
| Reduced motion | if you added animation | OS “reduce motion” or `page.emulateMedia({ reducedMotion: 'reduce' })` |

A single screenshot is **not** verification. Exercise the flow: click, type, submit, fail, retry.

## Checklist

Copy the list into the PR or plan. Unchecked items mean the work is not done.

### Visual

- [ ] Uses `@ysk-kit/ui` (or RN primitives on mobile), not a new kit
- [ ] Zinc page (`bg-zinc-50` / `text-zinc-900`), `rounded-md` only, `h-9` controls
- [ ] No gradient mesh, glass, purple glow, or mixed radii
- [ ] Header / table / form align to `max-w-4xl` and the `px-4` gutter
- [ ] Long `zh-HK` strings wrap (`flex-wrap`); nothing clipped at 375px

### Accessibility

- [ ] One `h1` (`PageHeader`)
- [ ] Every input has a visible label (`FormField` + `htmlFor`)
- [ ] Focus ring visible; no `outline-none` without a replacement
- [ ] Hit target ≥ 24px (mobile ≥ 44px)
- [ ] Errors are `role="alert"` and not color-only
- [ ] Icon-only buttons have `aria-label`
- [ ] Keyboard: Tab reaches every action; submit with Enter; no keyboard trap
- [ ] `Spinner` exposes `role="status"` (already in `@ysk-kit/ui`)
- [ ] `prefers-reduced-motion` disables decorative spin / transition

### Responsive

- [ ] 375 / 768 / 1280: no horizontal scroll, no overlapping controls
- [ ] `PageHeader` actions wrap; tables can scroll horizontally if needed
- [ ] Desktop Electron: same layout as web at 1280

### States

- [ ] Loading (`Spinner` or pending button label kept)
- [ ] Empty (`EmptyState` + next action)
- [ ] Error (`ErrorBanner` from SDK `error.message` and/or field `FormField` error)
- [ ] Disabled while mutation pending
- [ ] Destructive confirm (or Undo) before suspend/delete
- [ ] `Can` hides unauthorized actions

### Copy

- [ ] Sentence case; CTA is a verb (`Sign in`, `Create`)
- [ ] Empty and error text say what to do next
- [ ] Status labels from `userStatusLabel` / contracts, not raw enums
- [ ] Traditional Chinese length checked on the primary CTA

### Performance

- [ ] No layout shift from unlabeled images
- [ ] No extra HTTP client; still `@ysk-kit/sdk` / `@ysk-kit/web-sdk`
- [ ] No new heavy UI dependency

### Platform

- [ ] Web/admin: TanStack `Link` for in-app navigation (not `<button>` that `navigate`s when a link will do)
- [ ] Mobile: 44px targets, email keyboard, secure password field
- [ ] Desktop: no raw `fetch`; same tokens as web

## Playwright snippets (optional)

```ts
await page.setViewportSize({ width: 375, height: 812 });
await page.goto('/login');
await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
await expect(page.getByLabel('Email')).toBeVisible();
// optional local visual: await expect(page).toHaveScreenshot('login-375.png');
```

Keyboard: `await page.keyboard.press('Tab')` until focus is on Sign in, then `Enter`.

Do not add screenshot diffs to CI in this change unless the user asked.

## Fail / pass

**Fail** if any Visual, Accessibility, States, or “no raw fetch” box is unchecked.

**Pass** only when the boxes for the surfaces you touched are checked and, for web login/shell changes, `pnpm e2e` is green (ports 3001 / 5173 free, DB seeded).

## Done criteria

- [ ] Checklist completed for every touched route
- [ ] Keyboard-only pass on web/admin/desktop
- [ ] 375 viewport checked (code or browser)
- [ ] Envelope errors render through `ErrorBanner` / `FormField`
- [ ] [verify-change](verify-change.md) still required

## References

- Vercel Web Interface Guidelines (review as `file:line` findings when auditing)
- WCAG 2.2 AA
- Testing Library guiding principles; Playwright best practices
- Nielsen heuristics (status visibility, consistency, error recovery)
