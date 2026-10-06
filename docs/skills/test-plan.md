---
name: test-plan
description: >
  Produce a risk-ranked YSK Kit test plan (given/when/then, fixtures, out of scope)
  mapped to contract, memory-port, API, SDK, client, and Playwright layers.
  Use when the user asks how to test a feature, what cases to cover, or for a QA
  checklist before writing tests or shipping.
  中文：測試計劃、風險、given/when/then。
  Do not use for comment-only edits or to write the tests themselves (write-tests).
---

# Skill: plan tests

Language: [中文](test-plan.zh.md) · English

Turn a change into a short, ranked test plan, then hand it to [write-tests](write-tests.md). Law: [AGENTS.md](../../AGENTS.md). Concepts: [testing guide](../guides/testing.md).

## Trigger

- The user asks how to test a change, what cases to cover, or for a QA checklist.
- A feature plan's **Test plan** section is still empty or generic.
- Authz, tenancy, money, webhooks, secrets, or concurrency is in scope.

Skip (unless asked) for typo-only or comment-only edits.

## Inputs

| Input | Required | Notes |
|---|---|---|
| What changed | yes | One sentence. Restate it; do not copy the ticket blindly |
| Surfaces | yes | contracts / application / HTTP / SDK / web / admin / mobile / desktop |
| Flavor / capability | when known | `thin` has no llm / billing / orgs / push |

If acceptance criteria are missing, ask once, then plan.

## Process

1. Restate the change in one sentence.
2. Rank the **riskiest behaviours first**: data loss, auth / authz, money, concurrency, tenancy / org isolation, secrets (OTP, Stripe `sk_`, webhook signatures), idempotency, rate limits.
3. Map each risk to a YSK Kit layer (table below). Prefer a lower layer when it can fail the case.
4. List concrete cases as `given / when / then`. Happy path first, then edge and failure. Name the layer and file for each case.
5. Note setup, fixtures, and factories. Default fixture: `createMemoryInput()` plus the module memory repository.
6. Call out what is **explicitly out of scope** so the plan stays small enough to run immediately.

Do not start Redis, Stripe, Twilio, FCM, Jaeger, or Grafana. Do not write tests until this plan exists (unless the user waived planning).

## Layer map

| Layer | What belongs here | Where | How |
|---|---|---|---|
| Contract | Zod DTOs, error codes, ts-rest paths, Prisma enum drift | `packages/contracts/src/*.test.ts`, `@ysk-kit/db-prisma` | Parse valid / reject invalid; no HTTP |
| Domain / use-case | Business rules, tenancy, authz | `apps/api/src/modules/<name>/application/`, tests next to the memory adapter (`*.app.test.ts` or `*.test.ts`) | In-memory repository. No Prisma, Express, Redis |
| API (envelope) | Status, `{ ok, data }` / `{ ok, error }`, codes | `apps/api/src/*.test.ts` via `createApp(createMemoryInput())` and SuperTest | Hit the ts-rest path. Assert `res.body.ok` and `error.code` |
| SDK | Envelope unwrap, tokens, optional resources | `packages/sdk/src/*.test.ts` | Inject `fetchImpl`. Never the live API |
| Client | Forms, empty / error / loading, `Can` | `apps/web|admin/src/**/*.test.tsx`, `packages/ui/src/ui.test.tsx` | Testing Library: role, label, `userEvent` |
| E2E | One login/shell path that unit tests cannot see | `apps/web/e2e/*.spec.ts` | Playwright Chromium. Needs migrated DB + seed. Ports 3001 / 5173 |
| Mobile / desktop | Token store, adapters | `apps/mobile/src/**/*.test.ts`, `apps/desktop/src/**/*.test.ts` | In-memory token store. No Expo/Electron driver in CI |

Trophy, not pyramid of E2E: most cases sit in use-case + API envelope tests. E2E stays a thin smoke.

## Output format

Use **exactly** these headings. Do not drop them. Keep the plan small enough to act on in one session.

```md
## Change

One sentence.

## Risks

1. Ranked, highest first (data loss / auth / money / concurrency / tenancy / secrets).

## Layer map

| Risk | Layer | File |
|---|---|---|
| … | application (memory repo) | `apps/api/src/modules/<name>/infra/<name>.app.test.ts` |

## Cases

1. **<short name>** — layer: <layer>
   given … / when … / then …
2. **<short name>** — layer: <layer>
   given … / when … / then …

## Fixtures

- `createMemoryInput()` / `createMemory<Name>Repository()`
- Seeded ids, fake clock (`vi.useFakeTimers`), injected `fetchImpl`
- Users, orgs, or API keys the cases need

## Out of scope

- Anything intentionally not covered (live Stripe, other flavors, visual polish, …)
```

Happy-path case first. Then edges (empty list, other tenant, invalid DTO, expired token). Then failures (`UNAUTHENTICATED`, `FORBIDDEN`, `VALIDATION_FAILED`, `CONFLICT`, `RATE_LIMITED`, `NOT_FOUND`).

## Example (shape only)

Change: “Users can create a note.” Risk 1: another author must not see it (tenancy). Case: given author A created a row / when author B lists / then `items` is empty — layer: application (memory repo). Fixture: `createMemoryNoteRepository()`. Out of scope: Playwright, live MySQL.

## Done criteria

- [ ] Risks are ranked; authz / tenancy / envelope errors appear when the change can hit them
- [ ] Every case is `given / when / then` with a layer and a file
- [ ] Fixtures are in-memory (or injected fakes)
- [ ] Out of scope is explicit
- [ ] Implementation of cases continues in [write-tests](write-tests.md)

## Anti-patterns

| Symptom | Do this instead |
|---|---|
| Only a happy path | Rank authz / tenancy / envelope failures |
| “Add Playwright for everything” | Trophy: memory-port first |
| Start Stripe to plan tests | Memory fixtures |

## Escalate / ask

Ask once if acceptance criteria are missing. Do not write tests until this plan exists unless the user waived it.

## References

- Cloudflare Agents `test-plan` skill (restate, rank risk, given/when/then, fixtures, out of scope, fixed headings)
- Cloudflare sandbox-sdk testing skill (unit vs E2E, exact commands)
- Testing trophy (integration-heavy; E2E stays thin)
