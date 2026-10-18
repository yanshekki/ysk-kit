---
name: i18n-localize
description: >
  Wire YSK Kit UI and envelope strings through @ysk-kit/i18n (zh-HK | en).
  Use when adding or changing user-visible copy, ErrorBanner, email/push text, locale switch, or /i18n-localize.
  中文：i18n、zh-HK、en、envelope 訊息、Intl 格式。
  Do not use for a second UI library, RTL, or unsupervised jargon machine translation.
---

Read `docs/skills/i18n-localize.md`. Law: `AGENTS.md`.

1. Wire `@ysk-kit/i18n` (`zh-HK` | `en`). Never hard-code product copy in JSX beyond call-site keys.
2. Map envelope `error.code` to localized `ERROR_MESSAGE`; keep codes English-stable. Use `Intl` for dates/numbers/currency.
3. Verify both locales render. A missing key must fail the smoke, not blank the UI.
Gotcha: do not invent a second UI library, add RTL, or machine-translate domain jargon without a human review.
Verify: both locales render; docs pair if guide text changed.
Full steps: `docs/skills/i18n-localize.md`.
