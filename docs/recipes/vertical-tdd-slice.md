# Vertical TDD slice

Language: [中文](vertical-tdd-slice.zh.md) · English

Implement **one seam** with **one red `it()`**, then the minimum code that turns it green. Do not write every test in the plan and then the module (horizontal). Skills: [test-plan](../skills/test-plan.md), [write-tests](../skills/write-tests.md) (Vertical TDD slice). Concepts: [testing guide](../guides/testing.md).

This walkthrough uses the generated `note` module (`ysk-kit add module note --prisma --web`) in a **product destination**. The living kit does not mount `/v1/note`. Do not add notes to this repository.

## 1. Rank the seam

After [add-module](add-module.md), the generator already writes create + list scoped to `authorId`, plus an unauthenticated HTTP case. Suppose the product now needs **get by id** and the highest risk is isolation: another author must not read the row.

| Risk | Layer | File | First red `it()`? |
|---|---|---|---|
| Other author `get` leaks the row | application (memory repo) | `apps/api/src/modules/note/infra/note.test.ts` (extend; do not mkdir a second suite) | **yes** |
| Missing session on GET | HTTP envelope | same file, SuperTest | next slice |
| Contract DTO for get | contracts | `packages/contracts/src/dto/note.ts` | only if the path is new |

Bug fixes stay **regression-first**. This page is the feature path.

## 2. Write one red test (before)

Confirm it fails. Do not implement `get` first.

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

**Before:** red — `createNoteService` has no `get`, or `get` ignores `authorId` and returns the other author’s row.

Forbidden at this step: also writing the unauthenticated HTTP `it`, the SDK `it`, and the page test “so they exist”.

## 3. Minimum implementation (after)

Contracts first if the path is missing (`OkSchema` / `ErrSchema` on GET `/v1/note/:id`). Then **one** application method. Prisma stays in `infra/` and uses the same `authorId` filter.

```ts
get: async (authorId: string, id: string) => {
  const row = await repo.findByIdForAuthor(id, authorId);
  if (!row) throw new AppError('NOT_FOUND');
  return row;
},
```

Re-run the named test until green. Then implement the HTTP map (Express **and** Fastify registers) as the **next** slice, with its own red `it()`:

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

Keep each slice green before starting the next. SDK and UI come last, still one `it()` at a time.

## Shape to copy

| | Horizontal (forbidden) | Vertical (this recipe) |
|---|---|---|
| Tests | All `it()` in the plan land first | One highest-risk `it()` |
| Code | Whole module after the suite is red | Minimum code for that `it()` |
| HTTP | One adapter only | Express **and** Fastify when the seam is HTTP |
| Ports | Live Redis / Prisma in the unit test | `createMemoryNoteRepository()` / `createMemoryInput()` |

## Verify the slice

```bash
pnpm --filter @ysk-kit/api exec vitest run src/modules/note/infra/note.test.ts -t 'another author'
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

Report shape: [write-tests output format](../skills/write-tests.md#output-format).
