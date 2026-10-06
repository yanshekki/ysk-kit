---
name: review-change
description: >
  沿兩軸審查 YSK Kit diff：法律（AGENTS.md 硬規則、完成定義、「不要」清單）與計劃（日期計劃的範圍與清單）。高風險項目標給人類。
  被要求審查 PR、相對 main 的分支，或未提交的工作時使用；或 /review-change。
  中文：審查、法律軸、計劃軸、高風險人工、合理化表。
  不要用於實作改動（plan-feature），或專門的安全／Prisma 深挖（security-review、db-migration）。
---

# Skill：審查改動

Language: [English](review-change.md) · 中文

審查 **diff**，以倉作研究。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。深挖：[security-review](security-review.zh.md)、[db-migration](db-migration.zh.md)。測試：[write-tests](write-tests.zh.md)。驗證：[verify-change](verify-change.zh.md)。

## 觸發

- 使用者要求審查 PR、相對 `main` 的分支，或工作樹。
- 計劃的清單即將標為完成。

不要用本 skill 實作功能（[plan-feature](plan-feature.zh.md)）。授權／密鑰／webhook／LLM 輸入走 [security-review](security-review.zh.md)。產生的 SQL 走 [db-migration](db-migration.zh.md)。

## 輸入

| 輸入 | 必要 | 備註 |
|---|---|---|
| Base ref | 是 | 預設 `origin/main` |
| 日期計劃 | 協議要求時 | `docs/plans/<yyyy-mm-dd>-<slug>.md` |
| Diff | 是 | `git diff <base>...HEAD` |

## 兩軸

**法律** — AGENTS.md **硬規則**（目前十二條）、[完成定義](../../AGENTS.zh.md#完成定義)，以及[不要](../../AGENTS.zh.md#不要)清單。任何硬規則被打破就審查失敗（客戶端 Prisma、TypeScript `enum`、對 kit 路徑 raw `fetch`、未經批准的新 envelope 例外、單元測試打真實 Stripe，…）。

**計劃** — 日期計劃的範圍、非目標、任務清單與驗證命令。diff 送出非目標列出的工作，或略過清單項而沒有記錄原因，就失敗。

改動可以法律綠、計劃紅（多了行業 domain、多了 capability）。兩軸都必須通過。

## 高風險（標給人類）

不要自行批准這些。即使其餘都乾淨，仍列在「Human review」底下：

- 授權／租戶／`requireBiller`／`requireMember`
- Webhook 簽名與 event-id 冪等
- 密鑰日誌、token 儲存、Electron `safeStorage`
- LLM prompt、配額、prompt 裡的 PII
- 破壞性合約或新的 envelope 例外
- SQL 裡的 `migrate reset`／`DROP`
- 新的 runtime 依賴
- 會啟動 Redis、Stripe、Twilio、FCM、Jaeger 或 Grafana 的 CI

那些列交給 [security-review](security-review.zh.md) 或 [db-migration](db-migration.zh.md)，不要重述它們的清單。

## 步驟

1. 確認 base ref，並印出 `git diff <base>...HEAD --stat`。
2. 協議要求時找出日期計劃。若缺失，那是法律 finding（完成定義）。
3. 走法律（硬規則 + 完成定義 + 不要）。每個 finding 一列。
4. 走計劃（範圍、非目標、清單）。每個漏項或多做一列。
5. 跑 [驗證改動](verify-change.zh.md)（或記錄為何不能：沒有 checkout、測試已在跑）。沒有命令輸出或明確阻礙，永遠不要說「看起來沒問題」。
6. 每個計劃漏項填 [合理化表](#輸出格式)（「超出範圍因為…」、「延後到…」並附檔案連結）。理由空白就審查失敗。
7. 輸出 [輸出格式](#輸出格式)。不要 merge。

## 驗證

```bash
git diff <base>...HEAD --stat
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

預期：`ysk-kit check agent: ok`。`gen:openapi` 之後跑 `git diff --exit-code docs/openapi.yaml`，除非本次審查包含 OpenAPI 改動。

- [ ] 兩軸都有通過／失敗
- [ ] 高風險列已標給人類
- [ ] 驗證命令已跑，或已寫阻礙

## 輸出格式

```md
## Review — <base>...HEAD

Law: PASS | FAIL
Spec: PASS | FAIL (plan: <path or "not required">)

| # | Axis | Severity | Location | Finding | Fix or human |
|---|---|---|---|---|---|
| 1 | Law | high | apps/web/… | raw fetch | use SDK |

Human review: <authz / webhook / SQL / none>
Verify: <commands + result or blocker>

### Rationalization

| Checklist / non-goal item | In the diff? | Reason (file link) |
|---|---|---|
| … | yes/no | … |
```

嚴重程度：`high`（打破硬規則、資料遺失）／`medium`／`low`。AGENTS.md 沒點名的純風格 nits 不要列。

## 完成條件

兩軸都是 PASS，或 FAIL 且有具體列。高風險項目標給人類。驗證已跑。合理化表沒有空白理由。

## 反模式

| 症狀 | 改為 |
|---|---|
| 沒跑命令就「LGTM」 | 跑驗證改動 |
| 重述 security-review | 連過去；標給人類 |
| 批准已送出的非目標 | 計劃 FAIL |
| 「測試大概會過」 | 貼上退出碼 |
| 把 diff 外的檔當 finding | 報告範圍 = diff |

## 升級／詢問

批准硬規則例外、新的 envelope 傳輸，或法律軸紅燈仍要 merge 之前，先問。

## 來源

- [AGENTS.zh.md](../../AGENTS.zh.md) 硬規則、完成定義、不要
- getsentry `security-review`（diff = 報告範圍） — <https://github.com/getsentry/skills>
- [security-review](security-review.zh.md)、[db-migration](db-migration.zh.md)、[verify-change](verify-change.zh.md)
