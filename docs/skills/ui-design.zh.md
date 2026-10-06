---
name: ui-design
description: >
  用既有 token、@ysk-kit/ui、WCAG 2.2 AA，以及從 API envelope 對應的表單，
  設計並實作 YSK Kit UI，不要泛用 AI 風格裝飾。
  新增或改動 web、admin、mobile 或 desktop 畫面時使用。
---

# Skill：UI 設計

Language: [English](ui-design.md) · 中文

畫面要像本 kit，不要像產生出來的宣傳頁。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。元件：`@ysk-kit/ui`。無 DOM 的檢視規則：`@ysk-kit/ui-logic`。完成前審查：[ui-review](ui-review.zh.md)。

## 觸發

- web／admin／mobile／desktop 新增或改動頁面、表單、表格、空白狀態或 shell。
- 使用者要求 UI、UX、版面、深色模式或可及性。

## 輸入

| 輸入 | 必要 | 備註 |
|---|---|---|
| 表面 | 是 | `apps/web`、`apps/admin`、`apps/mobile`、`apps/desktop` |
| 文案語言 | 否 | 產品預設 locale 是 `zh-HK`（`@ysk-kit/i18n`）。標籤必須承受繁體中文長度 |

## 重用此系統（不要另造一套）

Web、admin 與 desktop 已共用 Tailwind 4 + `@ysk-kit/ui`。Mobile 用 React Native 原語與 `@ysk-kit/ui-logic`（沒有 DOM）。

**元件**（從 `@ysk-kit/ui` import）：`AppShell`、`PageHeader`、`Button`、`Input`、`FormField`、`ErrorBanner`、`EmptyState`、`Spinner`、`Can`、`Table`（加 `TableHeader`／`TableBody`／`TableRow`／`TableHead`／`TableCell`）。

**樹上實際的 token**（zinc + red、`rounded-md`、`h-9`）：

| Token | 值 | 用途 |
|---|---|---|
| 頁面 | `min-h-screen bg-zinc-50 text-zinc-900` | `AppShell` |
| 頁首 | `border-b border-zinc-200 bg-white` | Shell 導航 |
| 內容寬度 | `mx-auto max-w-4xl px-4 py-8` | 主欄 |
| 標題 | `text-2xl font-semibold` | `PageHeader` |
| 正文／控件 | `text-sm` | 表單、表格、導航 |
| 弱化 | `text-zinc-600` | 說明、空白文案 |
| 控件 | `h-9 … rounded-md border border-zinc-300 bg-white px-3` | `Input`；Button `h-9 px-4`（`sm`：`h-8 px-3 text-xs`） |
| 主要按鈕 | `bg-zinc-900 text-white hover:bg-zinc-800` | 預設 `Button` |
| 描邊按鈕 | `border border-zinc-300 bg-white hover:bg-zinc-50` | 次要／確認危險動作 |
| 圓角 | `rounded-md` | 只有一種圓角。巢狀：子 ≤ 父 |
| 危險 | 橫幅 `border-red-200 bg-red-50 text-red-700`；欄位錯誤 `text-red-600` | `ErrorBanner`、`FormField` |
| 空白 | `border-dashed border-zinc-300 bg-white px-4 py-10 text-center` | `EmptyState` |
| 堆疊 | `space-y-4`／`space-y-6`，`gap-3`／`gap-4` | 區塊、表單 |
| 焦點（目標） | 可見 ring。沒有替代時不要 `outline-none` | 優先 `focus-visible:border-zinc-500` 加 ring |

間距尺度：Tailwind 1／2／3／4／6／8（4／8／12／16／24／32 px）。不要發明 `13px` 間隙。

斷點：Tailwind 預設。核對 **375**、**768**、**1280**。主欄維持 `max-w-4xl`。頁首與表單列用 `flex-wrap`（`PageHeader` 已如此）。

深色模式：**尚未提供**。`:root { color-scheme: light; }`。除非使用者要求，否則不要加色盤。若要求：在 `html` 設 `color-scheme: dark`、反轉 zinc、維持對比，不要做紫色漸層主題。

## 版面與狀態

每個清單／詳情畫面都要有：

| 狀態 | Kit 做法 |
|---|---|
| 載入 | `Spinner`（`role="status"` `aria-label="Loading"`）。按鈕：保留標籤，pending 時 `disabled`（`login.isPending`） |
| 空白 | `EmptyState`，使用者可建立時附下一步動作 |
| 錯誤 | `ErrorBanner` 用 SDK 的 `error.message`（`AppError`）。欄位錯誤放 `FormField` |
| 成功 | 導航或清空表單（見 `UsersPage`）。該表面沒有 toast 就不要加 |
| 停用 | `Button` 的 `disabled:pointer-events-none disabled:opacity-50` |
| Skeleton | 可選。若用，必須鏡像最終版面（沒有 CLS）。本 kit 首次載入優先 `Spinner` |
| 樂觀更新 | 非破壞性切換可以。envelope 錯誤時回滾。破壞性動作先確認（停權用 `window.confirm`）或提供 Undo |

`Can` 用 contracts 的 `UserRole`／`Permission` 閘突變。隱藏控件，不要留一顆死按鈕。

## 表單

- 可見 `<label>`，經 `FormField`（`label` + `htmlFor` 對上 `Input` 的 `id`）。Placeholder **不是**標籤。
- 用 `@ysk-kit/contracts` 的 command Zod schema 驗證（`LoginPasswordCommandSchema.safeParse`）。不要重寫電郵規則。
- 時機：允許輸入；提交時驗證（表單可用 `noValidate`）。提交錯誤時聚焦第一個無效欄。
- 欄位內錯誤：`FormField` 的 `error`（`role="alert"`）。表單級／API 錯誤：`ErrorBanner` 用 `error.message`（SDK 會解開 `{ ok: false, error }`）。
- 對得上就用 `type="email"`／`type="password"`／`autocomplete`。不要禁止貼上。
- Enter 提交。突變開始前保持提交按鈕可用，然後停用並保留標籤。
- 鍵盤：每個控件都可到達。不要用 `<div onClick>` 提交。

## WCAG 2.2 AA（可測試）

| 規則 | 做 |
|---|---|
| 對比 | zinc-50 上用 zinc-900；不要在 zinc-50 上用 zinc-400 文字。錯誤用 red-50 上的 red-700 |
| 焦點 | 可見，不被 sticky 頁首遮住。沒有 ring 時永不 `outline: none` |
| 目標尺寸 | ≥ 24px（kit `h-9` = 36px）。Mobile ≥ 44px |
| 語意 | `PageHeader` 用 `h1`，表格用 `table`，動作用 `button`／`a`（TanStack `Link`）。不要用 `<div>` 當按鈕 |
| 名稱 | 只有圖示的控件要有 `aria-label`。`Spinner` 已有 `aria-label="Loading"` |
| 狀態 | 錯誤用 `role="alert"`。不要只靠顏色 |
| 動效 | 尊重 `prefers-reduced-motion`（關掉 `animate-spin`／transition）。只動畫 `opacity`／`transform`。不要 `transition: all` |
| 縮放 | 不要設 `user-scalable=no` 或 `maximum-scale=1` |
| 略過／標題 | 每頁一個 `h1`。不要跳級 |
| i18n | 預設 `zh-HK`。繁體中文較長 — `flex-wrap`，不要固定只夠英文的按鈕寬。`userStatusLabel(status)` 已有 `zh-HK`／`en` |

## 動效、微型文案、一致性

- 動效只用來顯示因果（開啟、pending spinner）。不要進場 stagger、漸層 mesh、每張卡都 hover。
- 文案：sentence case。CTA 寫動作（`Sign in`、`Create`、`Suspend`）。空白狀態說明下一步。錯誤要具體（`error.message`），不要「出了問題」。
- web／admin／desktop 用同一套詞。Mobile 即使 chrome 是 React Native，動詞也要相同。
- 金錢與狀態用 `@ysk-kit/ui-logic` 的 `formatHkd`／`userStatusLabel`。不要在表格硬編碼 `ACTIVE`。

## 平台

| App | 慣例 |
|---|---|
| Web／admin | Vite + Tailwind + `@ysk-kit/ui`。導航用 TanStack Router `Link`（中鍵可開）。不要 raw `fetch` |
| Desktop（Electron） | 與 web 同一套 UI 套件與 `styles.css`。快捷鍵不要搶系統尋找／複製。視窗 chrome 維持原生 |
| Mobile（Expo） | React Native `Text`／`TextInput`／`Button`。點擊目標 ≥ 44px。電郵用 `keyboardType="email-address"`，密碼用 `secureTextEntry`。iOS 跟 HIG、Android 跟 Material 3 的導航模式；不要 import `@ysk-kit/ui`（DOM） |

## 效能

- 不要沒有尺寸的大圖。若加 `<img>`，設 width／height（CLS）。
- 本 kit 清單是小頁；真實超過 50 列才虛擬化。
- 突變走 `@ysk-kit/web-sdk` hooks。不要加第二個 HTTP 客戶端。

## 反模式（永不）

- 紫／藍 AI 漸層、玻璃擬態、極光背景、「hero」大數字加陶土色強調
- 用 Inter／Roboto／Comic Neue 當「重新設計」；本 kit 是 zinc + 系統／Tailwind 預設
- 第二種圓角（`rounded-2xl` 卡配 `rounded-md` 輸入）
- 把 placeholder 當標籤、`div`+`onClick`「按鈕」、沒有 focus ring 的 `outline-none`
- 客戶端 app 內 raw `fetch('/v1/…')`
- 未經使用者明確決定就加新的 CSS 框架、元件庫或顏色 token
- 深奶油色 serif 登陸頁、黑底酸綠、全大寫 eyebrow
- `user-scalable=no`、只靠顏色的錯誤、不可及的圖示按鈕

Kit 產品畫面不要把膽識花在裝飾：值得記住的是資料，不是 chrome。

## 完成條件

- [ ] 畫面用 `@ysk-kit/ui`（mobile 則用 RN 原語）以及上表 zinc token
- [ ] 有載入、空白、錯誤、停用狀態
- [ ] 表單有標籤、contracts 的 Zod、envelope 錯誤在欄位旁
- [ ] 對比、焦點、目標尺寸、`zh-HK` 長度都成立
- [ ] [ui-review](ui-review.zh.md) 清單為綠色

## 參考

- Vercel Web Interface Guidelines（鍵盤、焦點、表單、動效、對比）
- Anthropic frontend-design skill（避免泛用 AI 美學；此處：留在 kit token）
- WCAG 2.2 AA；Nielsen heuristics（狀態可見、錯誤復原、一致性）
- Apple HIG／Material 3（只適用 mobile）
