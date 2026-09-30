# Skill：修復分層

Language: [English](fix-layers.md) · 中文

`pnpm layers` 失敗。閱讀 [hexagonal](../guides/hexagonal.zh.md) 與 `.dependency-cruiser.cjs`。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。

## 步驟

1. 讀 cruiser 規則名稱（`clients-no-server-infra`、`domain-no-infra`、`api-no-react-ui`、`contracts-leaf`、`sdk-ui-logic-no-node-react-prisma`）。
2. 移動 import，不要關閉規則。
3. 典型修復：
   - 客戶端需要資料 → 呼叫 `@ysk-kit/sdk` / `@ysk-kit/web-sdk`。
   - application 需要 Prisma → 注入 port；在 `infra/` 實作。
   - domain import 了 router → 刪掉。
4. 再跑 `pnpm layers`。
5. 繼續 [驗證改動](verify-change.zh.md)。
