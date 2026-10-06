---
name: ui-review
description: >
  在把 YSK Kit UI 標為完成之前的 QA 清單：視覺、可及性、響應式、狀態、文案、效能，
  以及 Playwright、鍵盤與 axe 的核對方法。
  完成畫面，或使用者要求審查 UI／UX／可及性時使用。
  中文：UI 審查、鍵盤、375 視埠。
  不要用於設計畫面（ui-design），或把一張截圖當成證明。
---

# Skill：審查 UI

Language: [English](ui-review.md) · 中文

把 UI 標為完成之前跑此清單。設計規則：[ui-design](ui-design.zh.md)。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。測試：[write-tests](write-tests.zh.md)。

## 觸發

- 改了 web／admin／mobile／desktop 畫面。
- 使用者要求審查 UI、UX、可及性，或問「這樣算完成嗎」。

## 如何核對

| 方法 | 何時 | 做法 |
|---|---|---|
| 讀程式 | 每次 | 對下面各箱逐項讀檔 |
| Testing Library | 頁面／元件測試 | `getByRole`／`getByLabelText`；錯誤斷言 `role="alert"` |
| 鍵盤 | web／admin／desktop | Tab 走完整流程；Enter 提交；沒有對話框時 Esc 不可困住焦點 |
| Playwright | 登入／shell 或版面改動 | `pnpm --filter @ysk-kit/web build && pnpm e2e`。可選：`setViewportSize` 375／768／1280 再截圖 |
| axe | **可選** | 本倉**沒有** `@axe-core/playwright`。除非被要求，否則不要加。若本機有，對 `/login` 與改過的路由跑；serious／critical 必須為零 |
| 減少動效 | 若加了動畫 | 系統「減少動態」或 `page.emulateMedia({ reducedMotion: 'reduce' })` |

單張截圖**不算**核對。要操作流程：點、輸入、提交、失敗、再試。

## 清單

把清單抄進 PR 或計劃。未勾的項目代表工作未完成。

### 視覺

- [ ] 用 `@ysk-kit/ui`（mobile 用 RN 原語），不是另一套 kit
- [ ] Zinc 頁面（`bg-zinc-50`／`text-zinc-900`）、只有 `rounded-md`、控件 `h-9`
- [ ] 沒有漸層 mesh、玻璃、紫色光暈或混用圓角
- [ ] 頁首／表格／表單對齊 `max-w-4xl` 與 `px-4` 溝槽
- [ ] 長的 `zh-HK` 字串會換行（`flex-wrap`）；375px 沒有裁切

### 可及性

- [ ] 一個 `h1`（`PageHeader`）
- [ ] 每個輸入都有可見標籤（`FormField` + `htmlFor`）
- [ ] 焦點 ring 可見；沒有替代時沒有 `outline-none`
- [ ] 點擊目標 ≥ 24px（mobile ≥ 44px）
- [ ] 錯誤是 `role="alert"`，而且不是只靠顏色
- [ ] 只有圖示的按鈕有 `aria-label`
- [ ] 鍵盤：Tab 到達每個動作；Enter 提交；沒有鍵盤陷阱
- [ ] `Spinner` 暴露 `role="status"`（`@ysk-kit/ui` 已有）
- [ ] `prefers-reduced-motion` 關掉裝飾性 spin／transition

### 響應式

- [ ] 375／768／1280：沒有橫向捲動、控件不重疊
- [ ] `PageHeader` 動作會換行；表格必要時可橫向捲
- [ ] Desktop Electron：1280 時與 web 同一版面

### 狀態

- [ ] 載入（`Spinner`，或 pending 時保留按鈕標籤）
- [ ] 空白（`EmptyState` + 下一步）
- [ ] 錯誤（SDK `error.message` 的 `ErrorBanner` 及／或 `FormField` 欄位錯誤）
- [ ] 突變 pending 時停用
- [ ] 停權／刪除前有破壞性確認（或 Undo）
- [ ] `Can` 隱藏未授權動作

### 文案

- [ ] Sentence case；CTA 是動詞（`Sign in`、`Create`）
- [ ] 空白與錯誤文字說明下一步
- [ ] 狀態標籤來自 `userStatusLabel`／contracts，不是裸 enum
- [ ] 主要 CTA 已核對繁體中文長度

### 效能

- [ ] 沒有未標尺寸的圖片造成版面位移
- [ ] 沒有額外 HTTP 客戶端；仍是 `@ysk-kit/sdk`／`@ysk-kit/web-sdk`
- [ ] 沒有新的沉重 UI 依賴

### 平台

- [ ] Web／admin：應用內導航用 TanStack `Link`（可以用連結時不要用會 `navigate` 的 `<button>`）
- [ ] Mobile：44px 目標、電郵鍵盤、安全密碼欄
- [ ] Desktop：沒有 raw `fetch`；與 web 同一套 token

## Playwright 片段（可選）

```ts
await page.setViewportSize({ width: 375, height: 812 });
await page.goto('/login');
await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
await expect(page.getByLabel('Email')).toBeVisible();
// 可選本機視覺：await expect(page).toHaveScreenshot('login-375.png');
```

鍵盤：`await page.keyboard.press('Tab')` 直到焦點在 Sign in，然後 `Enter`。

除非使用者要求，否則不要在此改動把截圖 diff 加進 CI。

## 失敗／通過

**失敗**：視覺、可及性、狀態，或「沒有 raw fetch」任一箱未勾。

**通過**：你改過的表面所有箱子都勾了；若改了 web 登入／shell，`pnpm e2e` 為綠色（連接埠 3001／5173 空閒，資料庫已種子）。

## 輸出格式

```md
## UI review — <routes>
Visual / a11y / states / fetch: PASS | FAIL
Keyboard: pass | fail
375: checked
e2e: green | skipped (<why>)
```

## 完成條件

- [ ] 每個改過的路由都完成清單
- [ ] web／admin／desktop 可只靠鍵盤走完
- [ ] 已核對 375 視埠（程式或瀏覽器）
- [ ] Envelope 錯誤經 `ErrorBanner`／`FormField` 顯示
- [ ] 仍須跑 [verify-change](verify-change.zh.md)

## 反模式

| 症狀 | 改為 |
|---|---|
| 一張截圖當證明 | 點、輸入、提交、失敗、再試 |
| 可及性箱子未勾 | 審查失敗 |

## 升級／詢問

把 axe 或截圖 diff 加進 CI 之前，先問。

## 參考

- Vercel Web Interface Guidelines（審查時用 `file:line` 列出發現）
- WCAG 2.2 AA
- Testing Library guiding principles；Playwright 最佳做法
- Nielsen heuristics（狀態可見、一致性、錯誤復原）
