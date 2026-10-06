# YSK Kit — agent guide

Language: [中文](AGENTS.zh.md) · English

This file is the **only** source of agent law. Cursor, Grok Build, OpenCode, Codex, Claude Code, GitHub Copilot, and Gemini CLI all read it (or a pointer to it). Other tool files must stay thin pointers. Do not copy this file into `.cursor/`, `.claude/`, `.github/`, or `GEMINI.md`.

Read this file before changing code. Procedures: [docs/skills/](docs/skills/). Architecture: [docs/architecture.md](docs/architecture.md). Commands: [docs/cli/](docs/cli/). How-to: [docs/recipes/](docs/recipes/). Plans: [docs/plans/](docs/plans/). Changelog: [CHANGELOG.md](CHANGELOG.md). Phase diary: [docs/history.md](docs/history.md). Roadmap: [docs/product-plan.md](docs/product-plan.md).

## Orientation

YSK Kit is a contract-first SaaS platform (pnpm 12 + Turborepo + Node 24). This checkout is the living `saas` flavor: identity, files, notifications, jobs, mail, API keys, crypto, and realtime are already wired.

**Product domains stay out of the kit.** Salon, trading venue, map, or any other industry model belongs in a generated product (or in `examples/`, applied onto a new destination). Agents that invent a parallel tree, a new HTTP framework, or a client `fetch` to kit paths are doing the wrong work.

| You are changing… | Work in |
|---|---|
| The platform itself | This repository |
| A customer product | A tree from `create-ysk-app` |
| A worked tutorial | `examples/<slug>/`, then `pnpm --filter @ysk-kit/examples start apply <slug> --yes` |

Default product scaffold (agents pass flags; do not wait for TTY):

```bash
pnpm create @ysk-kit/app my-product --preset thin --db mysql --flavor saas
# or: npm create @ysk-kit/app my-product --preset thin --db mysql --flavor saas
# from this checkout:
pnpm --filter @ysk-kit/create-app start my-product --preset thin --db mysql --flavor saas
```

`--preset full` keeps the living demonstration (llm, billing, orgs, push mounted). Restore a stripped capability with `pnpm ysk-kit add llm|team|billing|push` (`billing` needs `team` first). After migrate: `pnpm db:seed`, then sign in as `admin@ysk.hk` / `ysk-admin-dev` (passwords live in `.env.example`).

New HTTP resource in this repo or a generated product:

```bash
pnpm ysk-kit add module <kebab-name> --prisma --web
```

That command writes the hexagonal slice, ts-rest contract, SDK resource, web-sdk hooks, Express + Fastify mount, composition wiring, and a memory-repo test. Fill rules in `application/` and the Prisma model. Do not invent a parallel tree.

## Repository map

```
ysk-kit/
├── AGENTS.md                 ← you are here (Chinese: AGENTS.zh.md)
├── apps/api/                 hexagonal HTTP API (Express default; Fastify via HTTP_ADAPTER)
├── apps/web|admin|mobile|desktop
├── packages/contracts        enums, DTOs, error codes, ts-rest paths
├── packages/sdk              typed HTTP client
├── packages/web-sdk          React Query hooks
├── modules/                  Prisma fragments + generator shape (notes)
├── tooling/ysk-cli           ysk-kit / yskk
├── tooling/create-ysk-app    product scaffold
├── docs/skills/              procedures (full steps)
├── docs/plans/               durable feature plans
├── .agents/skills/           shared skill wrappers (name + description)
└── examples/                 worked product overlays — not kit domain
```

| Surface | Change here | Do not |
|---|---|---|
| DTO, error code, path | `packages/contracts` first | Invent a client-only type |
| Business rule | `apps/api/src/modules/<name>/application/` | Put Prisma or Express here |
| Persistence | `apps/api/src/modules/<name>/infra/` | Import Prisma from a client |
| HTTP mount | generated Express + Fastify registers | A third adapter as default |
| Typed client | `packages/sdk`, then `packages/web-sdk` | Raw `fetch` in web/admin/mobile/desktop |
| Vite page | `apps/web/src/features/<name>/` | Talk to Prisma |

Nested `AGENTS.md` files under `packages/contracts`, `apps/api`, and the client apps add **local** reminders only.

## Hard rules

Keep all twelve. Each line is the rule; the following sentence is why.

1. **`@ysk-kit/contracts` is the only source** of enums, DTOs, error codes, and ts-rest paths. Add the DTO plus `OkSchema` / `ErrSchema` before handlers, SDK methods, or UI. Why: one contract feeds OpenAPI, SDK, tests, and every client.
2. **No TypeScript `enum`.** Use `as const` + Zod in contracts. Why: TypeScript `enum` emits runtime objects and drifts from Zod / Prisma unions. `pnpm ysk-kit check agent` fails the change.
3. **Prisma stays in `apps/api/src/modules/*/infra`** (and shared `apps/api/src/infra`). Clients never import `@prisma/client`, `@ysk-kit/db-prisma`, `apps/api/src/generated`, or `generated/prisma`. Why: the database is an adapter. Clients see HTTP.
4. **Web / admin / mobile / desktop talk to the API only through `@ysk-kit/sdk`** (React Query via `@ysk-kit/web-sdk`). No raw `fetch` to kit paths. Why: the SDK unwraps the envelope and stays on generated paths.
5. **Domain and application import neither Express, Fastify, Prisma, React, nor BullMQ.** Why: ports stay testable with in-memory fakes; `pnpm layers` enforces the graph.
6. **Every JSON route uses `{ ok: true, data }` / `{ ok: false, error }`.** Why: PHP, TypeScript, and partners share one error shape.
7. **Envelope exceptions are only:** LLM SSE (`POST /v1/llm/stream`), invoice PDF HTTP 302, `GET /docs`, `GET /openapi.json`. A new exception needs an explicit user decision and a docs update next to those four, off ts-rest.
8. **`exactOptionalPropertyTypes` is on.** Omit optional keys; do not pass `undefined`. Why: `key?: T` is “absent or T”, not “T | undefined”.
9. **Tests use in-memory ports.** Do not start Redis, Stripe, Twilio, FCM, Jaeger, or Grafana in CI. Why: unit tests must run on a clean runner without secrets or paid APIs.
10. **Discover paths from `GET /openapi.json` or `docs/openapi.yaml`.** Still call them through `@ysk-kit/sdk`. Why: OpenAPI is the catalogue; the SDK is the caller.
11. **Plan tests with `test-plan`, then write them with `write-tests`.** Rank data loss, auth, money, concurrency, and tenancy first; use in-memory ports. Why: envelope and authz bugs show up without Redis or Stripe.
12. **Client UI follows `ui-design` and is not done until `ui-review` is green.** Reuse `@ysk-kit/ui` and the zinc theme. Why: products stay accessible, consistent, and free of generic AI-slop chrome.

## Mandatory workflow

Follow this order for any feature that is not a typo, a one-line docs fix, or a mechanical rename.

1. **Understand.** Read the user request, the existing contract, the module slice, and the matching [skill](docs/skills/index.md). Identify flavor / preset / capability impact.
2. **Plan** when required (see [Planning](#planning-protocol)). Write `docs/plans/<yyyy-mm-dd>-<slug>.md` from the template (`pnpm ysk-kit plan <slug>`). Do not implement first and backfill a plan.
3. **Contracts first.** DTO, command, error codes, ts-rest path, `OkSchema` / `ErrSchema` in `@ysk-kit/contracts`.
4. **Scaffold.** `pnpm ysk-kit add module <kebab> --prisma --web` or `pnpm ysk-kit add <capability>`. Do not mkdir a parallel slice.
5. **Implement.** Rules in `application/`. Prisma in `infra/`. SDK / web-sdk / client screens last. Omit optional keys.
6. **Verify.**

   ```bash
   pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
   ```

   `pnpm layers` must stay green (clients off Express / Prisma / jobs / mail / push / AWS SDK). `pnpm ysk-kit check agent` must stay green (no TypeScript `enum`, no Prisma or raw `fetch` in clients, pointers still name `AGENTS.md`, skill copies match, root + nested `AGENTS.md` stay under 24 KiB). On Grok Build, `grok inspect` lists the rule files that were loaded.
7. **Docs / changelog / changeset.** Pair every human-readable Markdown (`name.md` + `name.zh.md`, Hong Kong Traditional Chinese). Update [CHANGELOG.md](CHANGELOG.md) / [CHANGELOG.zh.md](CHANGELOG.zh.md) and the README “latest three versions” window per [contributing](docs/contributing.md). Add a changeset when a publishable package changed.

## Planning protocol

**Required** when any of these is true:

- The work adds or changes HTTP routes, Prisma models, capabilities, or SDK / web-sdk / client surfaces.
- The work spans more than one package or more than one app.
- The user asked for a plan, a `plan.md`, or a design.
- Authz, secrets, webhooks, or a new envelope exception is in scope.

**Skip** (unless the user asks) for typo-only edits, comment-only edits, or a one-file mechanical rename.

**Durable location:** `docs/plans/<yyyy-mm-dd>-<slug>.md` (ISO date, kebab slug). Chinese pair: `docs/plans/<yyyy-mm-dd>-<slug>.zh.md`.

**Session file:** root `plan.md` is optional scratch for tools that look for that name. `pnpm ysk-kit plan <slug>` writes the dated file (and the Chinese pair) plus a root `plan.md` pointer. Edit the dated file; keep the pointer in sync. Root `plan.md` is gitignored. Dated plans are the record to commit.

Create a plan with `pnpm ysk-kit plan <slug>` or by copying [docs/plans/_template.md](docs/plans/_template.md). Procedure: [plan-feature](docs/skills/plan-feature.md). Tool mapping and a copy-paste `/plan` prompt: [docs/plans/README.md](docs/plans/README.md).

**Explore first.** Search the tree before writing the plan. List existing modules, contracts, SDK resources, hooks, and generators (`ysk-kit add module`) under Current state and reuse, before Contracts. Prefer reuse over new files.

**Assumptions.** Anything unverified belongs in Assumptions or Open questions. Never guess silently.

**Options.** When a real alternative exists, list at least two approaches with tradeoffs (complexity, layers, migration, clients), then the chosen option and why. Trivial work may say `single obvious approach — reason`.

**Approval gate.** Do not edit project files until the plan is approved, unless the user waived it. Do not exit plan mode or hand over a sketch. A plan missing any template section is incomplete. If the user rejects it or says it is too short, expand the missing sections — never shorten. After `/compact` or a long session, re-read the dated plan file before continuing. `pnpm ysk-kit plan --check <file>` fails on missing or placeholder-only headings.

Template sections (do not drop them): goal and user problem; scope / non-goals; assumptions; affected flavors / presets / capabilities; current state and reuse; options considered; contracts first (DTOs, error codes, ts-rest paths); data model / Prisma and migrations; module slices and layers; SDK / web-sdk / client surfaces; jobs / mail / realtime / notifications; security and privacy; test plan (in-memory ports); verification commands with expected results and manual checks; docs / changelog / changeset; risks and rollback; ordered task checklist (files, interface/contract/data, risk, rollback, acceptance); open questions.

### Tool plan modes

Native plan files are scratch. Grok Build writes `~/.grok/sessions/<cwd>/<session-id>/plan.md`; Cursor, Claude Code, Codex, OpenCode, and Copilot each have their own plan surface. Whatever the tool writes, the approved plan must follow this template and be saved with `pnpm ysk-kit plan <slug>` to `docs/plans/<date>-<slug>.md`. Details: [docs/plans/README.md](docs/plans/README.md).

## Definition of done

A change is done only when all of the following hold:

- [ ] Plan exists at `docs/plans/<yyyy-mm-dd>-<slug>.md` when the protocol requires one
- [ ] Contracts landed before handlers and clients
- [ ] Slice came from `ysk-kit add module` / `add <capability>` when a new resource or catalogue feature was needed
- [ ] Domain / application stay free of Express, Fastify, Prisma, React, and BullMQ
- [ ] Clients use `@ysk-kit/sdk` / `@ysk-kit/web-sdk` only
- [ ] JSON stays on the envelope; no new exception without an explicit decision
- [ ] Tests use in-memory ports
- [ ] `pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent` is green
- [ ] English and Chinese docs match in depth; changelog / README window / changeset updated when required
- [ ] No secrets, OTP codes, Stripe `sk_`, or webhook secrets in logs or commits

## When to ask the user vs decide

**Ask** before: adding an envelope exception; inventing a capability name outside the catalogue; putting industry domain in this kit; changing flavor / preset / db defaults; a breaking contract change; adopting Hono, Drizzle, Nest, or Next as a default; weakening authz, rate limits, or secret logging rules; skipping verification because an external service is “required”.

**Decide** (and record in the plan): kebab-case resource names inside the requested feature; which existing error code to reuse; memory-repo test shape; file placement inside the generated slice; whether `--web` or `--no-web` matches the apps that exist.

If a required fact is missing (which flavor, which database, whether billing may create `Organization`), ask once, then proceed.

## Common pitfalls

| Symptom | Fix |
|---|---|
| New folders under `apps/api/src/modules` by hand | Delete them. Run `pnpm ysk-kit add module <kebab> --prisma --web`. |
| `enum Foo {` in TypeScript | Replace with `as const` + Zod in contracts. |
| Client imports Prisma or `generated/prisma` | Call `@ysk-kit/sdk`. Keep Prisma in `infra/`. |
| `fetch('/v1/...')` in web/admin/mobile/desktop | Use the SDK resource / web-sdk hook. |
| `someFn({ optional: undefined })` | Omit the key. |
| Unit test boots Redis / Stripe | Inject a memory port. |
| Tool file repeats this guide | Restore a three-line pointer to `AGENTS.md`. |
| Industry model landed in this repo | Move it to a generated product or `examples/`. |
| Plan written after the code | Stop. Write the dated plan, then resume from contracts. |
| Plan is a sketch, missing a heading, or still placeholders | Fill every template section. `pnpm ysk-kit plan --check <file>`. If rejected as too short, expand — do not shrink. |
| Root + nested `AGENTS.md` over 24 KiB | Shorten local files; put procedure in `docs/skills/`. |
| Tests mock Prisma or boot Stripe | Inject a memory port. Follow [write-tests](docs/skills/write-tests.md). |
| New gradients / radii / raw `fetch` in UI | Reuse `@ysk-kit/ui`. Run [ui-review](docs/skills/ui-review.md). |

## Coding tools

Official loading rules (do not invent extra convention files):

| Tool | What it reads | This repo |
|---|---|---|
| Codex | `AGENTS.override.md` then `AGENTS.md`, one file per directory from git root to cwd; closer wins; combined cap 32 KiB (`project_doc_max_bytes`) | Root + short nested `AGENTS.md` stay well under. Skills: `.agents/skills/<name>/SKILL.md`. |
| OpenCode | `AGENTS.md` (root + nested as explored). No `CLAUDE.md` fallback. `opencode.json` `instructions` is not reliably loaded | Rely on `AGENTS.md` only. |
| Grok Build | Every matching `AGENTS.md` / `AGENT.md` / `CLAUDE.md` / `GEMINI.md` from root to cwd, plus `*.md` in `.grok/rules/`, `.claude/rules/`, `.cursor/rules/`. No size cap. Gitignored files are skipped | Pointers stay tiny. Cursor rules use `.mdc` so they are not extra Grok `*.md`. Verify with `grok inspect`. |
| Cursor | Root + nested `AGENTS.md` and `CLAUDE.md`. `.cursor/rules/*.mdc` (`alwaysApply` / `description` / `globs`). Skills in `.agents/skills/` or `.cursor/skills/` | Scoped `.mdc` files are reminders + links, not copies of this file. |
| Claude Code | `CLAUDE.md` (`@AGENTS.md` plus Claude-only notes). Skills: `.claude/skills/<name>/SKILL.md` | `.claude/skills/` matches `.agents/skills/` (drift-checked). |
| Copilot | `AGENTS.md` natively. `.github/copilot-instructions.md` and `.github/instructions/*.instructions.md` (`applyTo`) | Those files are short pointers. |
| Gemini CLI | Context filenames from `.gemini/settings.json` | `{"context":{"fileName":["AGENTS.md"]}}`. `GEMINI.md` is a pointer only. |

Shared skills live in `.agents/skills/`. Full steps live in `docs/skills/`.

## Progressive disclosure

| Task | Read |
|---|---|
| Plan a feature | [plan-feature](docs/skills/plan-feature.md), [docs/plans/_template.md](docs/plans/_template.md) |
| Scaffold a product | [new-product](docs/skills/new-product.md), [create-ysk-app](docs/cli/create-ysk-app.md) |
| Add a resource | [add-module](docs/skills/add-module.md), [recipe](docs/recipes/add-module.md) |
| Restore llm / team / billing / push | [add-capability](docs/skills/add-capability.md) |
| Envelope / SSE / PDF | [envelope-api](docs/skills/envelope-api.md), [envelope guide](docs/guides/envelope.md) |
| `pnpm layers` failed | [fix-layers](docs/skills/fix-layers.md), [hexagonal](docs/guides/hexagonal.md) |
| After any feature | [verify-change](docs/skills/verify-change.md) |
| Plan how to test | [test-plan](docs/skills/test-plan.md) |
| Write tests | [write-tests](docs/skills/write-tests.md), [testing guide](docs/guides/testing.md) |
| Add or change a screen | [ui-design](docs/skills/ui-design.md) |
| Finish UI | [ui-review](docs/skills/ui-review.md) |
| Refresh a product | [upgrade](docs/guides/upgrade.md) |
| CLI flags | [ysk-kit](docs/cli/ysk-kit.md) |

## Do not

- Put salon, trading, map, or other industry domain in this kit. Tutorials live in `examples/` (`pnpm --filter @ysk-kit/examples start apply <slug> --yes`).
- Import `@ysk-kit/observability` from web / admin / mobile / desktop.
- Add Hono / Drizzle / Nest / Next as a default.
- Log secrets, OTP codes, Stripe `sk_`, or webhook secrets.
- Duplicate this file into tool-specific wrappers.
- Rely on `opencode.json` `instructions` as the OpenCode entry.
