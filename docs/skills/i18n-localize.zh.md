---
name: i18n-localize
description: >
  經 `@ysk-kit/i18n`（zh-HK | en）接上 YSK Kit UI 與 envelope 字串。
  Use when adding or changing user-visible copy, ErrorBanner, email/push text, locale switch, or /i18n-localize.
  中文：i18n、zh-HK、en、envelope 訊息、Intl 格式。
  Do not use for a second UI library, RTL, or unsupervised jargon machine translation.
---

# Skill：本地化 UI 與 envelope 字串

Language: [English](i18n-localize.md) · 中文

產品文案走 `@ysk-kit/i18n`（`zh-HK` | `en`）。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。畫面：[ui-design](ui-design.zh.md)。Envelope 代碼：[envelope-api](envelope-api.zh.md) 與 [contract-change](contract-change.zh.md)。完成 UI：[ui-review](ui-review.zh.md)。

此 skill 是程序。它不加第二套 UI 庫，也不要求一次改動接上 kit 裡每一個畫面。

## 觸發

- 新增或改動使用者可見字串（標籤、標題、空狀態、橫幅、按鈕）。
- `ErrorBanner`、登入／錯誤文案，或把 envelope `error.code` map 成訊息。
- 給人讀的電郵或 push 文案。
- 語言切換（`zh-HK` ↔ `en`）。

不要用來發明第二套元件庫、加 RTL，或在沒有人工覆核下機器翻譯行業術語。

## 輸入

| 輸入 | 必要 | 備註 |
|---|---|---|
| 表面 | 是 | `web` \| `admin` \| `mobile` \| `desktop` \| mail \| push |
| Locale | 是 | Kit locale 是 `zh-HK` 與 `en`。預設是 `zh-HK`（`DEFAULT_LOCALE`） |
| 字串 | 是 | 鍵加上兩個 locale 的值。代碼保持英文穩定 |

## 步驟

1. **接上 `@ysk-kit/i18n`。** Import `t`、`DEFAULT_LOCALE` 與型別 `Locale`（`'zh-HK' | 'en'`）。預設 locale 是 `zh-HK`。不要另發明一套字典幫手。

   ```ts
   import { t, type Locale } from '@ysk-kit/i18n';

   const copy = {
     signIn: { 'zh-HK': '登入', en: 'Sign in' },
   } as const;

   t(copy, 'signIn', locale);
   ```

2. **JSX 不要硬編碼產品文案**，呼叫點只留鍵。字典同時寫 `zh-HK` 與 `en`。標籤必須承受繁體中文長度（[ui-design](ui-design.zh.md)）。

3. **把 envelope 代碼 map 成本地化訊息。** `error.code` 維持 `@ysk-kit/contracts` 的英文 `as const`。顯示 `ERROR_MESSAGE[code][locale]`（或以該 code 為鍵的產品字典再 `t`）。不要本地化代碼本身。新代碼必須在同一 PR 為兩個 locale 寫 `ERROR_MESSAGE`（[envelope-api](envelope-api.zh.md)）。

4. **日期、數字、貨幣用 `Intl` 格式化**（`Intl.DateTimeFormat`、`Intl.NumberFormat`），跟當時 locale。不要拼接對 locale 敏感的碎片。跟 Vercel Locale 指引：locale 是一等輸入，不是事後才加。

5. **兩個 locale 都要驗證。** 渲染（或 snapshot）`zh-HK` 與 `en`。缺鍵必須讓 smoke 失敗 — 不要把 `undefined` 吞成空白 UI。若改了給人讀的文件，`.zh.md` 配對必須同步。

## 驗證

```bash
pnpm --filter @ysk-kit/i18n test
pnpm layers && pnpm typecheck && pnpm test
```

- [ ] 文案經 `t(...)` 或 `ERROR_MESSAGE[code][locale]`
- [ ] 每個新鍵都有 `zh-HK` 與 `en`
- [ ] Envelope 代碼維持英文穩定
- [ ] 日期／數字／貨幣用當時 locale 的 `Intl`
- [ ] 缺鍵會讓測試或 typecheck 失敗；不會渲染空白
- [ ] 改了指南文字時已更新文件配對

## 輸出格式

```md
## i18n — <surface>
Locales: zh-HK | en
Keys: <list>
Envelope codes: <codes or n/a>
Intl: dates | numbers | currency | n/a
Verify: both locales render; missing-key fails
Non-goals held: no second UI lib; no RTL; no unsupervised jargon MT
```

## 完成條件

此次改動的使用者可見字串在兩個 kit locale 都存在，envelope 代碼維持英文穩定，`Intl` 跟當時 locale 格式化，缺鍵不能默默把 UI 變空白。

## 反模式

| 症狀 | 改這樣做 |
|---|---|
| JSX 裡 `"Sign in"` | `t(copy, 'signIn', locale)`，兩個 locale 都寫 |
| 本地化 `error.code` | 保留代碼；本地化 `ERROR_MESSAGE` |
| 拼接 `"$" + amount` | `Intl.NumberFormat(locale, { style: 'currency', currency })` |
| 把缺鍵吞成 `''` | 讓 `t`／型別失敗；加紅燈測試 |
| 為「i18n 元件」加第二套 UI 庫 | 重用 `@ysk-kit/ui` |
| RTL／額外 locale（`ja`、`zh-CN`） | 不是 kit 預設；先問 |
| 無監督機器翻譯行業術語 | `zh-HK` 要人工覆核 |

## 升級／詢問

加 `zh-HK`／`en` 以外的 locale、出貨 RTL，或在沒有人工覆核下機器翻譯行業術語之前先問。
