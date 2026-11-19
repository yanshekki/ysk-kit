---
name: plan-feature
description: >
  在合約與程式之前，把 YSK Kit 功能計劃寫入 docs/plans/<yyyy-mm-dd>-<slug>.md。
  使用者要求計劃、plan.md、設計，或跨表面改動時使用。
  中文：計劃、plan.md、合約之前。
  不要用於只改錯字，或單一檔案的機械式重新命名。
---

# Skill：計劃功能

Language: [English](plan-feature.md) · 中文

在合約與實作之前寫下可保存的計劃。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。精簡模板：[docs/plans/_template-lean.zh.md](../plans/_template-lean.zh.md)。完整模板：[docs/plans/_template.zh.md](../plans/_template.zh.md)。目錄：[docs/plans/](../plans/README.zh.md)。記憶：[docs/agent/NOW.md](../agent/NOW.md)。

## 觸發

- 使用者要求計劃、`plan.md` 或設計。
- 預設 **精簡**。只有 HTTP 路由、Prisma model、授權、密鑰、webhook 或新的 envelope 例外才用 `--full`。

可略過（除非被要求）：只改錯字、只改註解，或單檔機械式重新命名。

## 輸入

| 輸入 | 必要 | 備註 |
|---|---|---|
| Kebab `slug` | 是 | 用 `booking-reminders`，不用 `BookingReminders` |
| 目標／使用者問題 | 是 | 一段（決定，最多 15 行） |
| `--full` | 否 | 19 章模板（`plan: full`） |
| `--zh` | 否 | 才寫中文配對。預設不寫。 |
| 日期 | 否 | 預設今天（本地）。CLI：`--date YYYY-MM-DD` |

## 步驟

1. 確認需要計劃。若使用者要先審計劃，`--check` 之後停。
2. 選 kebab slug。
3. 先探索模組、合約、SDK resource、hooks、產生器（`ysk-kit add module`）。
4. 建立日期檔：

   ```bash
   pnpm ysk-kit plan <slug>
   pnpm ysk-kit plan <slug> --full
   pnpm ysk-kit plan <slug> --zh
   ```

   預設：英文精簡計劃（`plan: lean`）加已 gitignore 的 `plan.md`。`--lean` 與 `--full` 不可並用。`--force` 覆寫。
5. 填標題。精簡六章：決定、檔案、測試、風險、完成、未決問題。決定最多 15 行。`/compact` 之後只重讀決定。空章節與 `none`／`n/a`／`沒有` 可以。未決項目留在未決問題。路徑：[sdd-path](../plans/sdd-path.zh.md)。
6. 跑 `pnpm ysk-kit plan --check docs/plans/<yyyy-mm-dd>-<slug>.md`。缺標題失敗。`plan: lean` 用精簡標題；未標記與舊檔用完整標題。
7. 批准後（或使用者要求直接執行時），走 implement 路由器：只打開 [index](index.zh.md) 裡對得上的程序。

## 驗證

- [ ] 日期路徑符合 `docs/plans/<yyyy-mm-dd>-<kebab-slug>.md`
- [ ] 只有用了 `--zh` 才有中文配對
- [ ] 必要標題都在
- [ ] `pnpm ysk-kit plan --check` 通過
- [ ] 根目錄 `plan.md`（若存在）寫明日期檔

## 輸出格式

```md
## Plan — docs/plans/<date>-<slug>.md
Check: ok
Gate: waiting for user | approved | waived
Next: implement
```

## 完成條件

另一個 agent 看決定、檔案、測試、風險、完成就能實作，不用猜。未決問題已寫明。

## 反模式

| 症狀 | 改為 |
|---|---|
| 先實作再補計劃 | 停下來；先寫日期檔 |
| 刪掉必要標題 | 填它；`plan --check` |
| 只改文件卻預設 `--full` | 留在精簡 |
| 搜 14 天以前的 `docs/plans/` | 只有使用者點名才搜 |

## 升級／詢問

flavor／db／capability 缺失且會改變切片時，問一次。
