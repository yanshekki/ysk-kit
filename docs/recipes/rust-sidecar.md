# Rust sidecar

Language: [中文](rust-sidecar.zh.md) · English

Opt-in **process-local** AES-256-GCM behind the existing TypeScript `ICryptoPort`. Not a flavor, not a catalogue capability, not `pnpm worker`, and **not a public API**. Decision: [ADR 0002 addendum](../adr/0002-polyglot-clients.md#addendum-optional-rust-sidecar-2026-11-08). Flavor table: [Client language choice](../guides/flavors.md#client-language-choice).

TypeScript `application/` still owns membership, billing, tenancy, and the JSON envelope. The crate implements the same blob as `@ysk-kit/crypto`.

## What you generate

From a kit checkout, on an API-bearing flavor (`saas`, `desktop`, `gateway`, `trading`):

```bash
pnpm --filter @ysk-kit/create-app start my-api --flavor saas --preset thin --db mysql --with-rust-sidecar --yes
```

`--yes` stays **off** unless you pass `--with-rust-sidecar`. TTY empty Enter is no. `php-bridge` and `static-web3` ignore the flag (no API process).

| Path | Role |
|---|---|
| `crates/ysk-sidecar/` | Dest-only crate (stdio JSON `encrypt` / `decrypt`). Pin `rust-toolchain.toml` 1.99.1. Commit `Cargo.lock`. |
| `apps/api/src/infra/rust-crypto-adapter.ts` | Spawns the binary with empty argv; `CRYPTO_MASTER_KEY` from env |
| `.env.example` comment | `# CRYPTO_ADAPTER=rust` after `cargo build --release`; omit the key for Node |

This kit has **no living `crates/`**. Default `pnpm test` does not compile rustc.

## What you must not do

| Do not | Why |
|---|---|
| Copy `apps/api/src/modules/*/application/` into Rust | Rules would drift; `pnpm layers` cannot see Cargo |
| Bind a port, Axum, Actix, Warp, gRPC, or napi-rs | v1 IPC is private stdio only; no new envelope exception |
| Pass `CRYPTO_MASTER_KEY` on argv or log it | Child inherits the API env. Never `ps` the key |
| Name this `pnpm worker` | BullMQ already owns `worker` |
| Invent `ysk-kit add rust-sidecar` | Reuse capability `crypto` |
| Scaffold Tauri / a Rust OpenAPI client | Deferred (ADR 0002 phases 1–2) |

## Build and inject

```bash
cd crates/ysk-sidecar
cargo build --release
# optional: cargo test
```

Set `CRYPTO_ADAPTER=rust` in `.env` only after the binary exists. Default remains Node `createCryptoFromEnv`. Inject `createProductCrypto` from `apps/api/src/infra/rust-crypto-adapter.ts` in composition when a use-case needs `ICryptoPort`. Do not encrypt existing identity / billing / OTP columns in v1.

Private stdio frames are newline JSON `{ id, op, blob }` / `{ id, ok, blob | error }` — **not** `{ ok, data }`. Sidecar errors are the string `op failed` with no payload.

`ysk-kit doctor` warns if `CRYPTO_ADAPTER=rust` but `crates/ysk-sidecar` is missing. `ysk-kit check agent` rule `rust-sidecar-boundary` rejects axum / actix-web / warp and requires the crate README to mention `ICryptoPort`.

Local smoke (skip 0 without rustc; **not** GitHub Actions): `.github/scripts/rust-sidecar-smoke.sh`.
