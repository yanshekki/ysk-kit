---
name: fix-layers
description: >
  在不關閉 hexagonal 規則的前提下，修復 pnpm layers（dependency-cruiser）失敗。
  pnpm layers 失敗、客戶端 import 了 Prisma，或 /fix-layers 時使用。
  中文：分層、dependency-cruiser、客戶端 Prisma。
  不要用於未經明確批准就改 .dependency-cruiser.cjs。
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
3. 套用下表。**除非使用者在本回合明確批准改規則，否則不要改 `.dependency-cruiser.cjs`。**

| 規則 | 典型壞 import | 正確修復 |
|---|---|---|
| `clients-no-server-infra` | `apps/web` → `@prisma/client`、Express、jobs、mail、llm、`@ysk-kit/observability` | 呼叫 `@ysk-kit/sdk`／`@ysk-kit/web-sdk`。Prisma 留在 API `infra/` |
| `domain-no-infra` | `application/` 或 `domain/` → Prisma、Express、Fastify、BullMQ | 注入 port；在 `infra/` 實作 |
| `api-no-react-ui` | `apps/api` → `react`、`@ysk-kit/ui`、`@ysk-kit/web-sdk` | UI 留在 apps/web\|admin；API 回 envelope JSON |
| `contracts-leaf` | `packages/contracts` → sdk、apps、Prisma | 把型別移進 contracts；其他套件 import contracts |
| `sdk-ui-logic-no-node-react-prisma` | `packages/sdk` → `react`、`node:fs`、Prisma | sdk 維持 fetch；UI 放 `@ysk-kit/ui` |

4. 再跑 `pnpm layers`。
5. 繼續 [驗證改動](verify-change.zh.md)。

## 驗證

- [ ] `pnpm layers` 全綠
- [ ] `.dependency-cruiser.cjs` 未改，或使用者在本回合批准了規則編輯

## 輸出格式

```md
## Layers — <rule>
From: <file>
To: <specifier>
Fix: moved to <path> | injected port
Cruiser file: unchanged | edited (quoted approval)
```

## 完成條件

行為不變、依賴圖合法、cruiser 檔沒有被默默改過，且 [驗證改動](verify-change.zh.md) 全綠。

## 反模式

| 症狀 | 改為 |
|---|---|
| 註解掉一條 `forbidden` 規則 | 移動 import |
| 用 `doNotFollow` 藏資料夾 | 修來源 |
| 客戶端用 `fetch` 避開 Prisma import | 仍然必須用 SDK |

## 升級／詢問

改 `.dependency-cruiser.cjs` 之前先問。在輸出裡引用使用者的批准。
