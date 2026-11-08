# ysk-sidecar

Language: [中文](README.zh.md) · English

Process-local **ICryptoPort** adapter for a YSK Kit API. It is **not a public API**.

Copied by `create-ysk-app --with-rust-sidecar` onto API-bearing flavors. TypeScript `application/` still owns membership, billing, tenancy, and the JSON envelope.

## What this is

- AES-256-GCM blobs matching `@ysk-kit/crypto` (`version` byte `1`, 12-byte IV, ciphertext, 16-byte tag).
- Private newline JSON on stdin/stdout. The parent Node process holds `ICryptoPort`.
- `CRYPTO_MASTER_KEY` from the environment (64 hex chars). Never argv, never logs.

## What this is not

- Not a flavor, not a catalogue capability, not a BullMQ `pnpm worker`.
- Not Axum, Actix, Warp, gRPC, napi-rs, or a localhost HTTP server.
- Not a place to copy `apps/api/src/modules/*/application/`.

## Build

```bash
# rustc 1.99.1 via rust-toolchain.toml (stable; no beta/nightly)
cargo build --release
# optional: cargo test
```

Then set `CRYPTO_ADAPTER=rust` in `.env` and inject `createProductCrypto` from `apps/api/src/infra/rust-crypto-adapter.ts` in composition when a use-case needs `ICryptoPort`. Default remains Node `createCryptoFromEnv`.

Walkthrough (this product): `docs/recipes/rust-sidecar.md`.
