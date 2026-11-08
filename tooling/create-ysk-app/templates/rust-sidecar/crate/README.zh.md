# ysk-sidecar

Language: [English](README.md) · 中文

YSK Kit API 的行程本機 **ICryptoPort** adapter。**不是公開 API**。

由 `create-ysk-app --with-rust-sidecar` 複製到帶 API 的 flavor。TypeScript `application/` 仍然擁有會籍、帳單、租戶與 JSON envelope。

## 這是甚麼

- AES-256-GCM 密文與 `@ysk-kit/crypto` 相同（`version` 位元組 `1`、12 位元組 IV、ciphertext、16 位元組 tag）。
- stdin／stdout 上的私有換行 JSON。父 Node 行程持有 `ICryptoPort`。
- `CRYPTO_MASTER_KEY` 來自環境變數（64 個十六進位字元）。永不放進 argv，永不寫進日誌。

## 這不是甚麼

- 不是 flavor、不是目錄 capability、不是 BullMQ 的 `pnpm worker`。
- 不是 Axum、Actix、Warp、gRPC、napi-rs，也不是本機 HTTP 伺服器。
- 不是複製 `apps/api/src/modules/*/application/` 的地方。

## 編譯

```bash
# rust-toolchain.toml 釘 rustc 1.99.1（穩定版；不要 beta／nightly）
cargo build --release
# 可選：cargo test
```

然後在 `.env` 設定 `CRYPTO_ADAPTER=rust`，並在有 use-case 需要 `ICryptoPort` 時，於 composition 注入 `apps/api/src/infra/rust-crypto-adapter.ts` 的 `createProductCrypto`。預設仍是 Node `createCryptoFromEnv`。

逐步說明（此產品）：`docs/recipes/rust-sidecar.zh.md`。
