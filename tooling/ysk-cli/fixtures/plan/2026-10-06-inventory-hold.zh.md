# 計劃：Inventory Hold

Language: 英文配對 `2026-10-06-inventory-hold.md` · 中文 `2026-10-06-inventory-hold.zh.md`

| | |
|---|---|
| **Slug** | `inventory-hold` |
| **日期** | 2026-10-06 |
| **狀態** | draft |
| **正規檔** | `docs/plans/2026-10-06-inventory-hold.md` |
| **工作階段指針** | `/plan.md`（已 gitignore） |

法律：[AGENTS.zh.md](../../../../AGENTS.zh.md)。程序：[plan-feature](../../../../docs/skills/plan-feature.zh.md)。檢查：`pnpm ysk-kit plan --check docs/plans/2026-10-06-inventory-hold.zh.md`。

## 目標與使用者問題

店員需要為訂單預留庫存，取貨前不扣減現有量。notes 形狀的模組沒有 hold 數量。

## 範圍

- 包含：登入使用者在 `/v1/inventory-hold` 列出並建立 hold

## 非目標

- 不含：倉間調撥、條碼掃描、多倉庫存

## 假設

- SKU 已在相鄰 inventory 表，本切片用 id 參照。
- 除非使用者另有說明，hold 30 分鐘後過期。

## 受影響的 flavor／preset／capability

| 軸 | 值 | 備註 |
|---|---|---|
| Flavor | kit 本身 | SaaS API + web |
| Preset | 不適用 | |
| Capabilities | auth | 建立時 `requireAuth` |

## 現況與重用

重用 `ysk-kit add module inventory-hold --prisma --web`。沿用 `@ysk-kit/application` 的 `parsePageQuery`。不要另做一套 HTTP adapter。

| 路徑 | 符號 | 重用為 |
|---|---|---|
| `packages/contracts/src/errors.ts` | `FORBIDDEN` | 授權失敗 |
| `packages/sdk/src/client.ts` | `YskClient` | 新 resource |
| `packages/web-sdk/src/` | query-key helpers | `inventory-hold-hooks.ts` |

## 考慮過的方案

| 方案 | 複雜度 | 分層 | 遷移 | 客戶端 | 備註 |
|---|---|---|---|---|---|
| A：用 `add module` 開新切片 | 低 | contracts、api、sdk、web | 一個 Prisma model | web 列表／建立 | 跟 kit 產生器一致 |
| B：在既有 stock 列加欄 | 中 | 既有模組加客戶端 | 就地 alter | 每個 stock 畫面 | 把 hold 耦到 stock 寫入 |

**選定：** A  
**原因：** 新資源把 Prisma 留在新 infra 目錄，不擴大 stock DTO。

## 合約先行

DTO 名稱、欄位、error code、ts-rest 路徑。先加 `OkSchema`／`ErrSchema`，才寫 handler。

| 項目 | 名稱／路徑 | 備註 |
|---|---|---|
| DTO | `InventoryHoldDto` | id、skuId、qty、expiresAt |
| Command | `CreateInventoryHoldCommand` | skuId、qty |
| Error codes | 重用 `VALIDATION_FAILED`、`UNAUTHORIZED` | 不新增代碼 |
| 路徑 | `/v1/inventory-hold` | list + create |

## 資料模型／Prisma 與遷移

Model `InventoryHold`，欄位 `skuId`、`qty`、`authorId`、`expiresAt`。Prisma 留在 `apps/api/src/modules/inventory-hold/infra`。需要 `pnpm db:migrate`。

## 模組切片與分層

產生器寫出 `apps/api/src/modules/inventory-hold/{domain,application,infra}`。application 強制 qty > 0 與過期。application 不碰 Express 或 Prisma。

## SDK／web-sdk／客戶端表面

`packages/sdk/src/resources/inventory-hold.ts` 的 list／create。`packages/web-sdk/src/inventory-hold-hooks.ts`。Vite 頁在 `apps/web/src/features/inventory-hold/`。不要 raw `fetch`。

## Jobs／mail／realtime／notifications

沒有

## 安全與私隱

建立時 `requireAuth`。列表限呼叫者。不要把帶密鑰的 SKU 寫進日誌。不新增 envelope 例外。

## 測試計劃

只用 memory-repo：建立 hold、拒絕 qty 0、列表只回呼叫者列、envelope error code。

- [ ] qty 與過期的 memory-repo 案例
- [ ] 未授權的 envelope／error code 案例
- [ ] hooks 只經 SDK

## 驗證命令

| 命令 | 預期結果 |
|---|---|
| `pnpm layers` | 退出碼 0；客戶端不碰 Express／Prisma／jobs／mail／push／AWS SDK |
| `pnpm typecheck` | 退出碼 0 |
| `pnpm test` | 退出碼 0，含 inventory-hold memory-repo 測試 |
| `pnpm gen:openapi` | 出現 `/v1/inventory-hold` |
| `pnpm ysk-kit check agent` | 印出 `ysk-kit check agent: ok` |
| `pnpm ysk-kit plan --check docs/plans/2026-10-06-inventory-hold.zh.md` | 印出 `ysk-kit plan --check: ok` |

### 人手檢查

- [ ] UI 流程：登入、打開 Holds、建立 qty 1、表格出現該列
- [ ] Envelope 形狀 `{ ok: true, data }`／`{ ok: false, error }`
- [ ] 授權角色：匿名建立回 401

## 文件／變更紀錄／changeset

- [ ] recipe 不變；不改 skill
- [ ] 不改變更紀錄（只在產品示範模組）
- [ ] 沒有 changeset

## 風險與回滾

過期 hold 可能洩漏預留量。回滾：還原遷移並卸下產生切片。

## 任務清單

1. [ ] 合約
   - **檔案：** `packages/contracts/src/dto/inventory-hold.ts`、`packages/contracts/src/api/inventory-hold.ts`
   - **介面／合約／資料：** DTO + command + list／create 路徑
   - **風險：** 多造 error code
   - **回滾：** 刪那兩個檔
   - **驗收：** DTO + `OkSchema`／`ErrSchema` 存在；沒有 TypeScript `enum`
2. [ ] 骨架
   - **檔案：** `apps/api/src/modules/inventory-hold/` 產生結果
   - **介面／合約／資料：** Prisma model 合併
   - **風險：** 人手開目錄
   - **回滾：** 刪切片
   - **驗收：** `ysk-kit add module inventory-hold --prisma --web`
3. [ ] Application 規則
   - **檔案：** `application/inventory-hold-service.ts`
   - **介面／合約／資料：** qty > 0、30 分鐘過期
   - **風險：** 在 application 寫 Prisma
   - **回滾：** 還原 service
   - **驗收：** 記憶體 port 測試通過
4. [ ] 客戶端
   - **檔案：** sdk resource、web-sdk hooks、Vite 頁
   - **介面／合約／資料：** 不超出合約
   - **風險：** raw fetch
   - **回滾：** 刪三個客戶端檔
   - **驗收：** 只用 SDK／web-sdk
5. [ ] 驗證
   - **檔案：** 無額外檔
   - **介面／合約／資料：** OpenAPI 路徑已加
   - **風險：** layers 圖
   - **回滾：** 還原 commit
   - **驗收：** 上表驗證命令全綠
6. [ ] 文件
   - **檔案：** 本計劃配對
   - **介面／合約／資料：** 無
   - **風險：** 中英漂移
   - **回滾：** 刪計劃檔
   - **驗收：** 中英配對深度一致

## 未決問題

- 過期 hold 應由 job 自動釋放，還是只在讀取時處理？
