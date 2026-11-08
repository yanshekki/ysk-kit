# Plan: Rust create-app choice

Language: Chinese pair `2026-11-08-rust-create-app-choice.zh.md` · English `2026-11-08-rust-create-app-choice.md`

| | |
|---|---|
| **Slug** | `rust-create-app-choice` |
| **Date** | 2026-11-08 |
| **Status** | draft — waiting for owner approval. PLAN ONLY. Do not implement, merge, publish npm, or bump versions from this PR. |
| **Canonical file** | `docs/plans/2026-11-08-rust-create-app-choice.md` |
| **Session pointer** | `/plan.md` (gitignored) |

Law: [AGENTS.md](../../AGENTS.md). Procedure: [plan-feature](../skills/plan-feature.md). Check: `pnpm ysk-kit plan --check docs/plans/2026-11-08-rust-create-app-choice.md`. Clarify: [clarify-feature](../skills/clarify-feature.md) (at most five). Path: [sdd-path](sdd-path.md).

**Recommendation (one paragraph):** Ship the user-facing Rust choice as an **opt-in `--with-rust-sidecar` overlay** on API-bearing flavors (`saas`, `desktop`, `gateway`, `trading`), not as a seventh flavor, not as a catalogue capability, and not as a second public API. v1 copies a dest-only crate that implements the existing `ICryptoPort` blob format behind composition; TypeScript `application/` stays the only domain. Default TTY and `--yes` stay **off**. Defer `desktop-tauri` and a Rust OpenAPI client. Reject a Rust rewrite of the kit, Axum as a sibling API, and “Rust as the app language”.

## Goal and user problem

Shek Ki Yan wants a **user-facing choice for Rust** in `create-ysk-app` / flavors / docs, planned before any runtime work.

The living stack is TypeScript. [ADR 0002](../adr/0002-polyglot-clients.md) already records the polyglot boundary: OpenAPI + envelope for HTTP clients; Rust may exist only as a **worker or crypto adapter behind a port**; Tauri / Flutter / KMP stay deferred; a sibling domain in Rust is forbidden. [Flavors](../guides/flavors.md) already has a Client language row for “CPU-hot crypto, codecs, or signing → **Rust sidecar**”. The guided wizard’s `LANGUAGE_NOTE` names TypeScript, `php-bridge`, and deferred Tauri — it does **not** offer a Rust opt-in, and `create-ysk-app` cannot copy a crate.

Today a human who “wants Rust” has three bad exits: invent a seventh flavor that looks like a second stack; copy `application/` into Axum (ADR forbids); or ignore the kit and vendor a sidecar by hand (no golden blob format, no `pnpm layers` story, no doctor/supply pin).

Outcome after **later** approval (not this PR): a documented, ADR-aligned choice; a flag + TTY question; a dest crate template behind `ICryptoPort`; TypeScript remains the product language.

## Scope

- In: this dated plan pair (recommendation, UX, phases, file list, security, AGENTS budget, ADR addendum **draft**).
- In: `pnpm ysk-kit plan --check` on this pair before the plan PR is handed over.
- In (after approval, later implement PR — see Task checklist): `--with-rust-sidecar` flag, wizard yes/no, php-bridge-style templates, dest `ICryptoPort` adapter, docs + ADR 0002 addendum (or 0003) marked accepted only when the owner says so, local-only cargo smoke.
- In: explicit reject / defer table so the owner does not have to guess.

## Non-goals

- Out: implementing flavor/runtime scaffolding, merging this PR as if it shipped Rust, npm publish, or `package.json` version bumps in this plan PR.
- Out: a seventh `--flavor` (`rust`, `desktop-tauri`, `rust-bridge`) in v1.
- Out: inventing a catalogue capability `rust-worker` / `rust-sidecar` (`ysk-kit add` names stay the sixteen in [capabilities](../guides/capabilities.md)). Reuse existing `crypto`.
- Out: Rust as a second public API, Axum/Actix/Warp as the product HTTP server, moving hexagonal domain out of TypeScript, or “a Rust version of ysk-kit”.
- Out: `desktop-tauri`, Flutter, KMP, FastAPI-as-main-API (ADR 0002 phases 2–3). Separate plan when a product pays.
- Out: Rust OpenAPI client codegen (php-bridge analogue) in v1. Phase 2 of *this* story at earliest.
- Out: napi-rs / N-API addon, public gRPC, or a localhost HTTP sidecar that looks like a second API.
- Out: encrypting existing identity / billing / OTP columns in Rust. v1 is the port + crate, not a data migration.
- Out: making `pnpm test`, `flavor-smoke`, or required GitHub Actions compile `rustc` (Actions quota is exhausted; default CI stays rustc-free).
- Out: AGENTS.md body sections, a new hard rule, or an always-apply Cursor rule. Combined root + nested `AGENTS.md` headroom is **61 bytes**.
- Out: industry domain (salon, venue, map) in this kit.
- Out: beta / RC / nightly Rust toolchains. Pin stable at implement time.
- Out: changing `--yes` / non-TTY defaults for flavor / preset / db / admin / mobile.
- Out: i18n of TTY wizard copy (wizard stays English, same as today).

## Assumptions

- The owner asked for a plan first. Implementation waits for approval of **this** file. This PR is research record only.
- [ADR 0002](../adr/0002-polyglot-clients.md) stays **accepted**. This plan proposes an addendum (draft below). It does not silently replace the ADR. Status stays proposed until the owner accepts it in an implement PR.
- Measured on this checkout (weekly `cursor/weekly-2026-11-08-8dc2`, kit changelog v1.6.9): files named `AGENTS.md` sum to **24515** bytes. Budget **24576**. Headroom **61**. `AGENTS.zh.md` is not in that sum. `.runs` trees are skipped. Remeasure immediately before any implement PR that touches `AGENTS.md`.
- This private worker (ki-mac-mini) has **rustc 1.99.1** / **cargo 1.99.1** (stable, 2026-10-13). Dest developers and GitHub `ubuntu-latest` must not be assumed to have it. Do not treat 1.99.1 as the kit pin until implement records `rust-toolchain.toml`.
- No `Cargo.toml` exists in this repository (ripgrep, 2026-11-08). Root `.gitignore` does not ignore `target/`.
- `@ysk-kit/crypto` exports `ICryptoPort` + `createAes256Gcm` (AES-256-GCM blob: version byte `1`, 12-byte IV, ciphertext, 16-byte tag). `CRYPTO_MASTER_KEY` is already in `ServerEnvSchema`. **`apps/api/src/composition.ts` does not inject `ICryptoPort` today.** `ysk-kit add crypto` only merges env + `apiDeps`.
- Flavors table column `worker` means the existing BullMQ process (`apps/api/src/worker.ts` / `pnpm worker`), not Rust. User-facing copy must say **sidecar**, not worker.
- `php-bridge` is the only non-copy-tree flavor: templates under `tooling/create-ysk-app/templates/php-bridge/`. That is the copy pattern to reuse.
- GH Actions quota is exhausted. Implement must not add a required Actions job that needs `rustc`. Local `plan --check` / `check agent` are enough for this plan PR.
- Hong Kong Traditional Chinese pairs stay the same depth. `docs-pair` will require a `.zh.md` sibling for any new `docs/**/*.md` in the implement PR (ADR, recipe, skill).
- `exactOptionalPropertyTypes` stays on: omit `CRYPTO_ADAPTER` rather than pass `undefined`.
- Tests stay on in-memory / Node ports. Spawning Rust in Vitest is out of default `pnpm test`.

## Affected flavors / presets / capabilities

| Axis | Value | Notes |
|---|---|---|
| Flavor | kit itself, then dest products via create-app | Flag honoured on `saas`, `desktop`, `gateway`, `trading`. **Ignored** on `php-bridge` and `static-web3` (no API process), same skip rule as `--preset`. Not a seventh flavor. |
| Preset | n/a | `--preset thin\|full` unchanged. Rust sidecar is orthogonal to llm/team/billing/push stripping. |
| Capabilities | reuse `crypto` | Do **not** add `rust-sidecar` to `CAPABILITIES` in `add-capability.ts`. AGENTS.md says ask before inventing a catalogue name. |

## Current state and reuse

Explore (2026-11-08) found no Cargo crate, no Tauri app, no Rust OpenAPI client, and no `--with-rust-*` flag. Rust appears only as ADR / flavors / wizard **prohibition or deferral**.

### What already covers the boundary

| Need | Already in the kit | Gap |
|---|---|---|
| Polyglot HTTP | ADR 0002, `php-bridge`, recipe [php-openapi-client](../recipes/php-openapi-client.md) | No Rust client; not v1 |
| CPU-hot crypto | `@ysk-kit/crypto` `ICryptoPort` + Node `createAes256Gcm`; capability `crypto`; `CRYPTO_MASTER_KEY` | No Rust impl; composition does not inject the port |
| Product shape | Six flavors in `FLAVORS`; wizard `FLAVOR_ITEMS` 1–6 | Rust is not a flavor and must not become one |
| Language education | `LANGUAGE_NOTE` in `wizard-copy.ts`; flavors Client language table | Note says Tauri deferred; does not offer sidecar opt-in |
| BullMQ worker | `pnpm worker`, `apps/api/src/worker.ts`, flavors column `worker` | Name collision if we say “Rust worker” |
| Layers | `.dependency-cruiser.cjs` (`pnpm layers`) | TS-only; cannot see Cargo |
| Agent scan | `check agent`: no-ts-enum, clients-no-prisma, clients-no-raw-fetch, pointer, skill-drift, 24 KiB budget | No rust-boundary rule |
| Supply | `ysk-kit check supply` Node / PHP / kernel / lockfile IOCs | No rustc / `Cargo.lock` inventory |
| Desktop | Electron 44 + [desktop-electron](../skills/desktop-electron.md); Prisma never in Electron | Tauri deferred; sidecar belongs on the **API** process, not in the renderer |
| Dest marker | `.ysk-kit.json` `{ kit, version, flavor, preset, db }` | No rust field; prefer detect `crates/ysk-sidecar/Cargo.toml` over schema churn |

### Files to reuse (do not rewrite)

| Path | Symbol | Reuse as |
|---|---|---|
| `docs/adr/0002-polyglot-clients.md` | Decision + phased roadmap | Addendum: sidecar is phase 1 **runtime** of the existing “Rust behind a port” bullet; Tauri stays phase 2 |
| `docs/guides/flavors.md` | Client language table, worker column | Keep Electron default; promote sidecar row from “docs only” to “`--with-rust-sidecar`”; never rename BullMQ `worker` |
| `tooling/create-ysk-app/src/wizard-copy.ts` | `LANGUAGE_NOTE`, `FLAVOR_ITEMS` | Extend note: sidecar opt-in, Tauri still deferred. Desktop `avoidWhen` keeps “Tauri binary (deferred)” |
| `tooling/create-ysk-app/src/prompt.ts` | `pickYesNo`, `PRESET_SKIP`, confirm summary | New yes/no after language note, API flavors only; add a summary line |
| `tooling/create-ysk-app/src/scaffold.ts` | `FLAVORS`, `parseArgs`, php-bridge copy | New flag; copy `templates/rust-sidecar/` when on; ignore on php-bridge / static-web3 |
| `tooling/create-ysk-app/templates/php-bridge/` | Isolated template tree | Shape of `templates/rust-sidecar/` (crate + README, not a monorepo fork) |
| `packages/crypto/src/index.ts` | `ICryptoPort`, blob layout | Golden vectors stay here; dest adapter implements the same bytes |
| `packages/config/src/index.ts` | `CRYPTO_MASTER_KEY` | Optional `CRYPTO_ADAPTER` as `'node' \| 'rust'` union of literals — omit when default node |
| `apps/api/src/composition.ts` | Adapter construction | Dest-only factory when flag on; living kit may stay unwired until a use-case exists |
| `tooling/ysk-cli/src/add-capability.ts` | `CAPABILITIES` includes `crypto` | Do not add a name. Hint text may mention the sidecar recipe |
| `.github/scripts/flavor-smoke.sh` | php-bridge `php -l` when php exists | Analog: **optional** local `rust-sidecar-smoke.sh` when `rustc` exists; default matrix stays rustc-free |
| `docs/skills/new-product.md` | Flavor hint table | One row: CPU-hot crypto → `--with-rust-sidecar` on an API flavor |
| `docs/skills/supply-scan.md` / `catalog.json` | PHP `require.php` floors | Later: rustc lines. Not v1 required CI |
| `tooling/ysk-cli/src/check-agent.ts` | `AgentRule` union | Later: `rust-sidecar-boundary` if `crates/` exists |
| `docs/plans/2026-11-01-clarify-feature-sdd-path.md` | Plan-only PR shape | This file’s structure |
| `docs/plans/2026-10-13-create-app-guided-wizard.md` | Wizard UX law | Numbers + slugs; `--yes` silent; TTY English |

## Options considered

### Product shape (what “choose Rust” means)

| Option | Complexity | Layers | Migration | Clients | Notes |
|---|---|---|---|---|---|
| **A. Opt-in Rust sidecar crate** beside the TS API, behind `ICryptoPort` (HTTP/stdio private; not a public API) | medium | create-app templates + dest infra + docs | none for existing dests (default off) | none; kit TS clients stay on SDK | ADR 0002 already allows this. **Chosen** |
| **B. `desktop-tauri` flavor** (Rust + WebView desktop client consuming OpenAPI) | high | new flavor, desktop skill fork, CI, supply | two desktop defaults if Electron stays | new dest app; still no second domain | ADR 0002 phase 2: “when a customer pays”. **Defer** |
| **C. Rust OpenAPI client** (php-bridge analogue: envelope unwrap, no `application/`) | medium | new template flavor or extra lang dir | none | partners calling `API_PUBLIC_URL` | Honest polyglot client; does **not** put Rust in the product hot path. **Defer to phase 2 of this story** |
| **D1. Seventh flavor `rust` / `rust-api`** that copies or replaces `apps/api` | high | flavor matrix ×2, doctor, smoke | looks like a second stack | agents will duplicate rules | **Reject** — contradicts ADR option 2 (sibling domain) |
| **D2. Preset `rust` or catalogue `ysk-kit add rust-worker`** | medium | `CAPABILITIES`, thin/full confusion | upgrade/doctor catalogue churn | none | **Reject** — presets strip llm/team/billing/push; AGENTS.md forbids inventing a capability name without an ask. Owner can override in Open questions |
| **D3. napi-rs native addon in `@ysk-kit/crypto`** | high | published tarball grows `.node`; Electron ABI (desktop 44); kit CI needs rustc | npm provenance + optional deps | desktop rebuild | **Reject for v1** — ABI + required rustc in pack-and-run |
| **D4. Localhost HTTP/gRPC sidecar** as the v1 IPC | medium | looks like a second API; envelope temptation | agents add routes | partners might call it | **Reject for v1**. ADR allows internal HTTP/gRPC; stdio is the smaller trust boundary |
| **D5. “Rust version of TypeScript” as the app language** | n/a | would fork the kit | total | all | **Reject** |

**Chosen:** A.  
**Why:** It is the only shape that is already law (ADR 0002 + flavors table), that does not multiply flavors, that keeps `@ysk-kit/contracts` as the only HTTP source, and that gives a user-facing create-app choice without a second domain. B and C remain ranked follow-ups. D1–D5 are traps the wizard must keep educating against.

### UX surface (where the user picks it)

| Surface | Pros | Cons | Verdict |
|---|---|---|---|
| New `--flavor rust` / `desktop-tauri` | Visible in the 1–6 menu | Flavor = which **apps** copy; Rust is an adapter. Menu becomes 7; agents pick it instead of `saas` | **Reject** |
| `--preset` value | One flag people already pass | Preset means thin/full capability depth | **Reject** |
| **`--with-rust-sidecar` flag** (default off) + TTY yes/no after `LANGUAGE_NOTE`, API flavors only | Matches `--no-admin` / `--no-mobile` (optional extra). `--yes` stays silent. Agents pass the flag. Name does not collide with `pnpm worker` | One more prompt on TTY; confirm summary needs a line | **Chosen** |
| Wizard-only education, no flag (status quo + softer copy) | Zero scaffold risk | Not a **choice** — today already educates and refuses | **Reject as the ship slice** |
| Always-on crate in every API dest | No question | Forces rustc on every product; blows CI | **Reject** |

Confirm summary (implement) would add `Rust sidecar: yes|no|n/a`. `n/a` for php-bridge / static-web3. Empty Enter on the question = **no**.

### v1 vs later

| Item | v1 (first implement PR after approval) | Later |
|---|---|---|
| `--with-rust-sidecar` + TTY yes/no + HELP | yes | — |
| Dest `crates/ysk-sidecar` (stdio JSON, AES-256-GCM matching Node blob) | yes | more ops (codecs, signing) as extra cmds |
| Dest `apps/api/src/infra/rust-crypto-adapter.ts` implementing `ICryptoPort` | yes | — |
| `CRYPTO_ADAPTER=rust` (omit key = Node) | yes | — |
| Wire living `composition.ts` to encrypt product rows | no | when a real use-case is planned |
| Golden vectors in `@ysk-kit/crypto` tests (Node) | yes | Rust tests assert the same bytes when rustc present |
| Default `pnpm test` / flavor-smoke rustc | no | optional local script; never required Actions until quota returns **and** owner asks |
| ADR 0002 addendum accepted | yes (in implement PR) | — |
| `desktop-tauri` flavor | no | ADR phase 2, own plan |
| Rust OpenAPI client (`rust-bridge` or php-bridge extra dir) | no | phase 2 of this story, own checklist |
| `ysk-kit add rust-sidecar` catalogue name | no | only if owner later approves inventing a capability |
| `check supply` rustc floors + `Cargo.lock` audit | docs + committed lockfile | catalog lines + `cargo audit` when crate present |
| `check agent` rust-boundary | lightweight grep if `crates/` exists | — |
| AGENTS.md progressive-disclosure row | **no** unless a trim lands first | after Tool plan modes cut |
| napi-rs, public gRPC, Axum API | never as default | almost never (ADR phase 3) |

## Contracts first

No new ts-rest path, DTO, command, or envelope exception. Public JSON stays `{ ok: true, data }` / `{ ok: false, error }`. The sidecar protocol is **private process-local stdio**, not OpenAPI.

| Item | Name / path | Notes |
|---|---|---|
| DTO | none | no HTTP resource |
| Command | none | sidecar ops are `encrypt` / `decrypt` on `ICryptoPort`, not REST commands |
| Error codes | reuse existing | spawn/crash of the child is an infra failure → existing `INTERNAL` if a use-case later calls the port. Do not invent `RUST_*` codes in v1 |
| Paths | none | do not mount the sidecar on `/v1/` or localhost TCP |
| Interop blob | `@ysk-kit/crypto` | `[version=1][iv 12][ciphertext][tag 16]`, AES-256-GCM, key = 32 bytes from 64 hex `CRYPTO_MASTER_KEY` |
| Stdio frame (private) | dest crate only | length-prefixed or newline JSON `{ id, op, blob }` / `{ id, ok, blob \| error }`. **Not** the public envelope. Document in the crate README as internal |
| Env | `CRYPTO_ADAPTER` | optional `'node' \| 'rust'` in dest `.env.example`. Omit = Node. `z.union` of literals in config if the living kit learns the key; dest-only env is enough for v1 |
| Flag | `--with-rust-sidecar` | create-app only. Unknown flavor still throws `not in this phase` |

### ADR 0002 addendum (draft — not accepted)

Status: **proposed** in this plan. Do not change `docs/adr/0002-*.md` until the owner accepts this plan and an implement PR lands. Prefer an **addendum section** on 0002 (keep one polyglot ADR) over a new 0003, unless the owner wants a separate number.

Copy for implement (English; Chinese pair the same meaning):

```markdown
## Addendum — optional Rust sidecar (proposed YYYY-MM-DD)

User-facing choice: `create-ysk-app --with-rust-sidecar` (TTY yes/no, default no)
on API-bearing flavors. This is not a flavor, not a catalogue capability, and
not a second public API.

- Dest products may receive `crates/ysk-sidecar` implementing `ICryptoPort`
  (crypto, codecs, signing) behind `apps/api` composition.
- TypeScript `application/` remains the only place for membership, billing,
  tenancy, and envelope rules. Rust must not reimplement those.
- IPC for v1 is a child process with private stdio. No public HTTP, no public
  gRPC, no napi-rs in the published `@ysk-kit/crypto` tarball.
- `pnpm layers` remains authoritative for the TypeScript graph. Cargo is
  invisible to dependency-cruiser; `check agent` may grow a rust-boundary
  grep when `crates/` exists.
- `desktop-tauri`, Flutter, KMP, FastAPI/Axum as main API, and a Rust OpenAPI
  client stay on the phased roadmap (phases 1–3 of this ADR). This addendum
  does not authorise them.
```

Phase table tweak (implement): keep phase 0 as docs (already shipped). Insert “1a — optional dest sidecar (this addendum)” **before** “1 — extra OpenAPI client languages”. Do not renumber Tauri out of phase 2.

## Data model / Prisma and migrations

None. No Prisma model, field, relation, or migration. Do not run `pnpm db:migrate`. Do not encrypt existing columns.

The only “data” contract is the **ciphertext blob** already implied by `createAes256Gcm`. Implement must publish golden hex fixtures in `packages/crypto` tests so a Rust `aes-gcm` crate can match without guessing nonce size or version byte. Breaking that layout later is a crypto version bump (`VERSION` byte), not a SQL migration.

`.ysk-kit.json` stays `{ kit, version, flavor, preset, db }`. Do **not** add `rustSidecar` in v1; doctor/upgrade detect `crates/ysk-sidecar/Cargo.toml`.

## Module slices and layers

No new `ysk-kit add module`. No `apps/api/src/modules/*/domain` or `application` edits in v1.

| Layer | v1 change (implement, dest template) | Must not |
|---|---|---|
| domain / application | untouched | import `child_process`, Cargo, or tokio |
| dest infra | `apps/api/src/infra/rust-crypto-adapter.ts` implements `ICryptoPort` | listen on a port; log key/plaintext |
| composition | dest factory: Node default; rust when `CRYPTO_ADAPTER=rust` **and** binary present | make rust the kit default |
| `@ysk-kit/crypto` | golden vectors; Node impl stays default | ship `.node` addons |
| `pnpm layers` | **no** `.dependency-cruiser.cjs` edit | weakening clients-no-server-infra |
| Electron | untouched | load the sidecar in the renderer; Prisma-in-Electron analogue |

Hard rule 5 still holds: domain and application import neither Express, Fastify, Prisma, React, nor BullMQ — and not Cargo.

## SDK / web-sdk / client surfaces

No runtime client code. No raw `fetch`. No Prisma in clients. Web / admin / mobile / desktop do not import `@ysk-kit/crypto` today (`clients-no-server-infra` already forbids `@ysk-kit/crypto`). The sidecar must not appear in Vite or Expo.

`packages/sdk` / `packages/web-sdk`: no new resource. Discovering encrypt/decrypt over HTTP would be a new public API — out of scope.

Desktop flavor + sidecar: the crate still lives next to **`apps/api`**, not inside Electron. Desktop talks to the API through `@ysk-kit/sdk`.

## Jobs / mail / realtime / notifications

None for the sidecar. Do not enqueue BullMQ jobs to talk to Rust in v1. Do not name the crate `worker` and do not hook `apps/api/src/worker.ts`. Mail, Socket.IO, and push stay TypeScript ports.

`pnpm worker` remains the BullMQ consumer. Copy and HELP must keep that sentence intact so trading/gateway docs do not drift.

## Security and privacy

Procedure: [security-review](../skills/security-review.md). New trust boundary: a child process that can encrypt and decrypt whatever the API sends it.

| Topic | v1 rule |
|---|---|
| Authz | Sidecar is process-local. No new role, permission, or `/v1/` route. No other-author case. |
| Tenancy | Unchanged. Rust must not learn org ids as a security control; `application/` still checks membership. |
| Envelope | No new exception. Stdio JSON is not public HTTP. |
| Secrets | `CRYPTO_MASTER_KEY` already required in production (`createCryptoFromEnv`, doctor). Never log the key, OTP, JWT, Stripe `sk_`, webhook secrets, plaintext, or ciphertext. Child inherits the API env — same process-local threat as Node `node:crypto`. Do not pass the key on the argv (ps list). |
| Network | Child: no bind, no `reqwest` to the public API, no shell. Spawn without `/bin/sh`. |
| `unsafe` | Forbidden in the template crate. |
| Supply | Commit `Cargo.lock`. Stable `rust-toolchain.toml` only. Prefer a tiny crate set (`serde`, `serde_json`, RustCrypto `aes-gcm`). No `git` dependencies. No beta toolchain. |
| Desktop | Sidecar is not an IPC channel in Electron. [desktop-electron](../skills/desktop-electron.md) stays the Electron review. |
| Audit | `cargo audit` / `cargo deny` are local/follow-up; do not require them in GitHub Actions while quota is exhausted. |
| Logging | Child stderr is not a secret dump. Structured errors only (`op failed`), no payload. |

Threat-model mode on the implement PR is justified (new trust boundary) but stays optional unless the owner asks. Do not write exploit steps.

## Test plan

This plan PR adds no production behaviour and no new test. The implement PR follows [test-plan](../skills/test-plan.md) / [write-tests](../skills/write-tests.md): in-memory ports, no Redis/Stripe, **no rustc in default Vitest**.

### Change

Give dest products an opt-in Rust sidecar behind `ICryptoPort` without a second domain, a seventh flavor, or rustc in required CI.

### Risks

1. Agents treat the crate as permission to rewrite `application/` in Rust.
2. `--with-rust-sidecar` is confused with `pnpm worker` / flavors `worker`.
3. Default CI / flavor-smoke start requiring rustc.
4. Wizard claims Tauri is available.
5. Envelope exception sneaks in via a localhost HTTP sidecar.
6. `AGENTS.md` crosses 24 KiB (61 bytes headroom).
7. Node and Rust AES blobs diverge (interop).
8. php-bridge receives a crate (no API).
9. `CRYPTO_MASTER_KEY` lands in logs or argv.
10. Catalogue name `rust-sidecar` is added without an owner ask.

### Layer map

| Risk | Layer | File |
|---|---|---|
| Flag / skip rules | create-app | `scaffold.ts`, `prompt.ts`, `help.ts`, `index.test.ts`, `prompt.test.ts` |
| Template drift | create-app | `templates/rust-sidecar/**` |
| Interop blob | unit | `packages/crypto/src/index.test.ts` golden vectors |
| Adapter without rustc | unit | dest adapter test with a fake child (scripted stdio), memory/`createAes256Gcm` still default |
| php-bridge skip | create-app | existing php-bridge dest assertions + crate absent |
| Layers | `pnpm layers` | unchanged graph |
| Agent law | `check agent` | budget unchanged in v1; optional rust-boundary grep |
| Docs pair | docs-pair | ADR addendum, flavors, create-ysk-app, recipe |

### Cases

1. **Flag off / `--yes` default** — given saas thin `--yes` / when dest is written / then `crates/ysk-sidecar` is absent and confirm was not asked.
2. **Flag on, API flavor** — given `--flavor gateway --with-rust-sidecar --yes` / when dest is written / then `crates/ysk-sidecar/Cargo.toml` and the adapter file exist; README says not a public API.
3. **Flag ignored** — given php-bridge or static-web3 + `--with-rust-sidecar` / then no crate (or a documented no-op + warning), same as ignored `--preset`.
4. **TTY default no** — given scripted Enter on the sidecar question / then dest has no crate; Proceed no still writes nothing.
5. **Language note** — given wizard / then copy still says Tauri/Flutter/KMP **deferred** and says sidecar is opt-in, not a flavor.
6. **Node golden blob** — given `createAes256Gcm` / when encrypt/decrypt / then fixtures stay stable (version, IV length, tag length).
7. **Fake child adapter** — given a scripted stdio fake / when `ICryptoPort.encrypt` / then the adapter frames JSON and does not call `fetch`.
8. **Unknown flavor** — still `not in this phase` (existing test).
9. **layers / check agent** — dest with crate still passes TS layers; clients still cannot import `@ysk-kit/crypto`.

### Fixtures

- Existing `AskFn` prompt tests, php-bridge dest, `DEV_CRYPTO_KEY_HEX`.
- New: golden ciphertext hex for a fixed plaintext + key (Node). Optional cargo test is **not** in `pnpm test`.
- No Redis, Stripe, Playwright, network, or rustc.

### Out of scope

- Memory-repo HTTP/authz cases (no new resource).
- Playwright / ui-review (no screen).
- Compiling the crate on GitHub Actions.
- Implementing this plan in the plan PR.

## Verification commands

This plan PR is the two dated files only.

| Command | Expected result |
|---|---|
| `pnpm ysk-kit plan --check docs/plans/2026-11-08-rust-create-app-choice.md` | prints `ysk-kit plan --check: ok` |
| `pnpm ysk-kit plan --check docs/plans/2026-11-08-rust-create-app-choice.zh.md` | prints `ysk-kit plan --check: ok` |
| `pnpm ysk-kit check agent` | prints `ysk-kit check agent: ok` (budget unchanged; no new wrappers) |

Do not run `pnpm e2e`. Do not run flavor-smoke (Actions quota; no runtime change). Optional: `pnpm layers` still green because no graph change. On Grok Build, `grok inspect` lists loaded rules; it is not a substitute for `plan --check`.

Implement PR (after approval), in addition:

| Command | Expected result |
|---|---|
| `pnpm layers` | exit 0; `.dependency-cruiser.cjs` **unedited** unless the owner approved a rule |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | exit 0 **without** rustc; create-app flag cases green |
| `pnpm gen:openapi` | `docs/openapi.yaml` unchanged |
| `pnpm ysk-kit check agent` | `ok`; combined AGENTS.md ≤ 24576 |
| `pnpm ysk-kit check errors` | `ok` |
| `pnpm ysk-kit plan --check` on this pair | still ok (status may become approved) |
| Local `cargo test` in dest crate | only when rustc present; not required to merge |

### Manual checks

No UI, HTTP, or authz behaviour changes in this plan PR. Human review of the recommendation is the gate.

- [ ] UI flow: n/a (implement later: TTY yes/no + confirm line; no Vite screen)
- [ ] Envelope shape: n/a (no new public JSON)
- [ ] Auth roles: n/a
- [ ] Owner accepts or adjusts option A, `--with-rust-sidecar`, deferral of Tauri / OpenAPI-Rust, and the five Open questions
- [ ] If the user asked for a staff/QA audit of this slice, follow [audit-slice](../skills/audit-slice.md) — not requested for this plan PR

## Docs / changelog / changeset

- [ ] This plan pair is the research record. **No changelog, no changeset, no README window in this PR.**
- [ ] After approval (implement PR): ADR 0002 addendum pair (status accepted only with owner); [flavors](../guides/flavors.md) pair (sidecar row names the flag; Tauri still deferred; worker column still BullMQ); [create-ysk-app](../cli/create-ysk-app.md) pair + `HELP`; [architecture](../architecture.md) generators row; [new-product](../skills/new-product.md) flavor hint; [product-plan](../product-plan.md) “What you can do today”; recipe `docs/recipes/rust-sidecar.md` pair modelled on php-openapi-client; optional skill `docs/skills/rust-sidecar.md` **without** an AGENTS.md row.
- [ ] After approval: `.changeset/rust-sidecar.md` patch on `@ysk-kit/create-app` (and `@ysk-kit/cli` if doctor/check-agent gain detection). Lockstep list copied from a recent create-app changeset. Do not hand-edit `package.json` versions.
- [ ] Root CHANGELOG / README latest-three window move when the flag ships, not in this PR.
- [ ] AGENTS.md: **zero bytes** in v1 unless headroom is made. Prescribed trim + row live under Current state (below). Do not paste this plan into `AGENTS.md`.

### AGENTS.md budget (implement PR, only if the owner insists on a row)

Measured **24515 / 24576**, headroom **61**. A progressive-disclosure row is ~70–90 bytes → **will fail `check agent` without a cut**.

**v1 default: no AGENTS.md edit.** Pointers go in flavors, create-ysk-app, new-product, ADR addendum. The Do-not list already says not to copy domain into a sibling Rust API.

If the owner wants a row, **trim first** (same cut as [clarify-feature](2026-11-01-clarify-feature-sdd-path.md)): delete this English clause from `### Tool plan modes` and the matching Chinese clause (the plans README already lists each tool):

```text
Grok Build writes `~/.grok/sessions/<cwd>/<session-id>/plan.md`; Cursor, Claude Code, Codex, OpenCode, and Copilot each have their own plan surface. 
```

Then add **one** progressive-disclosure row after Scaffold a product (do not add a hard rule):

```markdown
| Optional Rust sidecar | [flavors](docs/guides/flavors.md) (`--with-rust-sidecar`; not a flavor) |
```

Remeasure before editing. If headroom is still short, drop the row and keep docs-only pointers. Nested `apps/*/AGENTS.md` stay untouched. php-bridge still skips agent stubs.

A new skill, if any, is a thin wrapper under `tooling/ysk-cli/templates/agent/skills/rust-sidecar/SKILL.md` plus `.agents` / `.claude` mirrors (byte-identical, `Use when` / `Do not`, 中文 triggers). That does **not** require an AGENTS row. `writeAgentStubs` already copies every template folder.

## Risks and rollback

| Risk | Why it hurts | Mitigation |
|---|---|---|
| 1. Second domain in Rust | Authz/tenancy drift; `pnpm layers` blind | Flag copy + crate README + ADR addendum + optional check-agent grep; review-change Law axis |
| 2. Seventh flavor | Matrix explosion; agents pick `rust` instead of `saas` | Flag overlay; unknown `--flavor rust` still `not in this phase` |
| 3. Name “worker” | Trading/gateway operators attach the crate to BullMQ | User-facing **sidecar**; HELP keeps `pnpm worker` as queues |
| 4. rustc in required CI | Cannot merge while Actions quota is exhausted; dest without Rust fails smoke | Default tests rustc-free; optional local script |
| 5. AGENTS over 24 KiB | `check agent` red on kit and upgraded products | No row unless trim; remeasure |
| 6. Envelope exception | Localhost HTTP sidecar becomes a public API | v1 stdio only |
| 7. Blob mismatch | Silent decrypt failure in production | Golden vectors; VERSION byte |
| 8. Secret leakage | Key in argv/logs | Env only; never log; security-review |
| 9. napi/Electron ABI | desktop flavor rebuild hell | No native addon in v1 |
| 10. Catalogue invention | Violates AGENTS ask-before | Reuse `crypto`; Open question 1 |
| 11. Changelog in the plan PR | Implies a release | This PR is plan files only |
| 12. Tauri implied available | Wizard already burned this once | Keep “deferred / do not scaffold” |

Rollback of this PR: revert the plan commit. After a later implement PR: revert the flag, templates, docs, changeset; dest products keep a crate until they delete it (`upgrade` does not remove dest `crates/` unless we later add that — v1 upgrade should **not** delete a sidecar the product added).

## Task checklist

Ordered. Step 0 is this plan PR. Steps 1–7 are the implement PR **after approval**. Do not start 1–7 from this branch.

0. [x] Research record (this file)
   - **Files:** `docs/plans/2026-11-08-rust-create-app-choice.md`, `docs/plans/2026-11-08-rust-create-app-choice.zh.md`
   - **Interface / contract / data:** none
   - **Risk:** `plan --check` headings
   - **Rollback:** revert the commit
   - **Acceptance:** both `--check` commands print ok; status is draft — waiting for owner; no flavor/runtime code; no changeset

1. [ ] ADR + user docs (still no crate if the owner wants a docs-first split; default is same PR as 2–6)
   - **Files:** `docs/adr/0002-polyglot-clients.md` + `.zh.md` (addendum); `docs/guides/flavors.md` pair; `docs/cli/create-ysk-app.md` pair; `docs/architecture.md` pair; `docs/skills/new-product.md` pair; `docs/product-plan.md` pair; recipe pair; optional skill pair + three wrapper copies
   - **Interface / contract / data:** none HTTP. ADR status becomes accepted only with owner
   - **Risk:** implying Tauri is ready; AGENTS.md bytes
   - **Rollback:** revert those docs
   - **Acceptance:** EN + zh same depth; no TypeScript `enum`; `docs-pair` green; AGENTS.md untouched unless trim+row approved

2. [ ] create-app flag and wizard
   - **Files:** `tooling/create-ysk-app/src/scaffold.ts`, `prompt.ts`, `wizard-copy.ts`, `help.ts`, `index.ts`, `prompt.test.ts`, `index.test.ts`
   - **Interface / contract / data:** `--with-rust-sidecar`; summary line; `PRESET_SKIP`-style ignore for php-bridge / static-web3
   - **Risk:** `--yes` prompting; flavor 1–6 numbering unchanged
   - **Rollback:** revert those files
   - **Acceptance:** `--yes` silent default off; TTY Enter = no; unknown `--flavor rust` still `not in this phase`; tests cover on/off/ignore/cancel

3. [ ] Sidecar template + dest adapter
   - **Files:** `tooling/create-ysk-app/templates/rust-sidecar/**` (`Cargo.toml`, `rust-toolchain.toml` stable pin, `src/main.rs`, README pair, `.gitignore` `target/`); dest paths `crates/ysk-sidecar/`, `apps/api/src/infra/rust-crypto-adapter.ts`; root dest `.gitignore` `crates/**/target/`
   - **Interface / contract / data:** private stdio; `ICryptoPort`; no `/v1/` 
   - **Risk:** `unsafe`; extra crates.io deps; blob mismatch
   - **Rollback:** delete the template dir and copy hook
   - **Acceptance:** crate README says not a public API; no Axum/Actix; `unsafe` absent; Node golden vectors exist; adapter tests use a fake child

4. [ ] Optional local smoke (not required CI)
   - **Files:** `.github/scripts/rust-sidecar-smoke.sh` (skip 0 if no rustc); **do not** add a matrix cell to `.github/workflows/ci.yml` while Actions quota is exhausted
   - **Interface / contract / data:** none
   - **Risk:** someone makes it required
   - **Rollback:** delete the script
   - **Acceptance:** default flavor-smoke script unchanged; local script `cargo test` + Node roundtrip when rustc exists

5. [ ] Guardrails (doctor / check agent / supply) — keep tiny
   - **Files:** optional `check-agent.ts` rule `rust-sidecar-boundary` (Cargo.toml must not depend on axum/actix-web/warp; README mentions ICryptoPort); doctor warning if `CRYPTO_ADAPTER=rust` but crate missing; **no** catalog rustc floor required in v1
   - **Interface / contract / data:** none
   - **Risk:** false positives on unrelated future crates
   - **Rollback:** drop the rule
   - **Acceptance:** `pnpm layers` still the TS authority; check agent ok on kit (no `crates/` in kit itself)

6. [ ] Verify
   - **Files:** none extra
   - **Interface / contract / data:** none
   - **Risk:** OpenAPI dirty; AGENTS budget
   - **Rollback:** revert the implement PR
   - **Acceptance:** `pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent && pnpm ysk-kit check errors` green locally; OpenAPI unchanged

7. [ ] Changelog / changeset
   - **Files:** `CHANGELOG.md` pair, README latest-three, `docs/history.md` pair, `.changeset/rust-sidecar.md`
   - **Interface / contract / data:** none
   - **Risk:** version edited by hand
   - **Rollback:** revert those files
   - **Acceptance:** patch on create-app (and cli if scanned); `package.json` versions unchanged in the implement PR; no npm publish from that PR

## Open questions

Five kit-native questions for the owner (clarify-feature stems). Do not guess. Fold answers into Assumptions / Scope before any implement PR.

1. **Flavor / preset / capabilities.** Confirm **option A**: `--with-rust-sidecar` overlay on API-bearing flavors, **not** a seventh flavor and **not** a new `ysk-kit add` catalogue name (reuse `crypto`). Or say you want **B** (`desktop-tauri`) or **C** (Rust OpenAPI client) first instead.
2. **Envelope.** Confirm v1 IPC is **child-process private stdio** (no public HTTP, no new envelope exception, no public gRPC, no napi-rs). A “yes, HTTP sidecar” does **not** approve an exception; it stays here.
3. **Authz.** Confirm the sidecar is **process-local** (API spawns it); no new role/permission; `CRYPTO_MASTER_KEY` stays in env, never argv/logs. Or name a different trust boundary.
4. **UI surfaces.** Confirm **no client screen** in v1 (wizard TTY only; web/admin/mobile/desktop unchanged), and TTY default is **no**.
5. **Living kit vs dest-only.** Confirm the crate is **template-only** (php-bridge style) so this repo does not grow a living `crates/` that `pnpm test` must compile. Or require a living crate in-tree (then we need a rustc story that does not use exhausted Actions).

Follow-ups, not this pass: rustc exact pin (measure at implement; this worker has 1.99.1 stable), `cargo audit` in supply-scan, phase-2 OpenAPI-Rust client, Tauri when a product pays.
