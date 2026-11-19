---
plan: lean
---

# 計劃：{{title}}

| | |
|---|---|
| **Slug** | `{{slug}}` |
| **日期** | {{date}} |
| **狀態** | draft |
| **正規檔** | `docs/plans/{{date}}-{{slug}}.md` |

法律：[AGENTS.zh.md](../../AGENTS.zh.md)。程序：[plan-feature](../skills/plan-feature.zh.md)。檢查：`pnpm ysk-kit plan --check docs/plans/{{date}}-{{slug}}.zh.md`。`/compact` 之後只重讀決定。

## 決定

要做甚麼、為甚麼。最多 15 行。

## 檔案

要新增或改動的路徑。既有模組、合約與產生器能用就重用。

## 測試

記憶體 port。given／when／then。不涵蓋範圍。

## 風險

可能出錯之處，以及如何回滾。

## 完成

命令與預期的一行結果。

## 未決問題

未解決的項目。寫 `沒有` 也可以。
