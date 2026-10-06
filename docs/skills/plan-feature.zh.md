---
name: plan-feature
description: >
  在合約與程式之前，把 YSK Kit 功能計劃寫入 docs/plans/<yyyy-mm-dd>-<slug>.md。
  使用者要求計劃、plan.md、設計，或跨表面改動時使用。
---

# Skill：計劃功能

Language: [English](plan-feature.md) · 中文

在合約與實作之前寫下可保存的計劃。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。模板：[docs/plans/_template.zh.md](../plans/_template.zh.md)。目錄：[docs/plans/](../plans/README.zh.md)。

## 觸發

- 使用者要求計劃、`plan.md` 或設計。
- 工作會新增或改動 HTTP 路由、Prisma model、capability，或 SDK／客戶端表面。
- 工作跨越超過一個套件或 app。
- 範圍包括授權、密鑰、webhook 或新的 envelope 例外。

可略過（除非被要求）：只改錯字、只改註解，或單一檔案的機械式重新命名。

## 輸入

| 輸入 | 必要 | 備註 |
|---|---|---|
| Kebab `slug` | 是 | 用 `booking-reminders`，不用 `BookingReminders` |
| 目標／使用者問題 | 是 | 一段 |
| Flavor／preset／capability | 知道就填 | 若會改變切片而缺失，問一次 |
| 日期 | 否 | 預設今天（本地）。CLI：`--date YYYY-MM-DD` |

## 步驟

1. 確認需要計劃（見觸發）。若使用者要先審計劃，寫到第 4 步就停，等他們接受。
2. 選 kebab slug。不要另發明一套命名。
3. 建立日期檔：

   ```bash
   pnpm ysk-kit plan <slug>
   ```

   會寫入 `docs/plans/<yyyy-mm-dd>-<slug>.md`、`.zh.md` 配對，以及根目錄 `plan.md` 指針（已 gitignore）。`--force` 覆寫。`--date` 固定曆日。
4. 填滿每個模板章節。不要刪標題。優先重用既有 error code。列出非目標。每條清單都寫驗收句。
5. 工作階段 `plan.md` 只做指向日期檔的指針。請改日期檔。
6. 使用者接受計劃之後（或他們要求直接執行時），接 [加模組](add-module.zh.md)、[加能力](add-capability.zh.md) 或 [envelope-api](envelope-api.zh.md)。合約先行。
7. 實作完成後走 [驗證改動](verify-change.zh.md)。

## 驗證

- [ ] 日期路徑符合 `docs/plans/<yyyy-mm-dd>-<kebab-slug>.md`
- [ ] 中文配對存在，章節相同
- [ ] 模板每個標題都在
- [ ] 根目錄 `plan.md`（若存在）寫明日期檔
- [ ] 計劃存在之前沒有開始實作（除非使用者明確豁免）

## 完成條件

範圍／非目標、合約、資料模型、分層、客戶端、安全、測試、驗證命令，以及有序清單都具體到另一個 agent 不用猜也能實作，計劃才算可執行。
