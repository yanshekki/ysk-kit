---
"@ysk-kit/create-app": patch
"@ysk-kit/crypto": patch
"@ysk-kit/cli": patch
---

Opt-in `create-ysk-app --with-rust-sidecar` copies a dest-only `ICryptoPort` crate (private stdio, not a flavor). `@ysk-kit/crypto` exports `createStdioCryptoPort` and v1 blob constants. `doctor` / `check agent` detect `CRYPTO_ADAPTER=rust` and `rust-sidecar-boundary`.
