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

1. 確認需要計劃（見觸發）。若使用者要先審計劃，寫到第 5 步就停，等他們接受。
2. 選 kebab slug。不要另發明一套命名。
3. **先探索再計劃。** 搜模組、`packages/contracts`、SDK resource、web-sdk hooks、產生器（`ysk-kit add module`）。記下會重用甚麼。
4. 建立日期檔：

   ```bash
   pnpm ysk-kit plan <slug>
   ```

   會寫入 `docs/plans/<yyyy-mm-dd>-<slug>.md`、`.zh.md` 配對，以及根目錄 `plan.md` 指針（已 gitignore）。`--force` 覆寫。`--date` 固定曆日。
5. 填滿每個模板章節。不要刪標題。在合約之前寫「現況與重用」，範圍／非目標旁邊寫「假設」，並寫「考慮過的方案」（有真正替代時兩個做法，或 `單一明顯做法 — 原因`）。每條清單寫明檔案、介面／合約／資料、風險、回滾、驗收。每條驗證命令有預期結果；有 UI／envelope／授權時加人手檢查。優先重用既有 error code。未決項目放未決問題，不要默默猜測。授權、密鑰或 webhook 在範圍內時，跟隨 [security-review](security-review.zh.md)（並按適用情況跟隨 [webhook-handling](webhook-handling.zh.md)／[db-migration](db-migration.zh.md)）。
6. 工作階段 `plan.md` 只做指向日期檔的指針。請改日期檔。若工具寫了原生計劃（Grok 工作階段 `plan.md`、Cursor `.cursor/plans/`、Copilot `/memories/session/plan.md` 等），抄進日期模板。對照：[docs/plans/README.zh.md](../plans/README.zh.md)。
7. 執行 `pnpm ysk-kit plan --check docs/plans/<yyyy-mm-dd>-<slug>.md`（及 `.zh.md` 配對）。缺標題或仍是佔位內容就不算完整。
8. 使用者接受計劃之後（或他們要求直接執行時），接 [加模組](add-module.zh.md)、[加能力](add-capability.zh.md) 或 [envelope-api](envelope-api.zh.md)。合約先行。批准之前不要改專案檔，除非使用者豁免。
9. 若使用者拒絕計劃或說太短，補上缺的章節，不要縮短。`/compact` 或長工作階段之後，繼續之前先重讀日期計劃檔。不要退出工具的 plan mode 去交一份草稿。
10. 實作完成後走 [驗證改動](verify-change.zh.md)。

## 驗證

- [ ] 日期路徑符合 `docs/plans/<yyyy-mm-dd>-<kebab-slug>.md`
- [ ] 中文配對存在，章節相同
- [ ] 模板每個標題都在，而且不是佔位內容
- [ ] 兩份檔的 `pnpm ysk-kit plan --check` 都通過
- [ ] 根目錄 `plan.md`（若存在）寫明日期檔
- [ ] 計劃存在之前沒有開始實作（除非使用者明確豁免）

## 完成條件

每個模板章節都已填、方案與重用已寫明、驗證命令有預期結果，而且另一個 agent 不用猜也能實作，計劃才算可執行。
