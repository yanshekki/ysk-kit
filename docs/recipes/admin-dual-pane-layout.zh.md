# Admin 雙欄版面

Language: [English](admin-dual-pane-layout.md) · 中文

在挑選元件之前，先排一個緊湊的 admin **清單 + 詳情**畫面。程序：[layout-system](../skills/layout-system.zh.md)。然後 [ui-design](../skills/ui-design.zh.md)。未通過 [ui-review](../skills/ui-review.zh.md) 之前，畫面不算完成。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。

本逐步說明以 living admin 的 **Users** 頁（`apps/admin/src/features/users/users-page.tsx`）為宿主。它不加行業 domain、不加第二套殼、也不加新顏色 token。

## 何時使用

- 營運者需要在同一條路由看見列的表格與所選列的欄位。
- 計劃的 UI 一節仍沒有 ASCII 線框。
- 你即將為 admin 密度寫 Tailwind grid class。

不要用本頁改 zinc 色盤、在既有 admin 頂欄旁邊另造側欄，或跳過線框。

## 輸入（來自 layout-system）

| 輸入 | 本逐步說明 |
|---|---|
| Surface | `admin` |
| Density | `compact`（表格，不是公開推廣頁） |
| Nav pattern | **既有 admin 頂欄**（`apps/admin/src/router.tsx` 的 `AppShell`）。不要另造第三套 chrome。 |

## 1. 先畫 ASCII 線框

放進日期計劃或 PR。閱讀順序是 F 型：品牌 → 主導航 → 頁標題 → 主操作 → 清單 → 詳情。

```text
1280（在 AppShell max-w-4xl 之內）
[ AppShell: YSK Admin | Users Audit API keys Queues ........ Logout ]
[ PageHeader: Users                         Create user ]
[ md:grid-cols-12 gap-6
  list  col-span-5                 detail col-span-7
  [ filters / search ]             [ selected display name ]
  [ table: email | role | status ] [ fields, stacked labels ]
  numbers right-aligned            [ Suspend / Save ]
]

768: 允許同一套兩欄；PageHeader 操作可換行。

375:
  brand
  nav（換行或選單）
  title
  primary（全寬、可換行）
  list（全寬）
  detail（全寬，在清單下方）
  除表格外不可橫向捲動
```

zh-HK 標籤大約需要英文寬度的 **1.5 倍**。不要把按鈕 `width` 寫成固定 `px`。使用 `flex-wrap`。

## 2. 先用 kit 殼，再排欄

保留 `AppShell` + `PageHeader`。雙欄放在**頁面 children**，不是新的 layout 元件。

```tsx
<section className="space-y-6">
  <PageHeader title="Users" description="Create and suspend accounts." />
  <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
    <div className="min-w-0 md:col-span-5">{/* table */}</div>
    <div className="min-w-0 md:col-span-7">{/* detail */}</div>
  </div>
</section>
```

| 規則 | 做法 |
|---|---|
| 預設一欄 | `md` 之前用 `grid-cols-1` |
| 兩個區域 | `md:grid-cols-12`，`col-span-5`／`col-span-7`（清單次要、詳情主要），或 `md:grid-cols-2` |
| 間距 | 只用 `gap-4`／`gap-6`／`gap-8` |
| 三欄均分 | 不要，除非一欄明顯是主區 |
| 卡片裏再套卡片 | 一個表面；`border` + `rounded-md` 一次 |
| 把 `AppShell` 拉滿視窗 | 不要——維持 `max-w-4xl`。更寬的殼先問。 |

`min-w-0` 阻止表格撐破 grid track。

## 3. 對齊與 zh-HK

- 用 `space-y-4` 或 `space-y-6` 垂直堆疊。標籤在欄位**上方**。
- 表格：文字靠左；數量／狀態碼保持可讀；金額（如有）靠右。
- `PageHeader` 操作已經 `flex-wrap`。Create／Suspend 按鈕必須在 375 換行。
- 不要裁切繁體中文。寧可 `whitespace-normal`，不要用英文寬度牆。

## 4. 核對 375／768／1280

縮放視窗（或 Playwright viewport）確認：

| 寬度 | 預期 |
|---|---|
| 375 | 單欄；主操作全寬；除表格外無溢出 |
| 768 | 允許兩欄；沒有重疊 |
| 1280 | 仍在 `AppShell` 的 `max-w-4xl` 內；清單與詳情同一列 |

然後用 [ui-design](../skills/ui-design.zh.md) 處理 token、空白／錯誤／載入，以及 `@ysk-kit/web-sdk` hooks。宣告完成之前跑 [ui-review](../skills/ui-review.zh.md)。

## 版面報告（可複製）

```md
## Layout — /users (admin)
Density: compact
Nav: top-nav (existing AppShell)
Wireframe: 1280 list+detail 5/7; 375 stacked list then detail
Grid: md:grid-cols-12 gap-6, min-w-0 on panes
Next: ui-design → ui-review
```
