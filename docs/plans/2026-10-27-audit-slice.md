# Plan: Audit slice

Language: Chinese pair `2026-10-27-audit-slice.zh.md` · English `2026-10-27-audit-slice.md`

| | |
|---|---|
| **Slug** | `audit-slice` |
| **Date** | 2026-10-27 |
| **Status** | draft — waiting for user approval (research only; do not implement the skill in this PR) |
| **Canonical file** | `docs/plans/2026-10-27-audit-slice.md` |
| **Session pointer** | `/plan.md` (gitignored) |

Law: [AGENTS.md](../../AGENTS.md). Procedure: [plan-feature](../skills/plan-feature.md). Check: `pnpm ysk-kit plan --check docs/plans/2026-10-27-audit-slice.md`.

## Goal and user problem

A Staff Engineer + Security Engineer + QA Architect mega-prompt (Traditional Chinese, mixed with spoken Cantonese intent) was proposed as something to add to ysk-kit so agents would run a strict architecture review, dead-code purge, performance pass, adversarial security testing, environment probing (USB phone, extra Chromium, DevTools extensions, emulators), then write runnable tests and a 9-part report.

The kit already teaches the same *intent* in pieces: hexagonal layers, `review-change`, `security-review`, `test-plan` → `write-tests`, `ui-review`, `supply-scan`, `verify-change`, `ysk-kit doctor` / `check *`. Agents still miss the combined pass: they pick one skill, skip the rest, or paste a generic audit that fights kit law (whole-tree delete, Cypress/Jest, exploit PoCs, USB probing on Cloud Agents).

Outcome this plan records: **verdict yes-with-edits**. Do not paste the candidate prompt into `AGENTS.md`. After approval, add one bilingual orchestrator skill `audit-slice` that keeps the high-value 9-part report, rewrites environment/tests/dead-code to kit gates, and hands off to existing skills instead of duplicating them.

This PR ships **the dated plan only**. It does not merge, does not release, and does not add skill files until the user accepts the rewritten contract below.

## Scope

- In: this dated plan pair as the research record (verdict, placement, kit-native rewrite, ranked risks, effort).
- In (after approval, later PR): skill `audit-slice` (`docs/skills/audit-slice.md` + `.zh.md`), thin wrappers in `tooling/ysk-cli/templates/agent/skills/audit-slice/`, `.agents/skills/`, `.claude/skills/` (drift-checked copies to `.cursor/skills/` and `.grok/skills/` via create-app / upgrade).
- In (after approval): one progressive-disclosure row in `AGENTS.md` / `AGENTS.zh.md`; index row in `docs/skills/index.md` pair; `SKILLS` array in `tooling/ysk-cli/src/docs-pair.test.ts`; thin-smoke + flavor-smoke file assertions; create-app tests; pointer sentences on `review-change` and `security-review` “Do not use”.
- In (after approval, optional one sentence): plan template **Manual checks** may say “if the user asked for a staff/QA audit, follow `audit-slice`”.
- In: lockstep changeset + changelog / README window **only when the skill files ship**, targeting the next patch after the then-current kit version. Not in this research PR.

## Non-goals

- Out: merging this (or any follow-up) without user approval. Out: npm release.
- Out: dumping the candidate prompt, or a 9-part checklist, into `AGENTS.md` (root is already ~20.6 KiB; combined root + nested budget is 24 KiB).
- Out: a Cursor custom mode / Cursor Plan Mode file as the home (dest products get skills from `create-ysk-app` and `ysk-kit upgrade`, not from a local Cursor mode).
- Out: auto-running a whole-tree audit as a `create-ysk-app` post-scaffold step (generated thin/full trees would be flagged as “dead kit code”).
- Out: adding Cypress, Jest, `@axe-core/playwright`, knip, ts-prune, `fast-check`, Trivy, or USB/ADB device drivers as defaults.
- Out: instructing agents to write exploit PoCs, run live attackers, or delete files during a review.
- Out: new HTTP routes, Prisma models, envelope exceptions, capabilities, or SDK methods.
- Out: folding the mega-prompt into `security-review` (that skill is getsentry-style: **report scope = the diff**).
- Out: replacing `review-change` Law/Spec axes or the testing trophy.

## Assumptions

- The candidate prompt text in the user message is the full source to evaluate; there is no separate committed file.
- ysk.hk product page at kit v1.6.5 is unrelated and out of scope.
- Cloud Agents, GitHub-hosted CI (`ubuntu-latest`, `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`), and dest-product CI rarely have a USB phone, a second Chromium, React DevTools, or an emulator. `ysk-kit doctor` already covers engines, env, secrets, database, rules, agent, errors, supply.
- Kit test stack is Vitest + Testing Library + one Playwright Chromium smoke. Cypress and Jest are absent from the tree (ripgrep: no matches).
- “Stable only / feature needs approval” here means: do not add new runtimes or scanners; do not bump Electron 45 / TypeScript 7 / Prisma 8 without asking ([upgrade-kit](../skills/upgrade-kit.md)); do not implement `audit-slice` until this plan is accepted.
- A later implementation PR will need the usual skill-wiring list (wrappers, smoke, `SKILLS` array). That list is mechanical and well-rehearsed (`supply-scan`, `error-log-review`, daily-loop skills).

## Affected flavors / presets / capabilities

| Axis | Value | Notes |
|---|---|---|
| Flavor | kit itself, then every workspace flavor via upgrade / create-app | php-bridge does not receive skill wrappers; do not invent a PHP-only audit |
| Preset | thin / full | thin has no llm / billing / orgs / push — audit must not demand those surfaces |
| Capabilities | referenced only | authz/tenancy still go through `security-review`; webhooks / Electron / LLM stay on their skills |

## Current state and reuse

Explore result: the candidate prompt **overlaps heavily** with skills that already exist. The gap is orchestration plus three missing review axes (performance, dead-code-with-gates, honest environment). Conflicts are real and would be harmful if the prompt were shipped as-is.

### Existing coverage vs candidate sections

| Candidate section | Already in the kit | Gap / conflict |
|---|---|---|
| Role play “Staff + Security + QA” | Skills are trigger-based, not personas. `review-change` is Law + Spec | Persona dump is noisy; keep trigger YAML |
| Real automation first + manual list | `test-plan` (trophy, out of scope) + plan template **Manual checks** + `ui-review` | Keep; rewrite “write tests now” |
| Zero-tolerance dead code | No knip / ts-prune. Biome unused is not a CI unused-export scan | Need gated *candidates*, never silent delete |
| Performance (re-render, bundle, N+1) | `ui-review` performance box is thin (no extra HTTP client, no heavy UI dep). No N+1 / bundle skill | **Real gap** — add a short kit-native checklist |
| Security + adversarial | `security-review` (authz, tenancy, secrets, webhooks, LLM, rate limit, CORS, supply chain) + `supply-scan` + `desktop-electron` + `webhook-handling` + `llm-feature` | Candidate says “execute attacks” and lists SQLi/XSS/cmdi; kit forbids exploit PoCs; Prisma + Zod already bound SQL/input |
| Environment (USB, extra Chrome, extensions, emulators, Python, Cypress/Jest) | `ysk-kit doctor`; `engines.node` ≥26.12.1; Playwright Chromium in `apps/web/e2e`; CI skips browser download | USB/extensions/Python/Cypress/Jest are **wrong for this stack** |
| Write runnable tests | `write-tests` after `test-plan`; vertical TDD; memory ports; Express **and** Fastify | Review skill must not dump tests into the tree unless the user asked to implement |
| Reuse / SRP / naming | Hexagonal guide, `add-module`, hard rules 1–5, `@ysk-kit/ui` | Flag product duplication; do not invent a parallel shared folder |
| 9-part output | Each skill has its own output format (`review-change` table, `security-review` ASVS table, `test-plan` headings) | Orchestrator may keep 9 headings **if** they call into those formats instead of replacing them |
| Whole current codebase | `review-change` / `security-review`: **diff is the report scope**; anti-pattern “reviewing files outside the diff as findings” | Whole-tree audit of this living `saas` flavor is a false-positive factory |
| TypeScript `any` | `exactOptionalPropertyTypes` is on; no dedicated `any` scan in `check agent` | Report `any` in scoped files; do not add a new `check agent` rule in v1 of this skill |

### Files to reuse (do not rewrite)

| Path | Symbol | Reuse as |
|---|---|---|
| `docs/skills/review-change.md` | Law / Spec axes, high-risk human list | First child of the orchestrator when a diff exists |
| `docs/skills/security-review.md` | Diff-scoped authz, threat-model sub-mode | Security heading delegates here |
| `docs/skills/supply-scan.md` | `pnpm ysk-kit check supply` | Dependency heading; never `npx` Trivy |
| `docs/skills/test-plan.md` | Risk rank, layer map, given/when/then | Automated-testing heading emits this shape |
| `docs/skills/write-tests.md` | Trophy, Vitest/Playwright commands | Hand-off only when the user asked to implement tests |
| `docs/skills/ui-review.md` | Visual/a11y/states/375 | UI rows; do not add axe to CI |
| `docs/skills/verify-change.md` | Five-command chain | Environment “can we verify?” |
| `docs/skills/debug-issue.md` | Red loop Express **and** Fastify | If a finding becomes a bug fix |
| `docs/guides/hexagonal.md` | domain / application / infra | Architecture checklist |
| `docs/guides/testing.md` | Trophy, CI jobs, no Cypress/Jest | Cite, do not duplicate |
| `tooling/ysk-cli/src/doctor.ts` | engines, env, secrets, database, agent, errors, supply | Environment section |
| `.dependency-cruiser.cjs` / `pnpm layers` | Layer graph | Architecture evidence |
| `docs/plans/_template.md` | Manual checks already exist | Optional one-line pointer later |
| `docs/plans/2026-10-06-daily-loop-skills.md` | Skill wiring pattern | Copy the file list, not the prompt |

## Options considered

| Option | Complexity | Layers | Migration | Clients | Notes |
|---|---|---|---|---|---|
| A. Paste the candidate prompt into `AGENTS.md` | low | none | none | every agent loads it | Blows 24 KiB; fights diff-scope, trophy, no-PoC, no Cypress; **reject** |
| B. Cursor custom mode / local prompt only | low | none | none | Cursor Desktop only | Dest products, Claude, Grok, Copilot, Cloud Agents never see it; **reject as the home** |
| C. Expand `security-review` + `review-change` in place | medium | docs only | none | all flavors | Mixes PR review with whole-tree QA; dilutes getsentry diff-scope; **reject** |
| D. New orchestrator skill `audit-slice` + thin AGENTS row | medium | docs + wrappers + smoke lists | none | dest products via upgrade | Matches how `supply-scan` / `error-log-review` landed; **chosen** |
| E. create-app post-scaffold auto-audit | high | create-app | none | every new dest | Audits generated kit files; USB probing; **reject** |

**Chosen:** D (research now; implement skill only after approval).  
**Why:** high-value parts (severity, manual list, architecture vs layers, adversarial *planning*) belong in a skill agents actually load, without replacing Law/Spec review or inviting delete-the-Fastify-twin. A and C violate documented anti-patterns. B does not reach dest products. E is the noisiest placement.

## Contracts first

No DTO, command, error code, or ts-rest path. The “contract” is the skill trigger, scope rules, and output headings.

| Item | Name / path | Notes |
|---|---|---|
| DTO | none | docs-only |
| Command | none | |
| Error codes | reuse existing | Adversarial cases map to `UNAUTHENTICATED`, `FORBIDDEN`, `VALIDATION_FAILED`, `RATE_LIMITED`, `NOT_FOUND`, `CONFLICT` — do not invent codes in a review |
| Paths | none | Discover from OpenAPI; call through SDK if implementing tests later |

### Skill contract (implement after approval)

**Name:** `audit-slice`  
**Wrappers:** YAML `name` + `description` (≤1024 chars, include 中文 triggers: 切片審計、Staff 審查、完整審查、對抗性測試、死碼、效能). Point at `docs/skills/audit-slice.md` and `AGENTS.md`.

**Trigger**

- User asks for a Staff / Security / QA Architect review, “full audit”, 完整審查, 對抗性測試, dead-code pass, or pastes a mega-prompt with those nine headings.
- Pre-release QA of a **named** dest-product module or of the current diff.

**Do not use when**

- Implementing a feature (`plan-feature`).
- Ordinary PR review unless the user asked for this combined audit (`review-change`).
- Authz-only / webhook-only / SQL-only diffs (`security-review`, `webhook-handling`, `db-migration`).
- Immediately after `create-ysk-app` (generated tree is not product dead code).
- To add Cypress/Jest/axe/knip or to delete files.

**Inputs**

| Input | Required | Notes |
|---|---|---|
| Scope | yes | `diff` vs base (default) **or** named paths / `apps/api/src/modules/<kebab>` **or** dest product root. Never silently the whole kit `saas` flavor tree |
| Flavor / preset | when `.ysk-kit.json` exists | thin must not be scored for missing llm/billing/orgs/push |
| Write tests? | no | Default **plan only**. Implement via `write-tests` only if the user said to |

**Hard rules for this skill (kit-native edits to the candidate)**

1. **Report scope = the named slice or the diff.** Repo is research. Existing generated mounts, Fastify twins, memory repos, Prisma fragments, `create-ysk-app` templates, and capability skip tokens are not “dead code”.
2. **Do not edit the tree** except when the user asked to implement tests or accepted a deletion plan. Review ≠ merge.
3. **Do not write exploit PoCs** or live attack traffic. Adversarial work is given/when/then at memory-port and SuperTest layers (oversized body → `VALIDATION_FAILED`; other org → `NOT_FOUND` / empty page; missing JWT → `UNAUTHENTICATED`; unauthenticated webhook → reject).
4. **Do not add dependencies** (Cypress, Jest, axe, knip, Redis cache, extra Chromium). Ask first, same as `write-tests` / `upgrade-kit`.
5. **Environment = doctor + engines + flavor + verify commands**, not USB. Device/USB/emulator/DevTools are optional **manual** rows only when the user asked for mobile/device QA or `apps/mobile` / `apps/desktop` is in scope.
6. **Dead code is candidates + risk**, never “delete all unused exports”. Dynamic import, ts-rest `appContract`, Express+Fastify registers, and flavor-gated files are high-risk false positives. Deleting needs a plan, tests, and user OK.
7. **Tests: emit `test-plan` headings.** Paste runnable Vitest only if the user asked to implement, in the mapped file (`*.app.test.ts`, SuperTest on Express **and** Fastify, SDK `fetchImpl`, Playwright only for login/shell). No Cypress/Jest snippets.
8. **Performance:** frontend = extra HTTP client, new heavy UI kit, unlabeled images, unbounded lists in Vite pages. Backend = unbounded Prisma `findMany`, N+1 in `infra/`, sync fs/crypto on the request path, missing pagination on list DTOs. Do not invent Redis as the default fix (jobs already optional).
9. **Architecture:** hexagonal `domain` / `application` / `infra`, contracts-first, clients through `@ysk-kit/sdk`. Flag business rules in Vite components, raw `fetch`, Prisma in clients, TypeScript `enum`, `any`, `undefined` assigned to optional props. Do not propose Hono/Drizzle/Nest/Next.
10. **Reuse:** prefer `ysk-kit add module`, `@ysk-kit/ui`, existing error codes. Do not create `packages/utils` for product domain.

**Rewritten 9-part output** (keep the user’s structure, change the substance)

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

## Data model / Prisma and migrations

None. `n/a` — no schema change, no `pnpm db:migrate`.

## Module slices and layers

No `apps/api/src/modules/*/application` or `infra` edits. The skill will *read* those folders when a named kebab is in scope and will fail the architecture section if a dest product put Prisma or Express in `application/`.

## SDK / web-sdk / client surfaces

No runtime client code. The skill will flag dest-product `fetch('/v1/...')` and Prisma imports using the same rules as `pnpm ysk-kit check agent`.

## Jobs / mail / realtime / notifications

None. `n/a` — do not suggest Redis/cache/mail as a performance default during an audit.

## Security and privacy

This skill must not weaken authz, rate limits, or secret-logging rules. It must not log OTP, JWT, Stripe `sk_`, or webhook secrets while probing. It must not produce exploit steps. Dependency findings go through [supply-scan](../skills/supply-scan.md) (`pnpm ysk-kit check supply --repo-only`, `--online` when the registry is allowed). New runtime dependencies remain **ask first**. Threat-model sub-mode stays on [security-review](../skills/security-review.md) when a new trust boundary is in the slice.

## Test plan

This research PR adds no production behaviour. Later skill PR: contract-level docs-pair + smoke file existence, not application tests.

### Change

Document (then later ship) an orchestrator skill so agents run a scoped staff/security/QA audit without fighting kit law.

### Risks

1. Agents treat the skill as permission to delete generated twins or write Cypress (supply-chain + data-loss analogue for dest products).
2. Whole-tree scope on this kit produces false positives (full preset demo llm/billing).
3. Skill-drift / missing smoke assertion → `check agent` or thin-smoke red.
4. AGENTS.md budget if the progressive-disclosure row is too long (low).

### Layer map

| Risk | Layer | File |
|---|---|---|
| Docs pair missing | docs-pair | `tooling/ysk-cli/src/docs-pair.test.ts` (`SKILLS` includes `audit-slice`) |
| Wrapper drift | check agent | `.agents/skills/audit-slice/SKILL.md` vs templates |
| Dest product missing stub | create-app / CI | `tooling/create-ysk-app/src/index.test.ts`, `.github/workflows/ci.yml` thin-smoke, `.github/scripts/flavor-smoke.sh` |

### Cases

1. **Pair exists** — layer: docs-pair. given skill name `audit-slice` / when `docs-pair` test runs / then English skill, zh pair, template, `.agents` and `.claude` copies exist and mention `AGENTS.md`.
2. **Thin dest receives wrapper** — layer: create-app. given `create-ysk-app --preset thin` / when dest is written / then `.agents/skills/audit-slice/SKILL.md` exists (php-bridge still skipped).
3. **Prompt-as-is rejected in the skill text** — layer: docs. given `audit-slice.md` / when grepped / then it names Cypress/Jest/USB as out of stack and says do not delete during the review.

### Fixtures

- Existing `docs-pair` `SKILLS` array and flavor-smoke path list.
- No Redis, Stripe, Playwright for these cases.

### Out of scope

- Memory-repo service cases, envelope HTTP, Playwright, live USB.
- Implementing the skill in *this* PR.

## Verification commands

Each command has an expected result. This research PR is docs-only.

| Command | Expected result |
|---|---|
| `pnpm ysk-kit plan --check docs/plans/2026-10-27-audit-slice.md` | prints `ysk-kit plan --check: ok` |
| `pnpm ysk-kit plan --check docs/plans/2026-10-27-audit-slice.zh.md` | prints `ysk-kit plan --check: ok` |
| `pnpm ysk-kit check agent` | prints `ysk-kit check agent: ok` (budget unchanged; no new wrappers yet) |
| `pnpm ysk-kit check errors` | prints `ysk-kit check errors: ok` |
| `pnpm layers` | exit 0 (no runtime graph change) |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | exit 0 |
| `pnpm gen:openapi` | `docs/openapi.yaml` unchanged |

Optional: `pnpm lint`. Do not run `pnpm e2e` (no login/shell change). On Grok Build: `grok inspect` would list this plan after it is committed, not a new skill until wrappers exist.

### Manual checks

Omit UI/HTTP/authz flows — this change is a plan file. Human review of the **verdict and skill contract** in this document is the gate.

- [ ] UI flow: n/a
- [ ] Envelope shape: n/a
- [ ] Auth roles: n/a
- [ ] User accepts or rejects `audit-slice` name, default scope = diff, and “plan tests, do not delete”

## Docs / changelog / changeset

- [ ] This plan pair is the research record.
- [ ] After approval: `docs/skills/audit-slice.md` pair, index, AGENTS one-row, wrappers, smoke lists.
- [ ] Changelog / README window / lockstep changeset: **when the skill ships**, not in this PR.
- [ ] Do not mention ysk.hk v1.6.5 product page.

## Risks and rollback

| Risk if the candidate prompt shipped as-is | Why it hurts | Kit-native mitigation |
|---|---|---|
| 1. Agents write tests into the tree during “review” | Bypasses plan gate, vertical TDD, Express+Fastify twin | Default write-tests = off; emit test-plan |
| 2. Delete “unused” Fastify register, memory repo, capability stubs | Breaks `HTTP_ADAPTER=fastify`, CI, thin vs full | Dead-code table with risk; generated/flavor = not safe |
| 3. USB / extra Chrome / extensions / emulator probing | Fails on Cloud Agent and CI; wasted install | doctor + Playwright optional; device rows only if asked |
| 4. Cypress / Jest / Python runtime suggestions | Second test stack; new deps need approval | Explicitly out of stack |
| 5. Dump into `AGENTS.md` | Combined AGENTS budget 24 KiB; root already ~20.6 KiB | One progressive-disclosure row |
| 6. Whole-tree audit of kit `saas` | Hundreds of findings on demo llm/billing/orgs | Default scope = diff or named module |
| 7. “Execute attacks” / SQLi PoC | Forbidden by `supply-scan` / security-review; Prisma not raw SQL | Adversarial *plan* only; envelope error codes |
| 8. Cursor custom mode as the home | Dest apps and non-Cursor agents never load it | Skill wrappers via create-app / upgrade |
| 9. Post-scaffold auto-run | New products look “dirty” | Trigger is user ask / pre-release, not scaffold |
| 10. Performance “add Redis/cache now” | New infra, secrets, CI | Ask first; prefer pagination and query shape |
| 11. Skill-drift if wrappers added unevenly | `check agent` / thin-smoke red | Same wiring list as `supply-scan` |
| 12. Persona prompt always-on | Tokens and nits on every chat | Trigger YAML; do not alwaysApply a Cursor rule |

Rollback: revert the plan commit (this PR). After a later skill PR: revert skill files, `SKILLS` row, smoke assertions, AGENTS row; `ysk-kit upgrade` on dest products restores previous wrappers.

## Task checklist

Ordered. This PR stops after step 0. Remaining steps wait for approval.

0. [x] Research record (this file)
   - **Files:** `docs/plans/2026-10-27-audit-slice.md`, `docs/plans/2026-10-27-audit-slice.zh.md`
   - **Interface / contract / data:** none
   - **Risk:** plan-check headings
   - **Rollback:** revert commit
   - **Acceptance:** both `--check` print ok; status **draft — waiting for user approval**; no skill wrappers; no changeset

1. [ ] Contracts (skill YAML + output headings) — after approval
   - **Files:** `docs/skills/audit-slice.md`, `docs/skills/audit-slice.zh.md`
   - **Interface / contract / data:** none (no DTO)
   - **Risk:** duplicating security-review; too long
   - **Rollback:** delete the pair
   - **Acceptance:** trigger/do-not/inputs/9-part output/anti-patterns present; Cypress/Jest/USB marked out of stack; no TypeScript `enum`

2. [ ] Scaffold wrappers — after approval
   - **Files:** `tooling/ysk-cli/templates/agent/skills/audit-slice/SKILL.md`, `.agents/skills/audit-slice/SKILL.md`, `.claude/skills/audit-slice/SKILL.md`; `SKILLS` in `docs-pair.test.ts`; thin-smoke; `flavor-smoke.sh`; create-app tests
   - **Interface / contract / data:** none
   - **Risk:** skill-drift
   - **Rollback:** remove name from lists
   - **Acceptance:** `pnpm ysk-kit check agent` ok; dest thin has the wrapper; php-bridge still skipped

3. [ ] Application rules
   - **Files:** none
   - **Interface / contract / data:** none
   - **Risk:** none
   - **Rollback:** n/a
   - **Acceptance:** n/a — no `application/` code. Do not mkdir a module.

4. [ ] Clients
   - **Files:** none
   - **Interface / contract / data:** none
   - **Risk:** none
   - **Rollback:** n/a
   - **Acceptance:** n/a — no SDK/UI. Optional later: one line on `review-change` / `security-review` Do-not.

5. [ ] Verify — after skill PR
   - **Files:** none extra
   - **Interface / contract / data:** none
   - **Risk:** smoke list miss
   - **Rollback:** revert skill PR
   - **Acceptance:** `pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent && pnpm ysk-kit check errors` green; OpenAPI unchanged

6. [ ] Docs — after skill PR
   - **Files:** `docs/skills/index.md` pair, `AGENTS.md` pair (one row), optional plan-template sentence, changelog/README, lockstep changeset
   - **Interface / contract / data:** none
   - **Risk:** 24 KiB budget (keep the AGENTS row to one line)
   - **Rollback:** revert docs
   - **Acceptance:** EN + zh pairs match; `check agent` still ok

## Open questions

Unresolved items stay here. Do not fill them with guesses.

- Confirm skill **name** `audit-slice` vs `deep-review` vs `qa-audit`. Recommendation: `audit-slice` (scope is a slice, not the whole tree).
- Confirm **default scope** is the git diff. Alternative: dest-product `apps/api/src/modules/*` excluding kit packages. Whole kit tree should stay an explicit user override.
- Should v1 of the skill **ever** write test files, or only ever emit a test-plan? Recommendation: plan-only unless the user says “write the tests”.
- Optional later (not v1): a `check agent` rule for TypeScript `any` in `apps/` — separate plan; do not bundle with this skill.
- Whether to add a Cursor `.mdc` with `alwaysApply: false` and globs off (description-only). Recommendation: **no** extra rule file; the skill wrapper is enough. Always-on would nibble tokens.
