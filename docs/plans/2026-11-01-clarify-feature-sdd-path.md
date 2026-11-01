# Plan: Clarify feature and SDD path

Language: Chinese pair `2026-11-01-clarify-feature-sdd-path.zh.md` · English `2026-11-01-clarify-feature-sdd-path.md`

| | |
|---|---|
| **Slug** | `clarify-feature-sdd-path` |
| **Date** | 2026-11-01 |
| **Status** | draft — waiting for user approval |
| **Canonical file** | `docs/plans/2026-11-01-clarify-feature-sdd-path.md` |
| **Session pointer** | `/plan.md` (gitignored) |

Law: [AGENTS.md](../../AGENTS.md). Procedure: [plan-feature](../skills/plan-feature.md). Check: `pnpm ysk-kit plan --check docs/plans/2026-11-01-clarify-feature-sdd-path.md`.

This file is the research record for the approved Spec Kit alignment slice (proposals 1 and 5 only). Skill files and `docs/plans/sdd-path.md` ship in a later PR. This PR does not merge and does not implement.

## Goal and user problem

Agents using ysk-kit already have a constitution (`AGENTS.md`), a durable plan (`plan-feature` + `docs/plans/_template.md` + `ysk-kit plan --check`), contracts-first implementation skills, `verify-change`, `review-change`, and an optional `audit-slice`. Two gaps remain:

1. There is no kit-native **clarify** gate. When a dated plan’s Open questions are non-empty, agents guess, or they interview with product-domain questions that do not match authz, tenancy, envelope, flavor/preset, or UI surfaces.
2. The lean path and the full path are buried. `docs/plans/README.md` maps tool plan modes, but it does not say which skill sequence to run, and it does not give a copy-paste prompt for Cursor, Claude Code, and Grok Build.

Spec Kit (GitHub’s specify overlay: constitution → specify → clarify → plan → tasks → implement → converge) is a useful *sequence*, not a second law. ysk-kit is a product kit. Vendoring the Spec Kit CLI or adding `.specify/` beside `docs/plans/` would split the record.

Outcome after approval: one bilingual skill `clarify-feature`, one bilingual path card `docs/plans/sdd-path.md`, thin wrappers on the same path as `supply-scan` / `audit-slice`, and two short `AGENTS.md` progressive-disclosure rows plus one Planning protocol sentence. Lean work stays `plan-feature` → implement skills → `verify-change` → `review-change`. Full work inserts `clarify-feature` before approval. Converge stays a named follow-up.

## Scope

- In: this dated plan pair (recommendation, skill contract, path-card outline, byte budget, wiring list).
- In (after approval, later PR): `docs/skills/clarify-feature.md` + `.zh.md`.
- In (after approval): thin wrapper `tooling/ysk-cli/templates/agent/skills/clarify-feature/SKILL.md`, byte-identical copies in `.agents/skills/clarify-feature/` and `.claude/skills/clarify-feature/`. `create-ysk-app` / `ysk-kit upgrade` already copy every template skill into `.cursor/skills/` and `.grok/skills/` via `writeAgentStubs`. Do not commit those two trees (`.gitignore` ignores `.cursor/*` except rules, and ignores `.grok/`).
- In (after approval): `docs/plans/sdd-path.md` + `.zh.md` with lean and full sequences and copy-paste prompts.
- In (after approval): one progressive-disclosure row for `clarify-feature`, one for `sdd-path`, and one Planning protocol sentence in `AGENTS.md` / `AGENTS.zh.md`. Exact English bytes are under Current state.
- In (after approval): index rows, a one-sentence pointer in `plan-feature` (long skill + thin wrapper), a location-table row in `docs/plans/README.md`, one `docs/product-plan.md` row, smoke / create-app / `SKILLS` assertions, lockstep changeset, changelog, and README window. Same shape as `ae7bc50` (audit-slice), not a new release process.
- In: `pnpm ysk-kit plan --check` on **this** dated pair before the plan PR is handed over.

## Non-goals

- Out: merging this PR, or implementing the skill, before the user approves this plan.
- Out: Spec Kit CLI, `specify` init, or a `.specify/` tree (memory, constitution, spec, plan) beside `docs/plans/`.
- Out: pasting Spec Kit prompts, slash commands, or a second constitution into `AGENTS.md` or `sdd-path.md`.
- Out: `converge-feature`, `analyze-plan`, and a requirements checklist. Follow-ups only. The full path may *name* converge as not shipped.
- Out: a `plan --check` soft warning for `TBD` / `待定` in Open questions. The word is often a correct unresolved bullet. A warning that fires on every honest plan, or a new CLI flag plus help text plus tests, is not this slice. The skill tells the agent to ask; it does not change the checker.
- Out: new HTTP routes, Prisma models, envelope exceptions, capabilities, SDK methods, or dependency upgrades.
- Out: AGENTS body sections, a new hard rule, or an always-apply Cursor rule. Progressive disclosure only. Combined root + nested `AGENTS.md` must stay ≤ 24 KiB (`AGENTS_MD_BUDGET_BYTES` in `tooling/ysk-cli/src/check-agent-guidance.ts`).
- Out: php-bridge skill wrappers. That flavor still skips agent stubs.
- Out: npm publish and hand-editing `package.json` versions. A later Version Packages PR consumes the changeset.

## Assumptions

- The user approved this slice on 2026-11-01 (clarify-feature + lean/full path docs). They asked for a plan first. Skill files wait.
- Measured on `origin/main` `c5b89a6` (kit v1.6.6, 2026-11-01): files named `AGENTS.md` sum to **24269** bytes. Budget is **24576**. Headroom is **307**. `AGENTS.zh.md` is not in that sum (the walker matches the filename `AGENTS.md` only). `.runs` trees are skipped.
- Prescribed English additions below are **246** bytes, leaving about **61** bytes. Remeasure immediately before the implement PR edits `AGENTS.md`. If headroom is then under 246, shorten `### Tool plan modes` first (it already points at `docs/plans/README.md`). Do not drop a hard rule. Do not lengthen the prescribed sentence to “make it clearer” without a matching cut.
- Spec Kit’s public docs (https://github.github.com/spec-kit/) describe the overlay sequence. This plan does not vendor that repo and does not treat those docs as kit law.
- Ripgrep on this tree found no `specify`, `clarify-feature`, `sdd-path`, `spec-kit`, or `Spec Kit`.
- `writeAgentStubs` (`tooling/ysk-cli/src/agent-stubs.ts`) copies every `templates/agent/skills/<name>/SKILL.md` into `.agents`, `.claude`, `.cursor`, and `.grok`. Adding a template folder is enough for dest products. The kit repo still commits `.agents` and `.claude` copies because `docs-pair` and `check agent` compare those trees to the template.
- Next publish is a **patch** on every public package (same changeset list as `.changeset/audit-slice.md` at `ae7bc50`), so Version Packages will move 1.6.6 → 1.6.7 unless another changeset lands first. Do not hard-code 1.6.7 into `package.json` in the skill PR.
- Hong Kong Traditional Chinese pairs stay the same depth. `docs-pair` fails if any `docs/**/*.md` lacks a `.zh.md` sibling, including `sdd-path.md`.

## Affected flavors / presets / capabilities

| Axis | Value | Notes |
|---|---|---|
| Flavor | kit itself, then workspace flavors via create-app / upgrade | php-bridge does not receive skill wrappers |
| Preset | thin / full | Clarify must not assume llm, team, billing, or push on thin |
| Capabilities | referenced only | Questions may ask which catalogue capability applies. Do not invent a catalogue name |

## Current state and reuse

There is no clarify skill and no path card. The planning protocol already says: explore first, put unverified facts in Assumptions or Open questions, do not guess, do not implement before approval, `plan --check` rejects missing or placeholder-only `##` headings (`tooling/ysk-cli/src/plan.ts`). Allowed short section bodies are only `none`, `n/a`, `nil`, `no`, `沒有`, `不適用` (optional trailing period). A `TBD` bullet is therefore valid content, which is why a checker warning is a behavior change, not a one-line tweak.

`check agent` skill-drift (`check-agent-guidance.ts`) loads every skill name present under the template dir and under whichever of `AGENT_SKILL_TREES` exist on disk. On this checkout, `.cursor/skills` and `.grok/skills` are absent. If an implementer creates them locally, they must match the template or `check agent` fails. Do not commit them.

### What already covers the sequence

| Need | Already in the kit | Gap |
|---|---|---|
| Law | `AGENTS.md` Planning protocol, hard rules, definition of done | Do not add a second constitution |
| Write the plan | `plan-feature`, `_template.md`, `pnpm ysk-kit plan`, `plan --check` | No stop when Open questions are non-empty |
| Implement | `add-module`, `add-capability`, `envelope-api`, `contract-change`, `db-migration`, `ui-design`, `layout-system`, and the other rows in `docs/skills/index.md` | Path card never names this sequence |
| Prove it | `verify-change` | Stays the end of both paths |
| Law + spec review | `review-change` | Lean and full both end here |
| Staff / QA | `audit-slice` | Optional, user-asked, not a default step |
| Tool plan modes | `docs/plans/README.md` | Buried; no lean/full prompts |
| Dest-product install | `writeAgentStubs`, upgrade allowlist `docs/skills`, `docs/plans`, `.agents` | New skill must be a template folder plus committed mirrors |

### Files to reuse (do not rewrite)

| Path | Symbol | Reuse as |
|---|---|---|
| `docs/skills/plan-feature.md` | Steps, approval gate | One sentence: non-empty Open questions → `clarify-feature` before the approval ask |
| `tooling/ysk-cli/templates/agent/skills/plan-feature/SKILL.md` | Short wrapper | Same sentence in step 3; keep YAML `Use when` / `Do not` |
| `docs/skills/supply-scan.md` / `audit-slice.md` | YAML + trigger / do-not / inputs / steps / output | Shape of `clarify-feature` |
| `tooling/ysk-cli/templates/agent/skills/audit-slice/SKILL.md` | Thin wrapper | Shape of the clarify wrapper (≤1024 char description, `skill-triggers.test.ts`) |
| `tooling/ysk-cli/src/docs-pair.test.ts` | `SKILLS` | Add `'clarify-feature'` |
| `tooling/ysk-cli/src/agent-stubs.ts` | `writeAgentStubs`, `AGENT_SKILL_TREES` | No code change |
| `tooling/ysk-cli/src/upgrade.ts` | `UPGRADE_PATHS` | No code change |
| `.github/workflows/ci.yml` | thin-smoke `test -f` | One more skill path |
| `.github/scripts/flavor-smoke.sh` | agent file loop | One more skill path; php-bridge still skipped |
| `tooling/create-ysk-app/src/index.test.ts` | full + thin expect the skill; php-bridge expects it absent | Same three assertions as `audit-slice` |
| `tooling/ysk-cli/src/agent-stubs.test.ts` | `existsSync` audit-slice | One more line |
| `tooling/ysk-cli/src/upgrade.test.ts` | `existsSync` audit-slice | One more line |
| `docs/plans/README.md` | Location table | One row for `sdd-path.md` (not a dated plan; do not `plan --check` it) |
| `docs/product-plan.md` | “What you can do today” | One row, same weight as Slice audit |
| `docs/history.md` | Version one-liner | When the changelog version is known |
| `ae7bc50:.changeset/audit-slice.md` | Lockstep patch list | Copy the package list; change the summary sentence |

### Prescribed `AGENTS.md` bytes (implement PR)

Append these and do not add other English `AGENTS.md` bytes in that PR.

Progressive disclosure, immediately after the Plan a feature row:

```markdown
| Clarify open questions | [clarify-feature](docs/skills/clarify-feature.md) |
| Lean / full path | [sdd-path](docs/plans/sdd-path.md) |
```

Those two lines including their trailing newlines are **79 + 58 = 137** bytes.

Approval gate paragraph: append this sentence with one leading space and no extra blank line (**109** bytes):

```text
 Unresolved Open questions: [clarify-feature](docs/skills/clarify-feature.md) (at most five) before approval.
```

Total **246**. Residual headroom on `c5b89a6` is **61**. `AGENTS.zh.md` (not in the budget) uses the same meaning:

```markdown
| 澄清未決問題 | [clarify-feature](docs/skills/clarify-feature.zh.md) |
| 精簡／完整路徑 | [sdd-path](docs/plans/sdd-path.zh.md) |
```

Planning protocol sentence (zh), same paragraph, leading space:

```text
 未決問題仍有未解決項目時，批准前先跟隨 [clarify-feature](docs/skills/clarify-feature.zh.md)（最多五題）。
```

If remeasure shows headroom under 246, delete this English clause from `### Tool plan modes` and the matching Chinese clause (the README already lists each tool):

```text
Grok Build writes `~/.grok/sessions/<cwd>/<session-id>/plan.md`; Cursor, Claude Code, Codex, OpenCode, and Copilot each have their own plan surface. 
```

Keep the sentences that say native plans are scratch and that the approved record is `pnpm ysk-kit plan <slug>`.

## Options considered

| Option | Complexity | Layers | Migration | Clients | Notes |
|---|---|---|---|---|---|
| A. Vendor Spec Kit CLI and a `.specify/` tree beside `docs/plans/` | high | docs + a second CLI + a second plan store | dual records | agents follow whichever file they open | Second constitution. **Reject** |
| B. Fold clarify into `plan-feature` only, and add lean/full as a section of `docs/plans/README.md` | low | two existing docs | none | every plan-feature run | Lean path becomes an interview. Path stays in the file agents already miss. **Reject as the home** |
| C. New skill `clarify-feature` + `docs/plans/sdd-path.md` + two AGENTS rows + one protocol sentence | medium | docs + wrappers + smoke lists | none | dest products via create-app / upgrade | Trigger stays conditional. Matches `supply-scan` / `audit-slice`. **Chosen** |
| D. Always-apply Cursor rule, or paste the Spec Kit clarify prompt into `AGENTS.md` | low to write, high to live with | `AGENTS.md` or `.cursor/rules` | none | Cursor, or every chat | Blows the 307-byte headroom. Claude and Grok dest products miss a Cursor-only rule. **Reject** |

**Chosen:** C (this plan now; skill and path card only after approval).  
**Why:** Clarify is a gate, not a rewrite of `plan-feature`. The lean path must stay short when Open questions are already empty. The path card is the copy-paste surface. Wrappers reach dest products the same way `audit-slice` did. A and D split or bloat the law. B hides the path again and forces questions on work that does not need them.

## Contracts first

No DTO, command, error code, or ts-rest path. The contract is the skill trigger, the five question stems, and the path card.

| Item | Name / path | Notes |
|---|---|---|
| DTO | none | docs-only |
| Command | none | do not add a `ysk-kit clarify` subcommand in this slice |
| Error codes | reuse existing | Questions may name `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`. Do not invent codes |
| Paths | none | |

### Skill contract (implement after approval)

**Name:** `clarify-feature`  
**Wrappers:** YAML `name` + `description` (≤1024 characters). The description must contain `Use when` and `Do not` (`skill-triggers.test.ts`). Include 中文 triggers: 澄清、釐清、未決問題、批准前. Point at `docs/skills/clarify-feature.md` and `AGENTS.md`. Body stays a short step list, same weight as `supply-scan` / `audit-slice` wrappers.

Suggested description (implementer may tighten, must not drop `Use when` / `Do not` / the folder name):

```yaml
name: clarify-feature
description: >
  Ask at most five kit-native questions and fold the answers into the dated
  YSK Kit plan (Assumptions, Scope, Open questions) before approval.
  Use when Open questions are non-empty, the user asks to clarify, 澄清, 釐清,
  or /clarify-feature.
  中文：澄清、釐清、未決問題、批准前。
  Do not use to implement, to vendor Spec Kit or .specify/, or when Open
  questions are already empty.
```

**Trigger**

- The user asks to clarify, 澄清, 釐清, or `/clarify-feature`.
- A dated plan exists and Open questions has at least one unresolved bullet (not `none` / `n/a` / `沒有` / `不適用`).
- The agent is about to ask for approval or to implement while those bullets are non-empty.

**Do not use when**

- The planning protocol says skip (typo, comment-only, one-file rename).
- Open questions is empty or an allowed short none.
- The user waived the approval gate or said to decide and proceed. Record the decision under Assumptions. Do not re-ask.
- The task is implementation, `review-change`, `audit-slice`, or `security-review`. This skill asks. It does not review the diff and it does not approve a new envelope exception.
- To create `.specify/`, run Spec Kit, or add a second constitution.

**Inputs**

| Input | Required | Notes |
|---|---|---|
| Dated plan pair | yes | `docs/plans/<yyyy-mm-dd>-<slug>.md` and `.zh.md` |
| Which bullets are open | yes | Read them. Do not ask a question the plan already answers |
| Flavor / preset | when `.ysk-kit.json` exists | thin: do not assume llm / team / billing / push |

**Question stems (at most five, one pass)**

Ask only stems the plan does not already answer. Stop at five. If more gaps remain, leave them in Open questions. Do not open a second round unless the user asks. Do not ask industry-domain questions (those belong in the product repo, not this kit).

1. **Authz.** Which role or permission may call this? Owner versus any authenticated user? Other-author result: `FORBIDDEN` or `NOT_FOUND`?
2. **Tenancy.** Org-scoped or global? Cross-tenant: `NOT_FOUND` or an empty page, not a leaked row. Skip when the flavor has no org (thin without team, php-bridge, static-web3) and the plan is not adding team.
3. **Envelope.** Stay on `{ ok: true, data }` / `{ ok: false, error }`, or is the user requesting an exception (SSE, PDF, webhook ack)? Default: no new exception. A “yes” does not approve the exception; it records the request under Open questions for the user.
4. **Flavor / preset / capabilities.** Which flavor, thin or full, and which catalogue capabilities the slice may assume. One question, not a menu.
5. **UI surfaces.** API-only, or which of web / admin / mobile / desktop. If UI, name the screen. Do not design it (`ui-design` / `layout-system` come after approval).

**Fold**

Edit the dated English plan and the Chinese pair in the same turn. Move resolved bullets out of Open questions into Assumptions and, when they change the slice, Scope / Non-goals. Do not start contracts, modules, Prisma, or clients. Re-run `pnpm ysk-kit plan --check` on both dated files.

**Output**

```md
## Clarify — docs/plans/<date>-<slug>.md
Asked: <n> (max 5)
Still open: <bullets or none>
Updated: Assumptions | Scope | Non-goals | Open questions (EN + zh)
Gate: still waiting for approval
Next: plan-feature fill | user approves plan
```

### Path card contract (implement after approval)

`docs/plans/sdd-path.md` + `.zh.md`. Not a dated feature plan. Do not run `plan --check` on it (headings will not match `_template.md`). `docs-pair` still requires the sibling.

Law paragraph: `AGENTS.md` is the only constitution. This file is a path card. Do not create `.specify/`. Do not paste Spec Kit.

| Path | Use when | Sequence |
|---|---|---|
| Lean | Open questions empty, or the user already decided the five stems | `plan-feature` → the implement skill the plan names → `verify-change` → `review-change` |
| Full | Open questions non-empty, or the user asks to clarify | `clarify-feature` → `plan-feature` → the same implement skills → `verify-change` → (converge: **not shipped**, follow-up) → `audit-slice` only if the user asks |

Implement skills are the existing index, not a new `implement` skill: `add-module`, `add-capability`, `envelope-api`, `contract-change`, `db-migration`, `ui-design`, `layout-system`, and whichever other row the plan’s checklist names.

Copy-paste prompts: **one shared prompt**, plus one tool line each, so Cursor / Claude / Grok cannot drift into three constitutions.

Shared:

```text
Follow docs/plans/sdd-path.md.
Law: AGENTS.md. Do not create .specify/ and do not paste Spec Kit.
Lean: write docs/plans/<yyyy-mm-dd>-<slug>.md from docs/plans/_template.md and the Chinese pair. pnpm ysk-kit plan --check both files. Stop for my approval. After I approve, implement only the plan checklist, then verify-change, then review-change.
Full: if Open questions are non-empty, run clarify-feature first (at most five questions) and fold the answers into both plan files. Then the lean steps.
Do not add converge-feature, analyze-plan, or a requirements checklist.
```

Tool lines under that prompt:

- **Cursor.** Plan mode may write `.cursor/plans/`. Copy into the dated file. `.cursor/plans/` is not the record.
- **Claude Code.** Stay in plan permission mode until the dated file is approved.
- **Grok Build.** The session `~/.grok/sessions/…/plan.md` is scratch. Copy it into the dated template. `grok inspect` lists rules; it does not replace `plan --check`.

`docs/plans/README.md` location table gains one row: `sdd-path.md` / `sdd-path.zh.md` — lean and full path card, not a feature plan. The existing `/plan` prompt in that README stays. Do not fork a second template.

`plan-feature` long skill, after the fill-every-section step: if Open questions still has an unresolved bullet, stop and follow `clarify-feature` before asking for approval. Wrapper step 3 gains the same clause and still ends with `plan --check` and wait for approval. Keep the three wrapper copies identical (template, `.agents`, `.claude`).

## Data model / Prisma and migrations

None. No Prisma model, field, relation, or migration. Do not run `pnpm db:migrate`.

## Module slices and layers

No `apps/api/src/modules/*` edits. Domain and application stay untouched. Do not mkdir a module. Do not edit `.dependency-cruiser.cjs`.

## SDK / web-sdk / client surfaces

No runtime client code. No raw `fetch`. No Prisma in clients. The path card may name `ui-design` as a later step when the approved plan includes a screen. This slice does not add a screen.

## Jobs / mail / realtime / notifications

None. No queue, mail template, socket event, or in-app notification.

## Security and privacy

The skill may ask the authz and tenancy stems. It must not weaken authz, rate limits, or secret-logging rules. It must not log OTP, JWT, Stripe `sk_`, or webhook secrets. It must not write exploit steps. An answer that wants a new envelope exception stays an Open question; it is not approval. Threat-model work stays on [security-review](../skills/security-review.md). Inbound webhooks stay on [webhook-handling](../skills/webhook-handling.md). Desktop main/preload stays on [desktop-electron](../skills/desktop-electron.md).

## Test plan

This plan PR adds no production behaviour and no new test. The implement PR adds docs-pair and file-existence assertions, not memory-repo or HTTP cases.

### Change

Document, then later ship, a conditional clarify skill and a lean/full path card without a second constitution.

### Risks

1. `AGENTS.md` crosses 24 KiB (measured headroom 307; prescribed add 246).
2. Agents treat clarify as permission to implement, or as permission to vendor Spec Kit.
3. Lean path always asks five questions (trigger written too wide).
4. Wrapper drift across template / `.agents` / `.claude`.
5. Someone runs `plan --check` on `sdd-path.md` and treats the failure as a broken plan.
6. Answers land in the English plan only.

### Layer map

| Risk | Layer | File |
|---|---|---|
| Docs pair missing | docs-pair | `tooling/ysk-cli/src/docs-pair.test.ts` (`SKILLS` includes `clarify-feature`; `sdd-path.md` has a `.zh.md` sibling via the existing walk) |
| Wrapper drift | check agent | template vs `.agents` vs `.claude` |
| Contract watered down | docs-pair | new assertion: both languages say at most five and do not create `.specify/` |
| Dest product missing stub | create-app / CI | `index.test.ts`, thin-smoke, `flavor-smoke.sh` |
| php-bridge receives skills | create-app | existing php-bridge test, plus `clarify-feature` absent |

### Cases

1. **Pair and wrappers exist** — layer: docs-pair. given skill name `clarify-feature` / when the docs-pair test runs / then the English skill, zh pair, template, `.agents` and `.claude` copies exist, match, and mention `AGENTS.md`.
2. **Thin dest receives the wrapper; php-bridge does not** — layer: create-app. given `create-ysk-app` saas thin / when dest is written / then `.agents/skills/clarify-feature/SKILL.md` exists. given php-bridge / then that file is absent.
3. **Skill text keeps the cap** — layer: docs. given `clarify-feature.md` and the zh pair / when grepped / then both say at most five (zh: 最多五) and both say not to create `.specify/`.
4. **Path card names both sequences** — layer: docs. given `sdd-path.md` and the zh pair / when grepped / then lean names `plan-feature`, `verify-change`, and `review-change`; full names `clarify-feature` before `plan-feature`; converge is marked not shipped; `.specify/` is forbidden.

### Fixtures

- Existing `SKILLS` array, flavor-smoke path list, and create-app dest dirs.
- No Redis, Stripe, Playwright, or network.

### Out of scope

- Memory-repo service cases, envelope HTTP, authz integration tests, e2e.
- Implementing the skill in this plan PR.
- A unit test that `plan --check` warns on `TBD` (deferred).

## Verification commands

This plan PR is the two dated files only.

| Command | Expected result |
|---|---|
| `pnpm ysk-kit plan --check docs/plans/2026-11-01-clarify-feature-sdd-path.md` | prints `ysk-kit plan --check: ok` |
| `pnpm ysk-kit plan --check docs/plans/2026-11-01-clarify-feature-sdd-path.zh.md` | prints `ysk-kit plan --check: ok` |
| `pnpm ysk-kit check agent` | prints `ysk-kit check agent: ok` (budget unchanged; no new wrappers yet) |

Implement PR (after approval), in addition:

| Command | Expected result |
|---|---|
| `pnpm layers` | exit 0; no runtime graph change |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | exit 0, including docs-pair, skill-triggers, agent-stubs, upgrade, create-app |
| `pnpm gen:openapi` | `docs/openapi.yaml` unchanged |
| `pnpm ysk-kit check agent` | prints `ysk-kit check agent: ok` after the prescribed AGENTS edit |
| `pnpm ysk-kit check errors` | prints `ysk-kit check errors: ok` |

Do not run `pnpm e2e` (no login or shell change). Do not run `plan --check` on `docs/plans/sdd-path.md`. Optional: `pnpm lint`. On Grok Build, `grok inspect` lists loaded rules; it is not a substitute for `plan --check`.

### Manual checks

No UI, HTTP, or authz behaviour changes in this PR. Human review of this recommendation is the gate.

- [ ] UI flow: n/a
- [ ] Envelope shape: n/a
- [ ] Auth roles: n/a
- [ ] User accepts or rejects option C, the five stems, the 246-byte AGENTS text, and deferring the `plan --check` TBD warning

## Docs / changelog / changeset

- [ ] This plan pair is the research record. No changelog in this PR.
- [ ] After approval: skill pair, path card pair, index pair, `plan-feature` pair, plans README pair, product-plan pair, history pair, AGENTS pair (prescribed bytes).
- [ ] After approval: `.changeset/clarify-feature-sdd-path.md` with the same patch package list as `ae7bc50:.changeset/audit-slice.md`. Summary: add clarify-feature and the lean/full SDD path card (no Spec Kit CLI, no `.specify/`).
- [ ] Root `CHANGELOG.md` / `CHANGELOG.zh.md` and the README latest-three window move when the skill ships. Drop the oldest README window entry from the README only; it stays in the full changelog. Do not edit `package.json` versions here.
- [ ] Do not add a dependency upgrade section.

## Risks and rollback

| Risk | Why it hurts | Mitigation |
|---|---|---|
| 1. AGENTS over 24 KiB | `check agent` fails the kit and every upgraded product that copies `AGENTS.md` | Prescribed 246 bytes; remeasure; cut Tool plan modes only if needed |
| 2. Second constitution or `.specify/` | Agents edit the wrong plan | Skill and path card forbid it; docs-pair assertion |
| 3. Clarify always on | Lean fixes grow an interview | Trigger is non-empty Open questions or an explicit ask |
| 4. More than five questions | Spec Kit-style loop | One pass, cap five, remainder stays in Open questions |
| 5. Guessing into Assumptions | Violates the planning protocol | Fold only user answers; waived gate records “user said decide” |
| 6. English-only fold | zh plan drifts | Same-turn edit; output line says EN + zh |
| 7. Wrapper drift | `check agent` / thin-smoke red | Three committed copies + tests, same list as audit-slice |
| 8. `plan --check` on `sdd-path.md` | False failure | Path card says it is not a dated plan; README row says the same |
| 9. TBD warning shipped anyway | Honest plans look dirty | Explicit non-goal |
| 10. php-bridge skills | That flavor has no agent tree | Test stays `existsSync` false |
| 11. Changelog in the plan PR | Implies a release | This PR is plan files only |
| 12. New envelope exception approved inside clarify | Bypasses “ask before an envelope exception” | “Yes” stays an Open question |

Rollback of this PR: revert the plan commit. After the later skill PR: revert skill files, `SKILLS`, smoke lines, AGENTS rows, path card, and the changeset. `ysk-kit upgrade` on a dest product restores the previous wrappers.

## Task checklist

Ordered. Step 0 is this plan PR. Steps 1–6 are the implement PR after approval.

0. [x] Research record (this file)
   - **Files:** `docs/plans/2026-11-01-clarify-feature-sdd-path.md`, `docs/plans/2026-11-01-clarify-feature-sdd-path.zh.md`
   - **Interface / contract / data:** none
   - **Risk:** `plan --check` headings
   - **Rollback:** revert the commit
   - **Acceptance:** both `--check` commands print ok; status is draft — waiting for user approval; no skill files; no changeset

1. [ ] Skill contract
   - **Files:** `docs/skills/clarify-feature.md`, `docs/skills/clarify-feature.zh.md`
   - **Interface / contract / data:** none (no DTO). Trigger, do-not, five stems, fold rules, output block as written under Contracts first
   - **Risk:** interview too wide; Spec Kit paste
   - **Rollback:** delete the pair
   - **Acceptance:** at most five; stems are authz, tenancy, envelope, flavor/preset, UI surfaces; forbids `.specify/`; no TypeScript `enum`

2. [ ] Wrappers and wiring
   - **Files:** `tooling/ysk-cli/templates/agent/skills/clarify-feature/SKILL.md`; `.agents/skills/clarify-feature/SKILL.md`; `.claude/skills/clarify-feature/SKILL.md`; the same three trees for the one-line `plan-feature` wrapper edit; `SKILLS` in `docs-pair.test.ts`; `agent-stubs.test.ts`; `upgrade.test.ts`; `tooling/create-ysk-app/src/index.test.ts` (full and thin true, php-bridge false); `.github/workflows/ci.yml`; `.github/scripts/flavor-smoke.sh`
   - **Interface / contract / data:** none
   - **Risk:** skill-drift; description over 1024 or missing `Use when` / `Do not`
   - **Rollback:** remove the name from the lists and delete the folders
   - **Acceptance:** three committed copies are byte-identical; `skill-triggers` passes; thin dest has the wrapper; php-bridge does not; no committed `.cursor/skills` or `.grok/skills`

3. [ ] Path card and pointers that are not AGENTS
   - **Files:** `docs/plans/sdd-path.md`, `docs/plans/sdd-path.zh.md`; `docs/plans/README.md`, `docs/plans/README.zh.md` (one location row); `docs/skills/index.md`, `docs/skills/index.zh.md`; `docs/skills/plan-feature.md`, `docs/skills/plan-feature.zh.md`; `docs/product-plan.md`, `docs/product-plan.zh.md`
   - **Interface / contract / data:** none
   - **Risk:** three diverging prompts; `sdd-path` written as a fake feature plan
   - **Rollback:** delete the card and revert the rows
   - **Acceptance:** one shared prompt plus three tool lines; lean and full sequences match this plan; converge named as not shipped; file is not passed to `plan --check`

4. [ ] AGENTS rows
   - **Files:** `AGENTS.md`, `AGENTS.zh.md`
   - **Interface / contract / data:** none
   - **Risk:** 24 KiB budget (246 bytes prescribed; remeasure first)
   - **Rollback:** revert the three English insertions and the Chinese pair
   - **Acceptance:** exact English strings from Current state, or a shorter cut that still links both docs; `pnpm ysk-kit check agent` ok; no new hard rule and no Spec Kit paste

5. [ ] Verify
   - **Files:** none extra
   - **Interface / contract / data:** none
   - **Risk:** a smoke list missed one `audit-slice` neighbour
   - **Rollback:** revert the implement PR
   - **Acceptance:** `pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent && pnpm ysk-kit check errors` green; OpenAPI unchanged; the four docs cases above pass

6. [ ] Docs / changelog / changeset
   - **Files:** `CHANGELOG.md`, `CHANGELOG.zh.md`, `README.md`, `README.zh.md`, `docs/history.md`, `docs/history.zh.md`, `.changeset/clarify-feature-sdd-path.md`
   - **Interface / contract / data:** none
   - **Risk:** version number edited by hand; README window drops a version from the full changelog
   - **Rollback:** revert those files
   - **Acceptance:** EN + zh depth matches; changeset patch list matches audit-slice; `package.json` version unchanged in this PR; no dependency bumps

## Open questions

Nothing here blocks option C. Do not fill these with guesses.

- Approval of this plan is the gate. Skill files stay out until the user accepts option C, the five stems, the prescribed AGENTS bytes, and the decision to defer a `plan --check` TBD warning.
- Follow-ups, not questions for the implement PR: `converge-feature`, `analyze-plan`, a requirements checklist, and a `plan --check` soft warning for `TBD` / `待定`.
- If a later `AGENTS.md` edit on main shrinks headroom below 246 bytes, use the Tool plan modes cut in Current state. Do not invent a different cut unless that one is no longer present.
