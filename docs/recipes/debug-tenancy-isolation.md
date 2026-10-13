# Debug tenancy isolation

Language: [中文](debug-tenancy-isolation.zh.md) · English

A signed-in member of organisation A can read organisation B’s members. Reproduce with a red memory-port test, list hypotheses, fix **one** cause, then keep the regression. Skills: [debug-issue](../skills/debug-issue.md), [security-review](../skills/security-review.md) ([tenancy](../skills/security-review/references/tenancy.md)). Do not start Redis or Stripe.

This walkthrough uses the living `organizations` module (`apps/api/src/modules/organizations/`). It is kit identity, not an industry overlay.

## Symptom

```text
GET /v1/organizations/{orgB}/members
Authorization: Bearer <orgA member>
→ 200 { ok: true, data: [ … org B emails … ] }
```

Expected: `403` `{ ok: false, error: { code: 'FORBIDDEN' } }` (this module’s `requireMember`), or `NOT_FOUND` if the product hides existence. Template: `requireMember` / `requireBiller` in `application/`, not in the Express/Fastify register.

## Red test first

Confirm it is red (or already green — then the leak is elsewhere). Extend `organization.app.test.ts`; do not mkdir a second suite.

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

When the leak is HTTP, add the same SuperTest against `createFastifyApp(createMemoryInput())`.

## Hypotheses (fill before changing code)

Verify **one row at a time**. Strike a row when falsified. Do not “fix” a theory you have not tested.

| # | Hypothesis | Falsify by |
|---|---|---|
| 1 | `requireMember` is missing on `members()` in `application/` | Red test still 200 after you log `error.code`; read `organization-service.ts` `members` |
| 2 | Memory repo `listMembers` ignores `organizationId` | Call the service with two orgs; `listMembers(orgB)` returns org A rows |
| 3 | Fastify register omits the handler (Express looks fine) | `createFastifyApp` SuperTest 404 vs Express 200 |
| 4 | Authz lives only in the router | Grep `register*Routes` for `orgRoleCan` / membership; move the check into `application/` |
| 5 | Fixture used the same user as owner of both orgs | Distinct `a@ysk.hk` / `b@ysk.hk` as above; if both tokens are `ownerA`, the test is invalid |

Do not log invite tokens, JWT, or member emails “to see the leak”. Assert `error.code` and status.

## Fix pattern

Authorization in `application/` (already the kit template):

```ts
members: async (actorId: string, organizationId: string) => {
  await requireMember(organizationId, actorId);
  const rows = await deps.orgs.listMembers(organizationId);
  return Promise.all(rows.map(hydrateMember));
},
```

`requireMember` → missing org `NOT_FOUND`; missing membership `FORBIDDEN`. Repositories stay keyed by `organizationId`. Keep the memory and Prisma repos in sync if the list query was wrong.

## Cross-tenant + supply-chain checklist (short)

Walk these while the red test is open. Full lists: [tenancy](../skills/security-review/references/tenancy.md), [supply chain](../skills/security-review.md#supply-chain).

| Check | Pass |
|---|---|
| Other org → `FORBIDDEN` or `NOT_FOUND` on this use case | Memory-port `it()` kept |
| Authz in `application/`, not `register*Routes` | Grep clean |
| Same assertion on Express **and** Fastify when the bug is HTTP | Both SuperTest files |
| No new runtime HTTP client / PHP SDK “to paper over” isolation | Isolation is a server rule |
| No `npx skills add` from an unknown source in this fix | Skills stay the kit copies |
| GitHub Actions unchanged, or pinned by SHA if you must touch `.github/` | Workflows are supply chain |

A new runtime dependency still **asks first**. Transitive version bumps with no new trust boundary are not this skill.

## Verify

```bash
pnpm --filter @ysk-kit/api exec vitest run src/modules/organizations/infra/organization.app.test.ts -t 'org B'
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

Keep the regression. Name it after the symptom. Output shape: [debug-issue](../skills/debug-issue.md#output-format).
