---
name: write-tests
description: >
  Write professional YSK Kit tests: trophy per layer, in-memory ports, given/when/then,
  deterministic fixtures, envelope and authz cases, exact Vitest/Playwright commands.
  Use when adding tests, fixing a bug, or after test-plan.
  中文：寫測試、Vitest、Playwright、回歸。
  Do not use to plan cases (test-plan) or to start Redis/Stripe in CI.
---

# Skill: write tests

Language: [中文](write-tests.zh.md) · English

Write the cases from [test-plan](test-plan.md). Law: [AGENTS.md](../../AGENTS.md). Concepts: [testing guide](../guides/testing.md). Verify: [verify-change](verify-change.md).

## Trigger

- Implementing a feature or bug fix that changes behaviour.
- A test-plan exists (or the change is too small to plan) and tests must land.
- A flake, a missing regression, or a CI test failure in this repo.

## Inputs

| Input | Required | Notes |
|---|---|---|
| Test plan | yes when protocol required | Cases already ranked |
| Layer / file | yes | Do not invent a parallel test tree |

## Trophy (where to put the test)

Prefer the lowest layer that can fail the behaviour. Do not duplicate the same assertion in Playwright.

| Layer | File | Runner |
|---|---|---|
| Contract | `packages/contracts/src/*.test.ts` | `pnpm --filter @ysk-kit/contracts test` |
| Enum drift | `packages/db-prisma` | `pnpm --filter @ysk-kit/db-prisma test` |
| Use-case | `apps/api/src/modules/<name>/infra/<name>.app.test.ts` (generator: `service.test.ts.tmpl`) | `pnpm --filter @ysk-kit/api exec vitest run <file>` |
| HTTP envelope | `apps/api/src/app.test.ts`, `platform.app.test.ts`, module `*.app.test.ts` | SuperTest + `createApp(createMemoryInput())` |
| Package unit | `packages/<pkg>/src/*.test.ts` | `pnpm --filter @ysk-kit/<pkg> test` |
| SDK | `packages/sdk/src/*.test.ts` | Inject `fetchImpl` |
| UI logic | `packages/ui-logic/src/*.test.ts` | No DOM |
| UI components | `packages/ui/src/ui.test.tsx` | Testing Library + happy-dom |
| Client pages | `apps/web/src/**/*.test.tsx` (admin same) | Testing Library + `userEvent` |
| Mobile / desktop adapters | `apps/mobile/src/**/*.test.ts`, `apps/desktop/src/**/*.test.ts` | Memory token store |
| E2E | `apps/web/e2e/*.spec.ts` | `pnpm e2e` (Playwright Chromium) |

`ysk-kit add module` already writes a memory-repo test (create + list scoped to `authorId`) and an unauthenticated HTTP case. **Extend that file**; do not mkdir a second suite.

## Naming and shape

- Files: `*.test.ts` / `*.test.tsx`. Playwright: `*.spec.ts` under `apps/web/e2e`.
- `describe` the unit (`api auth`, `LoginPage`, `@ysk-kit/ui`). `it` states the observable result (`returns UNAUTHENTICATED without a session`).
- Structure each test **given / when / then** (AAA is the same idea). One behaviour per `it`.
- Query UI the way a user does: `getByRole`, `getByLabelText`. Do not query by class name or test ids unless the accessible name is genuinely absent.

```ts
it('returns UNAUTHENTICATED without a session', async () => {
  const mem = createMemoryInput();
  const app = createApp(mem.input);
  const res = await request(app).post('/v1/notes').send({ title: 'Hello', body: 'World' });
  expect(res.status).toBe(401);
  expect(res.body).toMatchObject({ ok: false, error: { code: 'UNAUTHENTICATED' } });
});
```

## Determinism

- Inject clocks (`vi.useFakeTimers` or a `now` port). Do not `sleep` / `setTimeout` to “wait for the app”.
- Seed identifiers. Prefer fixed UUIDs in given data (`11111111-1111-1111-1111-111111111111`).
- No network. Stub `fetchImpl` on SDK, Stripe, Twilio. Memory queue when `REDIS_URL` is unset.
- No `Math.random()` in assertions. If the code needs entropy, inject it.
- SuperTest and Vitest run in-process. Do not boot the API with `tsx` inside a unit test.

## Fixtures, factories, fakes

- Default composition: `createMemoryInput()` (same services as production, memory ports).
- Module factory: `createMemory<Name>Repository()` from the generator.
- Build valid commands with the Zod schema (`CreateUserCommandSchema.parse({ … })`), then mutate copies for invalid cases.
- Prefer **in-memory fakes of ports we own** over `vi.mock`. Never mock `@ysk-kit/contracts`, Prisma from a client, or `fetch` in web/admin/mobile/desktop (those apps must use the SDK; tests that need HTTP go through SuperTest or `fetchImpl` on `HttpClient`).
- Do not mock what you do not own (Stripe HTTP, Twilio). Wrap them behind a port and fake the port — see `stripe-billing.test.ts` (`fetchImpl` + HMAC).

## Envelope, authz, tenancy, secrets

Every new JSON route test must cover:

| Case | Then |
|---|---|
| Happy | `res.body.ok === true` and `data` shape |
| Missing auth | `401` `{ ok: false, error: { code: 'UNAUTHENTICATED' } }` |
| Wrong role | `403` `FORBIDDEN` |
| Other tenant / other `authorId` | empty page or `NOT_FOUND`, never a leak |
| Invalid body | `422` `VALIDATION_FAILED` |
| Duplicate | `409` `CONFLICT` when the rule exists |
| Rate limit | `429` `RATE_LIMITED` when the route is limited (`createMemoryRateLimit`) |

Webhook signatures: verify HMAC on the raw body (`createHmac`), reject bad signatures. Idempotency: replay the same event and assert one side effect. Do not log or assert OTP codes, Stripe `sk_`, or webhook secrets.

## Snapshots

- Prefer `toMatchObject` / explicit fields on envelopes.
- Do not snapshot whole React trees or SuperTest bodies.
- OpenAPI dumps belong to `pnpm gen:openapi`, not a snapshot file.

## Flakes

- A flake is a failing test. Fix the race (fake timers, wait for a Testing Library finder, Playwright web-first assertion). Do not raise Playwright `retries` to hide it (CI already uses `retries: 1`).
- `fullyParallel: false` and `workers: 1` in `apps/web/playwright.config.ts` — keep E2E serial.
- Never `waitForTimeout`. Use `expect(locator).toBeVisible()`.

## Coverage

`pnpm test:coverage` is a **signal** (configured 95% on `apps/*/src` and `packages/*/src`). CI `check` runs `pnpm test`, not coverage. Do not add tests that only exist to bump a percentage. Do not import Prisma, Redis, or Stripe to close a gap.

## Bug fixes

Write the failing regression test **first**. Confirm it fails for the reported case, then fix. Keep that test.

## Commands

```bash
# all workspace Vitest
pnpm test

# one package
pnpm --filter @ysk-kit/api test
pnpm --filter @ysk-kit/web test
pnpm --filter @ysk-kit/contracts test
pnpm --filter @ysk-kit/ui test

# one file / one name (Vitest)
pnpm --filter @ysk-kit/api exec vitest run src/app.test.ts
pnpm --filter @ysk-kit/api exec vitest run src/app.test.ts -t 'registers'
pnpm --filter @ysk-kit/web exec vitest run src/features/auth/login-page.test.tsx

# Playwright (needs build, free 3001/5173, migrated DB, seed)
pnpm --filter @ysk-kit/web exec playwright install chromium
pnpm --filter @ysk-kit/web build
pnpm e2e
pnpm --filter @ysk-kit/web exec playwright test e2e/users.smoke.spec.ts

# after the change
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

## Playwright, axe, visual

This repo ships **one Chromium smoke** (`apps/web/e2e/users.smoke.spec.ts`): seed admin logs in and sees the users table. Extend E2E only for a user-visible path that unit tests cannot see (login shell, router). Use `getByLabel` / `getByRole`, not CSS.

| Tool | In this repo? | Rule |
|---|---|---|
| Playwright | yes, Chromium only | Optional `pnpm e2e` when login/shell changed |
| `@axe-core/playwright` | **no** — do not add | Optional local audit; do not add the dependency unless the user asks |
| Visual regression (Percy, Chromatic, screenshot diffs in CI) | **no** | Optional: `await expect(page).toHaveScreenshot()` locally at 375 / 768 / 1280. Do not gate CI on it unless asked |
| Property-based (`fast-check`) | **no** | Optional for parsers; a table of cases is enough. Do not add the dependency |

Accessibility of UI: follow [ui-review](ui-review.md). Prefer Testing Library queries that fail when the label is missing.

## Definition of done (tests)

- [ ] Cases from the test plan exist at the mapped layer
- [ ] In-memory ports only (no Redis / Stripe / Twilio / FCM / Jaeger / Grafana)
- [ ] Envelope `ok` / `error.code` asserted on HTTP tests
- [ ] Other-tenant / unauthenticated case when the resource is owned
- [ ] Deterministic (fake clock, no sleep, no live network)
- [ ] Regression test first when this is a bug fix
- [ ] `pnpm test` green; `pnpm e2e` when login/shell changed and ports are free

## Output format

```md
## Tests — <scope>
Layer: <file>
HTTP adapters: Express + Fastify | n/a
Regression-first: yes | n/a
Command: pnpm --filter @ysk-kit/<pkg> exec vitest run <file>
```

## Anti-patterns

| Symptom | Do this instead |
|---|---|
| Mock Prisma from a client | SDK + SuperTest |
| Sleep to wait for the UI | Testing Library finder / fake timers |
| Snapshot the whole envelope | `toMatchObject` on `ok` / `error.code` |

## Escalate / ask

Ask before adding `@axe-core/playwright`, visual-regression CI, or `fast-check`.

## References

- Cloudflare sandbox-sdk testing skill (unit vs E2E, filter one file / `-t`)
- Cloudflare Agents `test-plan` (given / when / then)
- Testing trophy; Testing Library guiding principles (query by role/label)
- Playwright best practices (web-first assertions, no `waitForTimeout`)
- “Never mock what you don’t own”
