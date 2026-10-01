# 安全

Language: [English](SECURITY.md) · 中文

YSK Kit 的漏洞請寄到 [email@ysk.hk](mailto:email@ysk.hk)。請附上套件、版本與重現步驟。未修復的漏洞不要開公開 GitHub issue。

## 支援版本

| 版本 | 狀態 |
|---|---|
| 1.0.x | 支援 |

## 生產環境

- `NODE_ENV=production`
- `JWT_SECRET` 至少 32 個字元，而且不可以是 `change-me-in-dev-only`
- 電話 OTP 需要 `TWILIO_*`；欄位加密需要 `CRYPTO_MASTER_KEY`
- 只有刻意播種時才設 `ALLOW_SEED=1`

IP 速率限制在單一行程內是記憶體。設了 `REDIS_URL` 之後，多個 API 行程共用同一個 Redis 固定視窗。`/health`、`/ready`、`/metrics` 不計入。

從 npm 安裝的 `create-ysk-app` 會把 Git tag 解成 commit SHA，下載該 commit 的壓縮檔，再核對解壓後的 `package.json` 名稱與版本。

## 供應鏈

GitHub Actions 釘在 commit SHA。`.github/workflows/release.yml` 發佈 npm 時要求 provenance。Dependabot 每週為 npm、Actions 與 Docker 開更新 PR。
