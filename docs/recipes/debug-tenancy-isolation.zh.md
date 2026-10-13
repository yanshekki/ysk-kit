# 除錯租戶隔離

Language: [English](debug-tenancy-isolation.md) · 中文

已登入的組織 A 成員可以讀組織 B 的成員。用紅燈記憶體 port 測試重現，列出假設，只修**一個**成因，然後保留回歸。Skills：[debug-issue](../skills/debug-issue.zh.md)、[security-review](../skills/security-review.zh.md)（[租戶](../skills/security-review/references/tenancy.zh.md)）。不要啟動 Redis 或 Stripe。

本逐步說明使用 living 的 `organizations` 模組（`apps/api/src/modules/organizations/`）。這是 kit 身分，不是行業 overlay。

## 症狀

```text
GET /v1/organizations/{orgB}/members
Authorization: Bearer <orgA member>
→ 200 { ok: true, data: [ … org B emails … ] }
```

預期：`403` `{ ok: false, error: { code: 'FORBIDDEN' } }`（本模組的 `requireMember`），或產品選擇隱藏存在時用 `NOT_FOUND`。模板：`application/` 裏的 `requireMember`／`requireBiller`，不是 Express／Fastify register。

## 先寫紅燈測試

確認它是紅燈（若已綠——洩漏在別處）。擴充 `organization.app.test.ts`；不要另開一套。

```ts
it('forbids a member of org A from listing org B members', async () => {
  const app = createApp(createMemoryInput().input);
  const ownerA = await request(app).post('/v1/auth/register').send({
    email: 'a@ysk.hk',
    password: 'password1',
    displayName: 'A',
  });
  const ownerB = await request(app).post('/v1/auth/register').send({
    email: 'b@ysk.hk',
    password: 'password1',
    displayName: 'B',
  });
  const orgA = await request(app)
    .post('/v1/organizations')
    .set('authorization', `Bearer ${ownerA.body.data.accessToken}`)
    .send({ name: 'Org A' });
  const orgB = await request(app)
    .post('/v1/organizations')
    .set('authorization', `Bearer ${ownerB.body.data.accessToken}`)
    .send({ name: 'Org B' });
  expect(orgA.status).toBe(201);
  const res = await request(app)
    .get(`/v1/organizations/${orgB.body.data.id}/members`)
    .set('authorization', `Bearer ${ownerA.body.data.accessToken}`);
  expect(res.status).toBe(403);
  expect(res.body).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
});
```

```bash
pnpm --filter @ysk-kit/api exec vitest run src/modules/organizations/infra/organization.app.test.ts -t 'org B'
```

洩漏在 HTTP 時，對 `createFastifyApp(createMemoryInput())` 加同一條 SuperTest。

## 假設（改程式之前先填）

一次只驗證**一列**。被推翻就劃掉。沒有測試過的理論不要「先修」。

| # | 假設 | 如何推翻 |
|---|---|---|
| 1 | `application/` 的 `members()` 沒有呼叫 `requireMember` | 讀 `organization-service.ts` 的 `members`；紅燈測試仍是 200 |
| 2 | 記憶體 repo 的 `listMembers` 不理 `organizationId` | 用兩個組織呼叫 service；`listMembers(orgB)` 回傳組織 A 的列 |
| 3 | Fastify register 漏了 handler（Express 看起來正常） | `createFastifyApp` SuperTest 404，Express 200 |
| 4 | 授權只寫在 router | 在 `register*Routes` 搜 `orgRoleCan`／membership；把檢查移進 `application/` |
| 5 | 夾具讓同一使用者當了兩個組織的 owner | 用上面的 `a@ysk.hk`／`b@ysk.hk`；若兩個 token 都是 `ownerA`，測試無效 |

不要為了「看見洩漏」而把邀請 token、JWT 或成員電郵寫進日誌。斷言 `error.code` 與 status。

## 修復模式

授權在 `application/`（kit 既有模板）：

```ts
members: async (actorId: string, organizationId: string) => {
  await requireMember(organizationId, actorId);
  const rows = await deps.orgs.listMembers(organizationId);
  return Promise.all(rows.map(hydrateMember));
},
```

`requireMember` → 組織不存在 `NOT_FOUND`；沒有會籍 `FORBIDDEN`。Repository 一律以 `organizationId` 為鍵。若列表查詢錯了，記憶體與 Prisma repo 要一齊改。

## 跨租戶 + 供應鏈清單（短）

紅燈測試開着時走這些。完整清單：[租戶](../skills/security-review/references/tenancy.zh.md)、[供應鏈](../skills/security-review.zh.md#供應鏈)。

| 檢查 | 通過 |
|---|---|
| 另一組織 → 此 use case 回 `FORBIDDEN` 或 `NOT_FOUND` | 保留記憶體 port `it()` |
| 授權在 `application/`，不在 `register*Routes` | Grep 乾淨 |
| 接縫是 HTTP 時，Express **與** Fastify 同一斷言 | 兩邊 SuperTest |
| 沒有為了「蓋過」隔離而加新的 runtime HTTP 客戶端／PHP SDK | 隔離是伺服器規則 |
| 此次修復沒有從未知來源 `npx skills add` | Skills 維持 kit 副本 |
| 沒改 GitHub Actions，或必須改 `.github/` 時以 SHA 釘住 action | Workflow 也是供應鏈 |

新的 runtime 依賴仍然**先問**。沒有新信任邊界的傳遞依賴 bump 不是此 skill。

## 驗證

```bash
pnpm --filter @ysk-kit/api exec vitest run src/modules/organizations/infra/organization.app.test.ts -t 'org B'
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

保留回歸。用症狀命名。輸出形狀：[debug-issue](../skills/debug-issue.zh.md#輸出格式)。
