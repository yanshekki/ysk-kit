---
name: audit-slice
description: >
  Orchestrate a scoped Staff / Security / QA Architect review of a YSK Kit
  git diff or named module: architecture, dead-code candidates, performance,
  adversarial given/when/then, environment via doctor.
  Use when Staff review, full audit, 完整審查, 切片審計, 對抗性測試, dead-code,
  死碼, 效能, or a 9-part mega-prompt.
  中文：切片審計、Staff 審查、完整審查、對抗性測試、死碼、效能。
  Do not use to implement a feature (plan-feature), ordinary PR review
  (review-change), authz-only diffs (security-review), or to delete files /
  add Cypress/Jest.
---

# Skill: audit a slice

Language: [中文](audit-slice.zh.md) · English

Run a **scoped** Staff / Security / QA pass and emit a 9-part report. Law: [AGENTS.md](../../AGENTS.md). Children: [review-change](review-change.md), [security-review](security-review.md), [supply-scan](supply-scan.md), [test-plan](test-plan.md), [write-tests](write-tests.md), [ui-review](ui-review.md), [verify-change](verify-change.md). Layers: [hexagonal](../guides/hexagonal.md). Tests: [testing](../guides/testing.md).

This skill **orchestrates**. It does not replace Law/Spec review, does not fold into security-review, and does not paste a mega-prompt into `AGENTS.md`.

## Trigger

- The user asks for a Staff / Security / QA Architect review, “full audit”, 完整審查, 切片審計, 對抗性測試, a dead-code pass, 效能, or pastes a mega-prompt with those nine headings.
- Pre-release QA of a **named** dest-product module or of the current diff.

Do not use when:

- Implementing a feature ([plan-feature](plan-feature.md)).
- Ordinary PR review unless the user asked for this combined audit ([review-change](review-change.md)).
- Authz-only / webhook-only / SQL-only diffs ([security-review](security-review.md), [webhook-handling](webhook-handling.md), [db-migration](db-migration.md)).
- Immediately after `create-ysk-app` (generated tree is not product dead code).
- To add Cypress / Jest / axe / knip, or to delete files.

## Inputs

| Input | Required | Notes |
|---|---|---|
| Scope | yes | `diff` vs base (default) **or** named paths / `apps/api/src/modules/<kebab>` **or** dest product root. Never silently the whole kit `saas` flavor tree |
| Flavor / preset | when `.ysk-kit.json` exists | `thin` must not be scored for missing llm / billing / orgs / push |
| Write tests? | no | Default **plan only**. Implement via [write-tests](write-tests.md) only if the user said to |

## Hard rules

1. **Report scope = the named slice or the diff.** The repo is research. Existing generated mounts, Fastify twins, memory repos, Prisma fragments, `create-ysk-app` templates, and capability skip tokens are not “dead code”.
2. **Do not edit the tree** except when the user asked to implement tests or accepted a deletion plan. Review ≠ merge.
3. **Do not write exploit PoCs** or live attack traffic. Adversarial work is given/when/then at memory-port and SuperTest layers, mapped to existing envelope codes: oversized body → `VALIDATION_FAILED`; other org → `NOT_FOUND` / empty page; missing JWT → `UNAUTHENTICATED`; unauthenticated webhook → reject; limiter → `RATE_LIMITED`; duplicate → `CONFLICT`. Do not invent codes.
4. **Do not add dependencies** (Cypress, Jest, axe, knip, Redis cache, extra Chromium). Ask first, same as [write-tests](write-tests.md) / [upgrade-kit](upgrade-kit.md).
5. **Environment = doctor + engines + flavor + verify commands**, not USB. Device / USB / emulator / DevTools are optional **manual** rows only when the user asked for mobile/device QA or `apps/mobile` / `apps/desktop` is in scope.
6. **Dead code is candidates + risk**, never “delete all unused exports”. Dynamic import, ts-rest `appContract`, Express+Fastify registers, and flavor-gated files are high-risk false positives. Deleting needs a plan, tests, and user OK. Do not delete during this review.
7. **Tests: emit [test-plan](test-plan.md) headings.** Paste runnable Vitest only if the user asked to implement, in the mapped file (`*.app.test.ts`, SuperTest on Express **and** Fastify, SDK `fetchImpl`, Playwright only for login/shell). No Cypress / Jest snippets.
8. **Performance:** frontend = extra HTTP client, new heavy UI kit, unlabeled images, unbounded lists in Vite pages. Backend = unbounded Prisma `findMany`, N+1 in `infra/`, sync fs/crypto on the request path, missing pagination on list DTOs. Do not invent Redis as the default fix (jobs already optional). Ask first.
9. **Architecture:** hexagonal `domain` / `application` / `infra`, contracts-first, clients through `@ysk-kit/sdk`. Flag business rules in Vite components, raw `fetch`, Prisma in clients, TypeScript `enum`, `any`, `undefined` assigned to optional props. Do not propose Hono / Drizzle / Nest / Next.
10. **Reuse:** prefer `ysk-kit add module`, `@ysk-kit/ui`, existing error codes. Do not create `packages/utils` for product domain.

## Steps

1. **Resolve scope.** Default: `git diff <base>...HEAD` (base `origin/main`). If the user named a kebab or paths, restrict to those. If they did not name a slice and there is no diff, **ask** — do not audit the whole living `saas` tree.
2. **Read flavor.** `.ysk-kit.json` `flavor` / `preset` / `db`. Score only surfaces that exist. `thin` missing llm / billing / orgs / push is not a finding.
3. **Environment.** Run (or record why skipped):

   ```bash
   pnpm ysk-kit doctor
   pnpm ysk-kit check agent
   pnpm ysk-kit check errors
   pnpm ysk-kit check supply --repo-only
   ```

   Compare `node -v` / `pnpm -v` to `engines` in `package.json`. Playwright Chromium is optional (`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` in CI). USB phone, extra Chromium, DevTools extensions, emulators, Python, Cypress, and Jest are **out of stack** — do not install them.
4. **Law / Spec** when a diff exists: follow [review-change](review-change.md) and link its table. Do not restate findings as a second architecture list.
5. **Architecture.** Walk scoped `domain/` / `application/` / `infra/` against [hexagonal](../guides/hexagonal.md). Evidence: `pnpm layers`. Fail if Prisma or Express landed in `application/`, or a client imports Prisma / raw `fetch` to kit paths.
6. **Dead-code candidates.** Search the **slice** for unused exports. Fill the candidates table with risk (dynamic / generated / flavor). Leave files in place.
7. **Performance.** Walk the checklist below. Prefer pagination and query shape over new infra.
8. **Security.** Delegate the table to [security-review](security-review.md) (severity × confidence, **no PoC**). Lockfile / runtime in scope → [supply-scan](supply-scan.md). Write adversarial cases as given/when/then (layer + file + envelope `error.code`).
9. **Tests.** Emit [test-plan](test-plan.md) headings (Change / Risks / Layer map / Cases / Fixtures / Out of scope). Hand off to [write-tests](write-tests.md) only when Write tests = implementing.
10. **Manual + reuse + summary.** Device/visual/keyboard only for what automation cannot see. Shared hooks stay on `@ysk-kit/ui` / web-sdk. Prioritize P0 human rows. **Do not merge.**

## Performance checklist

| Surface | Look for | Suggested change | Ask first? |
|---|---|---|---|
| Vite page | Extra HTTP client, not `@ysk-kit/sdk` / `@ysk-kit/web-sdk` | Use the SDK | no |
| Vite page | New heavy UI kit / mixed radii | Stay on `@ysk-kit/ui` + zinc | yes (new dep) |
| Vite page | Unlabeled images, unbounded `.map` lists | Width/height; paginate | no |
| `infra/` | Unbounded Prisma `findMany` | Cursor / take; list DTO pagination | no |
| `infra/` | N+1 (query per row) | `include` / batch at the port | no |
| Request path | Sync `fs` / `crypto` in the handler | Existing ports; do not add Redis | yes (Redis / cache) |
| Bundle | New runtime dep in web/admin | Ask; prefer existing package | yes |

UI rows that overlap [ui-review](ui-review.md) (unlabeled images, extra HTTP client, heavy UI dep) belong there too — link, do not duplicate a second visual pass. Do not add `@axe-core/playwright` to CI.

## Verification

```bash
pnpm ysk-kit doctor
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent && pnpm ysk-kit check errors
```

Expected: doctor findings named (or skipped with reason); `pnpm layers` exit 0 when you could run it; `ysk-kit check agent: ok` after skill-file edits. Do not run `pnpm e2e` unless login/shell is in the slice and ports are free.

- [ ] Scope is a diff or named paths (not a silent whole-tree kit audit)
- [ ] No files deleted; no Cypress / Jest / USB install
- [ ] Security heading is a security-review table or an explicit skip
- [ ] Test heading uses test-plan shape; Vitest only if the user asked
- [ ] Report says review ≠ merge

## Output format

```md
## Audit slice — <scope> (<base>...HEAD or paths)

Flavor / preset: <from .ysk-kit.json or kit>
Write tests: plan-only | implementing (user asked)

### 1. Environment and tool readiness
doctor: ok | FAIL (<id>)
node / pnpm: <vs engines>
check agent / errors / supply: ok | FAIL | skipped
Playwright Chromium: present | skipped (CI PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD or ports)
USB phone / extra Chromium / DevTools / emulator: not required | user-asked and <found/missing>
Python / Cypress / Jest: out of stack (do not install)

### 2. Architecture and organisation
| # | Severity | Location | Finding | Fix or human |
Law/Spec (if a diff): PASS | FAIL | n/a — link review-change table

### 3. Dead-code candidates (do not delete in this skill)
| Path | Symbol | Why unused | Risk (dynamic / generated / flavor) | Safe to delete? |

### 4. Performance
| Surface | Issue | Evidence | Suggested change | Expected impact | Ask first? |

### 5. Security and adversarial plan
Delegate to security-review table (severity × confidence). No PoC.
Adversarial cases as given/when/then (layer + file). supply-scan if lockfile/runtime in scope.

### 6. Automated test plan (not a paste dump)
test-plan headings: Change / Risks / Layer map / Cases / Fixtures / Out of scope.
Runnable code only if Write tests = implementing.

### 7. Manual checklist
Device, visual 375/768/1280, keyboard, seed admin login, webhook dashboard — only what automation cannot see.

### 8. Reuse and design
Shared hook/component only if it stays on @ysk-kit/ui / web-sdk; else keep in the module slice.

### 9. Prioritized summary
P0 human-review rows (authz, secrets, DROP, new runtime dep).
P1 tests to write via write-tests.
P2 dead-code/perf nits.
```

Severity: `high` (hard-rule break, cross-tenant, secret leak) / `medium` / `low`. Omit style-only nits `AGENTS.md` does not name.

## Done criteria

The 9-part report is filled for the named slice or diff. Environment used doctor + engines, not USB. Dead-code rows are candidates with risk. Security delegated; no exploit PoC. Tests are a test-plan (Vitest only if asked). The tree is unchanged unless the user asked to implement tests. The review did not merge.

## Anti-patterns

| Symptom | Do this instead |
|---|---|
| Whole-tree audit of this living `saas` flavor | Default scope = diff or named module |
| Delete unused Fastify register / memory repo / flavor stub | Candidates table; generated/flavor = not safe |
| Write Cypress / Jest / Python tests | Vitest + SuperTest + one Playwright Chromium smoke |
| USB / extra Chrome / DevTools / emulator probing | doctor + engines; device rows only if asked |
| “Execute attacks” / SQLi PoC | given/when/then → envelope codes; Prisma is not raw SQL |
| Dump tests into the tree during review | Emit test-plan; write-tests only if asked |
| Add Redis / knip / axe / Trivy to “finish” the audit | Ask first; prefer pagination and existing gates |
| Fold this into `security-review` or `AGENTS.md` | This skill + one progressive-disclosure row |
| Auto-run after `create-ysk-app` | Trigger is user ask / pre-release, not scaffold |
| Merge because the report looks thorough | Review ≠ merge |

## Escalate / ask

Stop and ask before deleting files, adding a runtime or scanner, writing tests the user did not request, auditing the whole kit tree, weakening authz / rate limits / secret-logging, or merging.
