---
name: debug-issue
description: >
  以紅燈迴圈除錯 YSK Kit 失敗：先記憶體 port 測試，再 Express 與 Fastify 的 HTTP，再 SDK，再 e2e，再 git bisect。
  測試、CI job 或使用者回報是紅燈、flake，或 /debug-issue 時使用。
  中文：除錯、紅燈迴圈、回歸測試、bisect、日誌遮罩。
  不要用於從零開始的功能（plan-feature）或安全稽核（security-review）。
---

# Skill：除錯問題

Language: [English](debug-issue.md) · 中文

先重現，再修，再保留失敗測試。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。測試：[write-tests](write-tests.zh.md)。驗證：[verify-change](verify-change.zh.md)。密鑰：[security-review](security-review.zh.md)。

## 觸發

- Vitest、Playwright 或 CI job 是紅燈。
- 使用者回報（登入、billing、LLM、webhook、desktop token）。
- flake。

不要用來設計新資源（[plan-feature](plan-feature.zh.md)），或審查乾淨 diff（[review-change](review-change.zh.md)）。

## 輸入

| 輸入 | 必要 | 備註 |
|---|---|---|
| 症狀 | 是 | 命令 + 退出碼，或使用者一句話 |
| 表面 | 是 | contracts／application／HTTP／SDK／client／desktop／CI |
| 重現 | 有了就填 | 檔案 + `it()` 名稱，或 curl／SDK 片段 |

## 症狀分流

| 症狀 | 先看 | 不要 |
|---|---|---|
| `VALIDATION_FAILED`／422 | 合約 Zod + command 夾具 | 放寬 Zod 讓 CI 綠 |
| `UNAUTHENTICATED`／401 | 缺少 session、`optionalAuth`、API key | 在測試 app 關掉 auth |
| `FORBIDDEN`／403 | `application/` 的 `requireBiller`／`requireMember` | 把檢查搬進 router |
| `NOT_FOUND`／空清單 | 租戶／`authorId` 範圍 | 回另一個 org 的列 |
| `RATE_LIMITED`／429 | IP 限制器或 `LLM_QUOTA_*` | 生產設 `RATE_LIMIT_MAX=0` |
| Envelope 例外／SSE | [envelope-api](envelope-api.zh.md) | 把 SSE 包進 `{ ok: true }` |
| Prisma 與記憶體不一致 | 兩邊 repository | 只修 Prisma |
| 只有 CI（本機綠） | 凍結 lockfile、`db:generate`、時區 | 跳過該 job |
| Desktop token 遺失 | `safeStorage` 不可用 | 寫明文 |
| Webhook「扣了錢沒開通」 | [webhook-handling](webhook-handling.zh.md) | 不帶簽名重放 |

## 紅燈迴圈（按此順序）

一旦有一條可在數秒內重跑的**紅燈**測試，就停在該層，不要再爬 trophy。

1. **記憶體 port／application** — `createMemory<Name>Repository()` 或 `createMemoryInput()`。`pnpm --filter @ysk-kit/api exec vitest run <file> -t '<name>'`。
2. **HTTP envelope，Express 與 Fastify** — SuperTest 打 `createApp(createMemoryInput())` **以及** `createFastifyApp(createMemoryInput())`（見 `*.app.test.ts`）。斷言 `res.body.ok` 與 `error.code`。
3. **SDK 腳本** — `HttpClient` 注入 `fetchImpl`。不要打真實 API。
4. **E2E** — 只在 bug 是登入／shell 且單元測試看不見時。`pnpm e2e` 需要空閒 3001／5173、已遷移資料庫、種子。
5. **`git bisect`** — 回歸窗口是一段 commit，而且你已有紅燈測試時：

   ```bash
   git bisect start
   git bisect bad HEAD
   git bisect good <known-green>
   git bisect run pnpm --filter @ysk-kit/api exec vitest run <file> -t '<name>'
   ```

不要啟動 Redis、Stripe、Twilio、FCM、Jaeger 或 Grafana。不要 log OTP、JWT、`sk_`、`whsec_` 或 webhook payload。

## 假設（改程式之前先寫）

列出 **3–5** 條假設，以及如何**證偽**每一條。一次只驗證**一列**。被證偽就劃掉，不要去「修」那條理論。

```md
## Hypotheses
| # | Hypothesis | Falsify by |
|---|---|---|
| 1 | `optionalAuth` 之後沒有 `req.user` | 紅燈測試：未認證 POST → `UNAUTHENTICATED` |
| 2 | 記憶體 repo 掉了租戶範圍 | 作者 B 列表為空／`NOT_FOUND` |
| 3 | Fastify register 漏了路由 | `createFastifyApp` SuperTest 404，Express 200 |
| 4 | SDK 沒有 unwrap envelope | 注入的 `fetchImpl` 回 `{ ok: false }` |
| 5 | 夾具時鐘／種子 id 漂移 | 同一條 `it()` 凍結 `now` |
```

在目前假設有一條足以證偽它的紅燈（或通過）檢查之前，不要改產品程式。一次一條假設、一次一個實驗。

## 步驟

1. **先**寫失敗測試（或隔離既有那條）。確認它是紅燈。
2. 填假設表。用症狀表分流。先讀合約與 `application/` service，再看 infra。
3. **證偽一條**假設，再修**該**原因。若資料錯了，記憶體與 Prisma repository 兩邊同步。
4. 重跑紅燈測試直到綠，再跑模組檔，再 [驗證改動](verify-change.zh.md)。
5. 保留回歸測試。以症狀命名（`replays the same Stripe event.id without a second activate`）。

## 遮罩

`@ysk-kit/logger` 已遮罩 authorization、cookies、token、password 與 API key。不要在除錯工作階段、`console.log` 或 PR 印出密鑰。優先用 `error.code` 與 `requestId`。

## 驗證

```bash
pnpm --filter @ysk-kit/api exec vitest run <file> -t '<name>'
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

預期：指定測試綠；`ysk-kit check agent: ok`。

- [ ] 修之前有一條測試是紅燈
- [ ] bug 是 HTTP 時，Express **與** Fastify 都覆蓋
- [ ] 日誌或寫作沒有密鑰

## 輸出格式

```md
## Debug — <symptom>
Loop: memory-port | HTTP Express+Fastify | SDK | e2e | bisect
Hypotheses: 3–5 rows (one verified at a time)
Red test: <file> / <it name> (confirmed red)
Cause: <one sentence>
Fix: <files>
Regression: kept
Secrets: none logged
```

## 完成條件

原症狀有保留的回歸測試，HTTP bug 兩個 adapter 都覆蓋，驗證改動全綠，寫作點明原因。

## 反模式

| 症狀 | 改為 |
|---|---|
| 「我這部機可以」 | 抓住一條紅燈測試 |
| 只有 Express SuperTest | 加 Fastify `*.app.test.ts` |
| 用 `RATE_LIMIT_MAX=0` 過關 | 提高 fixture 預算；保留限制器 |
| 為了看登入為何失敗而 log OTP | 斷言 `error.code` |
| 刪掉失敗測試 | 修原因 |
| 還沒有紅燈測試就 bisect | 先寫測試 |
| 同時改三個檔、驗證三條理論 | 一條假設、一次證偽，再改程式 |

## 升級／詢問

重設資料庫、打真實 Stripe／LLM 端點，或關掉 auth「去看資料」之前，先問。

## 來源

- Testing trophy（在能看見 bug 的最低層失敗）
- `git bisect`／`git bisect run` — Git 文件
- [write-tests](write-tests.zh.md)（回歸先行、記憶體 port）
- 系統化除錯（根因 → 失敗重現 → 一次一修）；kit 內假設表見上
- Pino redaction — <https://getpino.io/#/docs/redaction>
