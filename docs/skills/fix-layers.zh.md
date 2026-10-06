---
name: fix-layers
description: >
  在不關閉 hexagonal 規則的前提下，修復 pnpm layers（dependency-cruiser）失敗。
  pnpm layers 失敗、客戶端 import 了 Prisma，或 /fix-layers 時使用。
---

# Skill：修復分層

Language: [English](fix-layers.md) · 中文

`pnpm layers` 失敗。閱讀 [hexagonal](../guides/hexagonal.zh.md) 與 `.dependency-cruiser.cjs`。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。

## 觸發

- `pnpm layers` 非零退出。
- dependency-cruiser 報告 `clients-no-server-infra`、`domain-no-infra`、`api-no-react-ui`、`contracts-leaf` 或 `sdk-ui-logic-no-node-react-prisma`。

## 輸入

| 輸入 | 必要 | 備註 |
|---|---|---|
| Cruiser 規則名稱 | 是 | 來自命令輸出 |
| 違規 import | 是 | 檔案 + specifier |

## 步驟

1. 讀 cruiser 規則名稱。
2. 移動 import。不要關閉規則。
3. 典型修復：
   - 客戶端需要資料 → 呼叫 `@ysk-kit/sdk`／`@ysk-kit/web-sdk`。
   - application 需要 Prisma → 注入 port；在 `infra/` 實作。
   - domain import 了 router → 刪掉。
   - contracts import 了 app → 把型別移回 `@ysk-kit/contracts`。
4. 再跑 `pnpm layers`。
5. 繼續 [驗證改動](verify-change.zh.md)。

## 驗證

- [ ] `pnpm layers` 全綠
- [ ] 沒有為了隱藏 import 而在 `.dependency-cruiser.cjs` 加 `forbidden` 例外

## 完成條件

行為不變、依賴圖合法，且 [驗證改動](verify-change.zh.md) 全綠。
