# 垂直 TDD 切片

Language: [English](vertical-tdd-slice.md) · 中文

用**一條接縫**、**一條紅燈 `it()`** 實作，再寫讓它轉綠的最少程式。不要先寫計劃裏每一條測試再寫模組（橫切）。Skills：[test-plan](../skills/test-plan.zh.md)、[write-tests](../skills/write-tests.zh.md)（垂直 TDD 切片）。概念：[測試指南](../guides/testing.zh.md)。

本逐步說明使用產生出來的 `note` 模組（`ysk-kit add module note --prisma --web`），寫在**產品目的地**。living kit 不掛 `/v1/note`。不要把 notes 加進本倉。

## 1. 為接縫排序

完成 [加模組](add-module.zh.md) 之後，產生器已寫好以 `authorId` 為範圍的 create + list，以及未登入的 HTTP 案例。假設產品現在需要 **按 id 讀取**，最高風險是隔離：另一個作者不可讀該列。

| 風險 | 層 | 檔案 | 第一條紅燈 `it()`？ |
|---|---|---|---|
| 另一作者 `get` 洩漏該列 | application（記憶體 repo） | `apps/api/src/modules/note/infra/note.test.ts`（擴充；不要另開一套） | **是** |
| GET 沒有 session | HTTP envelope | 同一檔，SuperTest | 下一切片 |
| get 的合約 DTO | contracts | `packages/contracts/src/dto/note.ts` | 僅在路徑是新的時候 |

修 bug 維持**回歸先行**。本頁是功能路徑。

## 2. 先寫一條紅燈測試（之前）

確認它失敗。不要先實作 `get`。

```ts
it('returns NOT_FOUND when another author gets the row', async () => {
  const service = createNoteService(createMemoryNoteRepository());
  const created = await service.create('11111111-1111-1111-1111-111111111111', {
    title: 'Hello',
    body: 'World',
  });

  await expect(
    service.get('22222222-2222-2222-2222-222222222222', created.id),
  ).rejects.toMatchObject({ code: 'NOT_FOUND' });
});
```

```bash
pnpm --filter @ysk-kit/api exec vitest run src/modules/note/infra/note.test.ts -t 'another author'
```

**之前：** 紅燈——`createNoteService` 沒有 `get`，或 `get` 不理 `authorId`、把另一作者的列交出去。

此步禁止：順便把未登入 HTTP `it`、SDK `it` 與頁面測試「先寫好放着」。

## 3. 最少實作（之後）

若路徑尚未存在，先改合約（GET `/v1/note/:id` 的 `OkSchema`／`ErrSchema`）。然後**一個** application 方法。Prisma 留在 `infra/`，用同一條 `authorId` 過濾。

```ts
get: async (authorId: string, id: string) => {
  const row = await repo.findByIdForAuthor(id, authorId);
  if (!row) throw new AppError('NOT_FOUND');
  return row;
},
```

重跑具名測試直至轉綠。然後把 HTTP map（Express **與** Fastify register）當**下一**切片，再寫它自己的紅燈 `it()`：

```ts
it('returns NOT_FOUND for another author on GET /v1/note/:id', async () => {
  const mem = createMemoryInput();
  const app = createApp(mem.input);
  const owner = await request(app).post('/v1/auth/register').send({
    email: 'owner@ysk.hk',
    password: 'password1',
    displayName: 'Owner',
  });
  const other = await request(app).post('/v1/auth/register').send({
    email: 'other@ysk.hk',
    password: 'password1',
    displayName: 'Other',
  });
  const created = await request(app)
    .post('/v1/note')
    .set('authorization', `Bearer ${owner.body.data.accessToken}`)
    .send({ title: 'Hello', body: 'World' });
  const res = await request(app)
    .get(`/v1/note/${created.body.data.id}`)
    .set('authorization', `Bearer ${other.body.data.accessToken}`);
  expect(res.status).toBe(404);
  expect(res.body).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
});
```

每一切片轉綠之後，才開始下一條。SDK 與 UI 放最後，仍然一次一條 `it()`。

## 可複製的形狀

| | 橫切（禁止） | 垂直（本操作手冊） |
|---|---|---|
| 測試 | 計劃裏所有 `it()` 先落地 | 最高風險一條 `it()` |
| 程式 | 整份模組等測試套件全紅之後再寫 | 只為該 `it()` 寫最少程式 |
| HTTP | 只測一個 adapter | 接縫是 HTTP 時，Express **與** Fastify |
| Port | 單元測試啟動 Redis／Prisma | `createMemoryNoteRepository()`／`createMemoryInput()` |

## 驗證此切片

```bash
pnpm --filter @ysk-kit/api exec vitest run src/modules/note/infra/note.test.ts -t 'another author'
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

報告形狀：[write-tests 輸出格式](../skills/write-tests.zh.md#輸出格式)。
