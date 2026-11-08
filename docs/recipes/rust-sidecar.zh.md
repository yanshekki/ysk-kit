# Rust sidecar

Language: [English](rust-sidecar.md) · 中文

可選、**行程本機** 的 AES-256-GCM，放在既有 TypeScript `ICryptoPort` 背後。不是 flavor、不是目錄 capability、不是 `pnpm worker`，也**不是公開 API**。決定：[ADR 0002 補篇](../adr/0002-polyglot-clients.zh.md#補篇-可選-rust-sidecar2026-11-08)。Flavor 表：[客戶端語言選擇](../guides/flavors.zh.md#客戶端語言選擇)。

TypeScript `application/` 仍然擁有會籍、帳單、租戶與 JSON envelope。crate 實作與 `@ysk-kit/crypto` 相同的密文。

## 會產生甚麼

在 kit checkout，對帶 API 的 flavor（`saas`、`desktop`、`gateway`、`trading`）：

```bash
pnpm --filter @ysk-kit/create-app start my-api --flavor saas --preset thin --db mysql --with-rust-sidecar --yes
```

除非你傳 `--with-rust-sidecar`，`--yes` 維持**關閉**。TTY 空白 Enter 是 no。`php-bridge` 與 `static-web3` 忽略此旗標（沒有 API 行程）。

| 路徑 | 角色 |
|---|---|
| `crates/ysk-sidecar/` | 只存在 dest 的 crate（stdio JSON `encrypt`／`decrypt`）。`rust-toolchain.toml` 釘 1.99.1。提交 `Cargo.lock`。 |
| `apps/api/src/infra/rust-crypto-adapter.ts` | 以空白 argv spawn 二進位；`CRYPTO_MASTER_KEY` 來自環境變數 |
| `.env.example` 註解 | `cargo build --release` 之後才寫 `# CRYPTO_ADAPTER=rust`；省略該鍵則用 Node |

本倉**沒有 living `crates/`**。預設 `pnpm test` 不會編譯 rustc。

## 不要做甚麼

| 不要 | 原因 |
|---|---|
| 把 `apps/api/src/modules/*/application/` 抄進 Rust | 規則會漂移；`pnpm layers` 看不見 Cargo |
| 綁埠、Axum、Actix、Warp、gRPC 或 napi-rs | v1 IPC 只有私有 stdio；沒有新的 envelope 例外 |
| 把 `CRYPTO_MASTER_KEY` 放進 argv 或寫進日誌 | 子行程繼承 API 環境。永不讓 `ps` 看到金鑰 |
| 把這叫 `pnpm worker` | BullMQ 已佔用 `worker` |
| 發明 `ysk-kit add rust-sidecar` | 重用 capability `crypto` |
| 搭 Tauri／Rust OpenAPI 客戶端 | 暫緩（ADR 0002 第 1–2 階段） |

## 編譯與注入

```bash
cd crates/ysk-sidecar
cargo build --release
# 可選：cargo test
```

只在二進位存在後才在 `.env` 設定 `CRYPTO_ADAPTER=rust`。預設仍是 Node `createCryptoFromEnv`。有 use-case 需要 `ICryptoPort` 時，在 composition 注入 `apps/api/src/infra/rust-crypto-adapter.ts` 的 `createProductCrypto`。v1 不要用它加密既有身分／帳單／OTP 欄。

私有 stdio 影格是換行 JSON `{ id, op, blob }`／`{ id, ok, blob | error }`——**不是** `{ ok, data }`。sidecar 錯誤字串是 `op failed`，沒有 payload。

若 `CRYPTO_ADAPTER=rust` 但沒有 `crates/ysk-sidecar`，`ysk-kit doctor` 會警告。`ysk-kit check agent` 規則 `rust-sidecar-boundary` 拒絕 axum／actix-web／warp，並要求 crate README 提到 `ICryptoPort`。

本機 smoke（沒有 rustc 則 skip 0；**不是** GitHub Actions）：`.github/scripts/rust-sidecar-smoke.sh`。
