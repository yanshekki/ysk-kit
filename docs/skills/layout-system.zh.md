---
name: layout-system
description: >
  在既有 zinc 與 @ysk-kit/ui 內設計可預測的版面：ASCII 線框、AppShell、
  欄距、對齊、375/768/1280、zh-HK 寬度。新增殼層、dashboard 分欄、
  導航／側欄、清單+詳情或多欄表單時使用。
  中文：版面系統、殼、分欄、閱讀順序、響應式結構。
  不要用於改色盤、另發明第二套元件庫，或只改 API
  （元件用 ui-design；完成前用 ui-review）。
---

# Skill：版面系統

Language: [English](layout-system.md) · 中文

在既有 zinc 主題與 `@ysk-kit/ui` 內做出可預測的結構。不要重新設計品牌。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。元件實作跟 [ui-design](ui-design.zh.md)。完成前跟 [ui-review](ui-review.zh.md)。

## 觸發

- 新增或改動殼層、dashboard 分欄、側欄對頂欄、清單+詳情，或多欄表單。
- 使用者說「layout」、「排版」、「閱讀順序」或「響應式結構」。
- 計劃的 UI 段仍沒有線框。

不要用於揀新色盤、加深色模式，或另發明第二套元件庫。不要用於只改 API。只改文案的 i18n 不是本 skill。

## 輸入

| 輸入 | 必要 | 備註 |
|---|---|---|
| 表面 | 是 | `web` \| `admin` \| `mobile` \| `desktop` |
| 密度 | 是 | `comfortable`（公開 web）或 `compact`（admin 表格） |
| 導航模式 | 是 | 側欄（admin 優先）或頂欄（公開 web 優先） |

## 步驟

1. **ASCII 線框**：桌面（1280）與 375。標出分組與閱讀順序（F 型：品牌 → 主導航 → 頁標題 → 主動作 → 正文）。把線框放進日期計劃或 PR。例子：

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

2. **Kit 殼。** 用 `AppShell` + `PageHeader`。Admin：側欄（或沿用既有 admin 頂欄——不要發明第三套 chrome）。公開 web：頂欄。Desktop 與 web 相同。Mobile：React Native 導航（HIG／Material）；不要 import DOM 的 `@ysk-kit/ui`。

3. **欄。** 優先單欄 `mx-auto max-w-4xl px-4`。同一列要兩區時，用 `md:grid-cols-2` 或 12 欄 `grid`，溝槽 `gap-4`／`gap-6`／`gap-8`（Tailwind 4／6／8）。沒有明確主欄時不要三等欄。溝槽留在 spacing scale。

4. **對齊與節奏。** 用 `space-y-4` 或 `space-y-6` 堆疊。標籤在欄位上方，不要參差基線。表格：文字靠左，數字（金額、數量）靠右。`PageHeader` 動作已 `flex-wrap`。

5. **響應式。** 375：單欄、動作換行，除表格外不要橫向捲動。768：可以兩欄。1280：維持 `max-w-4xl`（不要把表單拉滿視埠）。三個寬度都要核對。

6. **CJK／zh-HK。** 按鈕、導航與表頭預留約 **1.5 倍** 英文字寬。不要為標籤寫死 `px` 寬度。用 `flex-wrap`；375 時不要裁切繁體中文。

7. **交接。** 用 [ui-design](ui-design.zh.md) 實作 token 與狀態。在 [ui-review](ui-review.zh.md) 的視覺與響應式方格全綠之前，不要宣稱畫面完成。

## 反模式

| 症狀 | 改為 |
|---|---|
| Hero、漸層 mesh、紫色光暈 | Zinc 頁、`AppShell`、資料先行 |
| 三欄沒有優先級 | 單欄，或兩欄並標明主窗格 |
| 卡片套卡片 | 一層表面；`border` + `rounded-md` 只用一次 |
| 固定 `px` 字牆／只夠英文的按鈕寬 | `flex-wrap`、1.5 倍 zh-HK 空間 |
| Mobile import DOM `@ysk-kit/ui` | RN 原語 + `@ysk-kit/ui-logic` |
| 跳過線框直接在 CSS 發明欄 | 先 ASCII，再 Tailwind grid |

kit 產品畫面不要把膽識花在裝飾上。Taste operator（`bolder`、`delight`、aurora）不在範圍內。

## 輸出格式

```md
## Layout — <route> (<web|admin|mobile|desktop>)
Density: comfortable | compact
Nav: sidebar | top-nav
Wireframe: (desktop 1280 + 375, grouping / reading order)
Grid: 1-col max-w-4xl | md:grid-cols-2 | 12-col + gutters 4/6/8
Next: ui-design → ui-review
```

## 完成條件

- [ ] 線框（桌面 + 375，分組與閱讀順序）在計劃或 PR
- [ ] `AppShell` + `PageHeader`（mobile 用 RN chrome）；沒有第三套殼
- [ ] 375／768／1280：不重疊，除表格外沒有橫向捲動
- [ ] zh-HK 標籤會換行；控件不是英文寬度
- [ ] [ui-review](ui-review.zh.md) 視覺 + 響應式全綠

## 升級／詢問

新導航模式、第三個斷點、深色模式或新顏色 token 之前，先問。不要在同一個畫面改動裡另開 `design-tokens` skill。

## 參考

- [ui-design](ui-design.zh.md)（zinc token、`@ysk-kit/ui`、表單）
- [ui-review](ui-review.zh.md)（視覺、閱讀順序、375／768／1280）
- jakubkrehel `better-layout`（分組、對齊、翻譯空間——改寫使用，不 vendor）
- Anthropic frontend-design 線框步驟（只取結構；留在 kit zinc）
