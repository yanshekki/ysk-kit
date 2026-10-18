---
name: i18n-localize
description: >
  Wire YSK Kit UI and envelope strings through @ysk-kit/i18n (zh-HK | en).
  Use when adding or changing user-visible copy, ErrorBanner, email/push text, locale switch, or /i18n-localize.
  中文：i18n、zh-HK、en、envelope 訊息、Intl 格式。
  Do not use for a second UI library, RTL, or unsupervised jargon machine translation.
---

# Skill: localize UI and envelope strings

Language: [中文](i18n-localize.zh.md) · English

Keep product copy on `@ysk-kit/i18n` (`zh-HK` | `en`). Law: [AGENTS.md](../../AGENTS.md). Screens: [ui-design](ui-design.md). Envelope codes: [envelope-api](envelope-api.md) and [contract-change](contract-change.md). Finish UI: [ui-review](ui-review.md).

This skill is the procedure. It does not add a second UI library or wire every living kit screen in one change.

## Trigger

- New or changed user-visible string (label, heading, empty state, banner, button).
- `ErrorBanner`, login/error copy, or mapping an envelope `error.code` to a message.
- Email or push copy that a human reads.
- Locale switch (`zh-HK` ↔ `en`).

Do not use to invent a second component library, add RTL, or machine-translate domain jargon without a human review.

## Inputs

| Input | Required | Notes |
|---|---|---|
| Surface | yes | `web` \| `admin` \| `mobile` \| `desktop` \| mail \| push |
| Locale | yes | Kit locales are `zh-HK` and `en`. Default is `zh-HK` (`DEFAULT_LOCALE`) |
| Strings | yes | Keys plus both locale values. Codes stay English-stable |

## Steps

1. **Wire `@ysk-kit/i18n`.** Import `t`, `DEFAULT_LOCALE`, and type `Locale` (`'zh-HK' | 'en'`). Default locale is `zh-HK`. Do not invent a parallel dictionary helper.

   ```ts
   import { t, type Locale } from '@ysk-kit/i18n';

   const copy = {
     signIn: { 'zh-HK': '登入', en: 'Sign in' },
   } as const;

   t(copy, 'signIn', locale);
   ```

2. **Never hard-code product copy in JSX** beyond the call-site key. Put both `zh-HK` and `en` on the dictionary. Labels must survive Traditional Chinese length ([ui-design](ui-design.md)).

3. **Map envelope codes to localized messages.** `error.code` stays the English `as const` value from `@ysk-kit/contracts`. Display `ERROR_MESSAGE[code][locale]` (or `t` over a product dictionary keyed by that code). Do not localize the code itself. New codes need `ERROR_MESSAGE` in both locales in the same PR ([envelope-api](envelope-api.md)).

4. **Format dates, numbers, and currency with `Intl`** (`Intl.DateTimeFormat`, `Intl.NumberFormat`) for the active locale. Do not concatenate locale-sensitive fragments. Follow Vercel Locale guidance: locale is a first-class input, not an afterthought.

5. **Verify both locales.** Render (or snapshot) `zh-HK` and `en`. A missing key must fail the smoke — do not swallow `undefined` as blank UI. If you changed human-readable docs, keep the `.zh.md` pair in lockstep.

## Verification

```bash
pnpm --filter @ysk-kit/i18n test
pnpm layers && pnpm typecheck && pnpm test
```

- [ ] Copy goes through `t(...)` or `ERROR_MESSAGE[code][locale]`
- [ ] Both `zh-HK` and `en` exist for every new key
- [ ] Envelope codes remain English-stable
- [ ] Dates / numbers / currency use `Intl` for the active locale
- [ ] Missing keys fail a test or typecheck; they do not render empty
- [ ] Docs pair updated when guide text changed

## Output format

```md
## i18n — <surface>
Locales: zh-HK | en
Keys: <list>
Envelope codes: <codes or n/a>
Intl: dates | numbers | currency | n/a
Verify: both locales render; missing-key fails
Non-goals held: no second UI lib; no RTL; no unsupervised jargon MT
```

## Done criteria

User-visible strings for the change exist in both kit locales, envelope codes stay English-stable, `Intl` formats the active locale, and a missing key cannot silently blank the UI.

## Anti-patterns

| Symptom | Do this instead |
|---|---|
| `"Sign in"` in JSX | `t(copy, 'signIn', locale)` with both locales |
| Localize `error.code` | Keep the code; localize `ERROR_MESSAGE` |
| Concatenate `"$" + amount` | `Intl.NumberFormat(locale, { style: 'currency', currency })` |
| Swallow missing keys as `''` | Let `t` / types fail; add a red test |
| Second UI library for “i18n components” | Reuse `@ysk-kit/ui` |
| RTL / extra locales (`ja`, `zh-CN`) | Out of kit default; ask first |
| Unsupervised MT of domain jargon | Human review of `zh-HK` |

## Escalate / ask

Ask before adding a locale other than `zh-HK` / `en`, shipping RTL, or machine-translating industry jargon without a human pass.
