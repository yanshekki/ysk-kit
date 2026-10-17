---
name: error-log-review
description: >
  用 envelope error.code、requestId 與 structured Pino JSON 複盤 YSK Kit 錯誤日誌。
  Use when INTERNAL/5xx, a log dump, secret-in-log, or /error-log-review.
  中文：錯誤日誌、requestId、check logs、INTERNAL。
  Do not use for green-field features (plan-feature) or a red Vitest without logs (debug-issue).
---

# Skill：複盤錯誤日誌

Language: [English](error-log-review.md) · 中文

把捕捉到的錯誤日誌變成 typed `AppError` 與紅燈測試。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。下游迴圈：[debug-issue](debug-issue.zh.md)。密鑰：[security-review](security-review.zh.md)。指南：[觀測](../guides/observability.zh.md)。操作手冊：[複盤錯誤日誌](../recipes/review-error-logs.zh.md)。

## 觸發

- 生產或 staging 的 `INTERNAL`／HTTP 5xx。
- JSON 日誌 dump、Grafana 5xx 面板，或帶例外的 Jaeger span。
- `ysk-kit check logs` 報了密鑰洩漏或缺少 `requestId`。

不要用來設計新資源（[plan-feature](plan-feature.zh.md)），也不要在已有紅燈 Vitest 時用（[debug-issue](debug-issue.zh.md)）。

## 輸入

| 輸入 | 必要 | 備註 |
|---|---|---|
| 日誌摘錄或 JSONL | 是 | 生產 JSON（`NODE_ENV=production`），不是 pino-pretty |
| 時間窗 | 是 | 與部署／設定對齊 |
| `requestId` | 一有就要 | Envelope 與 ERROR log 共用 |

## 先分類

| 類別 | 意義 | 下一步 |
|---|---|---|
| 日誌含密鑰（`sk_`、`whsec_`、OTP 字面量） | P0 安全 | 輪替；不要把密鑰貼進對話；跟 [密鑰與日誌](security-review/references/secrets-logging.zh.md) |
| `INTERNAL`／status ≥ 500 | 在 map 好之前都是 bug | Exemplar `requestId` → 紅燈測試 |
| 4xx 驟升 | 產品規則或客戶端錯誤 | 不要把 log level 升到 ERROR |
| 預期 4xx `AppError` | 驗證／授權／找不到列 | 只有 access log；沒有 ERROR 行 |

ERROR level 代表必須採取行動。預期 4xx 刻意保持安靜。

## 步驟

1. 跑 `pnpm ysk-kit check logs --file <jsonl>`（或 stdin）。記下 INTERNAL 計數與 findings。
2. 揀 **1–3 個 exemplar**。優先 `requestId`（Fastify access line 可能用 `reqId`）。若有 `trace_id` 且 Jaeger 在跑，打開該 trace。不要無限 grep。
3. 寫 3–5 個假設（表格形狀與 [debug-issue](debug-issue.zh.md) 相同）。常見：`application/` 缺 `AppError`；infra throw；Fastify 沒註冊；envelope unwrap。
4. 交給 [debug-issue](debug-issue.zh.md)：memory-port 紅燈，然後 Express **與** Fastify HTTP 斷言 `error.code` 與 `error.requestId`。
5. 在 `application/` 修（map 成 `AppError`）或修 adapter。不要為了「看見洩漏」而 log 密鑰。
6. 再 capture。該類 INTERNAL 應該消失。`pnpm ysk-kit check errors` 維持綠。

單元測試不要啟動 Redis、Stripe、Twilio、FCM、Jaeger 或 Grafana。Jaeger 只在人手串連步驟可選使用。

## 驗證

```bash
pnpm ysk-kit check logs --file <jsonl>
pnpm ysk-kit check errors
pnpm --filter @ysk-kit/api exec vitest run <file> -t '<name>'
```

- [ ] 已命名分類（secret／INTERNAL／4xx）
- [ ] 已記錄 exemplar `requestId`
- [ ] 修復前已有紅燈測試
- [ ] 寫作與新日誌沒有密鑰

## 輸出格式

```md
## Error log — <symptom>
Class: secret | INTERNAL | 4xx-spike | expected-4xx
Exemplars: requestId=… (trace_id=… optional)
check logs: ok | findings
Hypotheses: 3–5 rows
Red test: <file> / <it name>
Fix: <files>
Secrets: none logged
```

## 完成條件

該類 INTERNAL 有保留的回歸測試，兩個 HTTP adapter 都斷言 envelope，`check errors` 為 ok，寫作是無責的（缺 mapping 或 infra 失敗 — 不是點名）。

## 反模式

| 症狀 | 改這樣做 |
|---|---|
| Admin「錯誤收件箱」／Prisma `ErrorLog` | stdout JSON + `check logs`；audit 仍是領域事件 |
| 每個 4xx 都 `logger.error` | Access log；ERROR 只給 INTERNAL／5xx |
| Log OTP／`sk_` 來除錯 | 斷言 `error.code` + `requestId` |
| Grep 整個檔 | 1–3 個 exemplar |
| Sentry 當 kit 預設 | 產品選擇；kit 保證 JSON + `error.code` |

## 升級／詢問

加 envelope 例外、為錯誤追蹤發明 capability，或把 stack 放進 `error.details` 之前先問。
