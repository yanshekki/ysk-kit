# 租戶與授權

Language: [English](tenancy.md) · 中文

上層：[安全審查](../../security-review.zh.md)。ASVS 5.0 V8，尤其 V8.4.1（L2 跨租戶控制）。

## 規則

每個接受 `organizationId`（或其他租戶鍵）的 use case，必須在 **`application/` 驗證 membership 與角色**，然後每個 repository 查詢都帶該租戶鍵。Router 只解析 envelope。

## 本倉範本

`apps/api/src/modules/billing/application/billing-service.ts` → `requireBiller`：

1. `orgs.findById(organizationId)` → 沒有 org → `NOT_FOUND`（若產品不想對陌生人洩漏 id 是否存在，可全程用 `NOT_FOUND`；billing 是先 `NOT_FOUND` 再在 membership 失敗時 `FORBIDDEN`）。
2. `orgs.findMembership(organizationId, userId)` + `@ysk-kit/contracts` 的 `orgRoleCan(role, 'org.billing')` → 失敗 → `FORBIDDEN`。
3. Repository 以 `organizationId` 為鍵（`findByOrganizationId`，不要「所有列」）。

Organizations 模組：`organization-service.ts` 的 `requireMember`／`requireOrg`。`orgRoleCan` 權限在 `packages/contracts/src/enums/org-role.ts`。

## 產生出來的模組

`ysk-kit add module` 預設是 `authorId`，不是 `organizationId`。若資源以 org 為範圍：

- Prisma model **與** DTO 都改為 `organizationId`。
- 讀寫之前在 `application/<name>-service.ts` 查 membership。
- Memory 與 Prisma repository 都按 org 過濾。
- 測試：org A 的 actor 不能讀寫 org B（`FORBIDDEN` 或 `NOT_FOUND`）。

## 檔案與其他擁有者

`createFileService` 以 `ownerId` 為鍵。沒有擁有權檢查就列出或下載別人的 `fileId` 是 IDOR。API keys（`apps/api/src/modules/api-keys`）同一原則。

## Error codes

| 情況 | 代碼 |
|---|---|
| 未登入 | `UNAUTHENTICATED` |
| 已登入，租戶或角色不對 | `FORBIDDEN` |
| 不想讓呼叫者知道資源是否存在 | `NOT_FOUND`（產品決定；寫進計劃） |
| Body 未過 Zod | `VALIDATION_FAILED` |

不要在 Fastify／Express `register*Routes` 做授權。Domain 不碰 HTTP。

## Memory-port 測試（必要）

在 `application/*.test.ts` 用 `create-memory-input`／記憶體 repo：

- 有正確角色的成員走成功路徑。
- 其他 organization 的使用者 → `FORBIDDEN` 或 `NOT_FOUND`。
- 權限不足的成員（例如 `MEMBER` 呼叫 `org.billing`）→ `FORBIDDEN`。
- 未認證路徑在 HTTP 層覆蓋（`app.test.ts` + `app-fastify.test.ts`）。

不要為了證明租戶隔離而啟動 Stripe 或資料庫。
