---
name: security-review
description: >
  審查 YSK Kit 的授權、租戶隔離、密鑰、日誌遮罩、token 儲存、webhook 簽名與 LLM 輸入，對照 hexagonal 模組與 {ok,data}/{ok,error} envelope。可選輕量威脅模型模式。
  使用者要求安全審查或稽核；diff 碰到 auth、apikey、organizations、billing、files、crypto、webhook、環境密鑰或新 capability；或計劃的安全段不是「沒有」時使用。
  中文：安全審查、權限、跨租戶、密鑰、日誌遮罩、webhook 簽名。
  不要用於純 UI 樣式、文件錯字或沒有新信任邊界的依賴升級。
---

# Skill：安全審查

Language: [English](security-review.md) · 中文

審查本 kit 的授權、密鑰與信任邊界。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。相關：[webhook-handling](webhook-handling.zh.md)、[desktop-electron](desktop-electron.zh.md)、[plan-feature](plan-feature.zh.md)。長清單：[租戶](security-review/references/tenancy.zh.md)、[密鑰與日誌](security-review/references/secrets-logging.zh.md)、[客戶端 token 儲存](security-review/references/client-token-storage.zh.md)。

## 觸發

- 使用者要求安全審查、稽核或威脅模型。
- diff 碰到 `auth`、`apikey`、`organizations`、`billing`、`files`、`crypto`、`/v1/*/webhook`、環境密鑰，或新 capability。
- 日期計劃的**安全與私隱**段不是「沒有」。

純 UI 樣式、文件錯字，或沒有新信任邊界的依賴升級，不要觸發。

## 輸入

| 輸入 | 必要 | 備註 |
|---|---|---|
| Base ref | 是 | `git diff <base>...HEAD`。預設 `origin/main` |
| 模式 | 否 | `review`（預設）或 `threat-model`（只在使用者要求，或新 capability／信任邊界時） |
| 範圍路徑 | 否 | 把表格限在指定模組 |

## 範圍與信心

借 getsentry `security-review`：**報告範圍 = diff**；**研究範圍 = 整個倉**。既有程式只作脈絡，除非此次改動新依賴它，否則不列為 finding。

| 信心 | 何時 | 行動 |
|---|---|---|
| HIGH | 本樹有具體利用路徑 | 報告 |
| MEDIUM | 需要你未能跑的 runtime 檢查 | 標「需要驗證」 |
| LOW | 只是 pattern match | 不要報告 |

不要標記：伺服器控制的值當成攻擊者輸入；已文件化的 envelope 例外；記憶體測試 fake；`.env.example` 佔位值。

## 步驟

1. 確認 base ref，且 diff 非空：`git diff <base>...HEAD --stat`。
2. 追資料流：不可信輸入（HTTP body／query、webhook raw body、LLM 使用者內容、檔案 metadata）→ 合約 Zod → `application/` → ports。授權放在 `application/`，不是 Express／Fastify register。
3. 走完 [租戶](security-review/references/tenancy.zh.md)、[密鑰](security-review/references/secrets-logging.zh.md)、[token 儲存](security-review/references/client-token-storage.zh.md) 清單。入站 webhook 跟 [webhook-handling](webhook-handling.zh.md)。`apps/desktop/src/main` 跟 [desktop-electron](desktop-electron.zh.md)。
4. AuthN：`optionalAuth`／`registerOptionalJwt`（`apps/api/src/app.ts`、`app-fastify.ts`）之後，需要使用者的 handler 必須在沒有 `req.user` 時丟 `UNAUTHENTICATED`。API key 經 `resolveApiKey` 並維持 scope。
5. 輸入：`@ysk-kit/contracts` 的 Zod 要有長度／數量上限（檔案已在 `packages/contracts/src/dto/file.ts` 把 `byteSize` 上限設為 20 MiB）。不要把客戶端自稱的 MIME 當成授權。
6. 速率限制：`RATE_LIMIT_MAX`／`RATE_LIMIT_WINDOW_MS` 經 `@ysk-kit/api-http` 的 `createRateLimit`。Auth OTP 已回 `RATE_LIMITED`。不要為了測試通過而關掉限制器（`RATE_LIMIT_MAX=0` 是測試／CI 逃生口，不是生產設定）。
7. CORS：`packages/config` 的 `corsOrigins` 是 web + admin 公開 URL。不要用 `*` 配 credentials。是否加 helmet／CSP header 要寫進計劃（API 目前沒有）。
8. LLM：產品功能在 `application/` 持有 prompt（`LLM_SYSTEM_PROMPT`）。客戶端只送 `user`／`assistant`（`LlmClientRoleSchema`）。把使用者內容當不可信。跟隨 [llm-feature](llm-feature.zh.md)。
9. 供應鏈：新的 runtime 依賴屬於 **先問**（AGENTS.md）。
10. 若模式是 `threat-model`，在寫 findings **之前**跑 [威脅模型子模式](#威脅模型子模式)。先與使用者確認假設。
11. 輸出 [輸出格式](#輸出格式)。若改了程式，接著 [驗證改動](verify-change.zh.md)。

## Kit 起步熱點

這些是審查位置，不是已確認的漏洞。描述正確模式；不要在只改文件的變更裡「順便修」。

| 範圍 | 現況（v1.2.2） | 繼續這樣做 |
|---|---|---|
| Logger | `packages/logger` pino `redact` paths | 不要 log OTP、JWT、`sk_`、`whsec_` |
| Billing webhook | 驗簽 + `ProcessedWebhookEvent` | [webhook-handling](webhook-handling.zh.md)；履約仍應入隊 |
| Web token | `createWebStorageTokenStore`（localStorage） | XSS 可偷 token；文件化此面 |
| Electron token | 只用 `safeStorage`；不可用時只留記憶體 | [desktop-electron](desktop-electron.zh.md) |
| 租戶 | `requireBiller`／`requireMember` | 每個 org-scoped use case 都抄此模式 |
| LLM | 伺服器 `LLM_SYSTEM_PROMPT`；客戶端沒有 `system` role；配額 `RATE_LIMITED` | [llm-feature](llm-feature.zh.md) |

## 威脅模型子模式

只在使用者明確要求，或改動新增 capability／新信任邊界時使用。流程來自 openai `security-threat-model`：

1. 資產（token、org 資料、Stripe customer id、檔案、crypto 金鑰）。
2. 信任邊界（瀏覽器、Electron renderer vs main、Expo、API、Stripe、LLM 供應商）。
3. 攻擊者能力 **與** 非能力（他們做不到什麼）。
4. 濫用路徑，含可能性 × 影響。
5. **停下來，與使用者確認假設。**
6. 寫入 `docs/plans/<yyyy-mm-dd>-<slug>-threat-model.md`（及 `.zh.md`），或填計劃的安全段。

不要憑猜測的生產拓撲產出威脅模型報告。

## 驗證

```bash
pnpm test
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

預期：測試全綠；`pnpm ysk-kit check agent` 印出 `ysk-kit check agent: ok`。

抽查（你新寫的程式預期沒有命中）：

```bash
rg -n "logger\\.(info|debug|error)\\([^)]*(token|secret|password|otp|whsec_|sk_live)" apps packages
```

- [ ] 每個 org-scoped use case 都有「其他 org → `FORBIDDEN` 或 `NOT_FOUND`」的 memory-port 測試
- [ ] 日誌或 commit 沒有密鑰、OTP 或 Stripe `sk_`
- [ ] HIGH finding 已修正，或使用者書面接受

## 輸出格式

```md
## Security review — <scope> (<base>...HEAD)

| # | Severity | Confidence | Category (ASVS) | Location | Exploit path | Fix |
|---|---|---|---|---|---|---|
| 1 | high | HIGH | V8.4.1 | apps/api/src/modules/… | … | … |

Verified clean: <checklist items>
Could not verify: <item + why>
Threat-model assumptions (if any): <confirmed / skipped>
```

嚴重程度：`high`（跨租戶、密鑰外洩、未驗簽 webhook）／`medium`／`low`。LOW 信心的列不要輸出。

## 完成條件

每個 HIGH finding 都有修正或使用者書面接受。Org-scoped use case 有跨租戶負面測試。改了程式時五條驗證命令全綠。威脅模型模式已記錄確認過的假設。

## 反模式

| 症狀 | 改為 |
|---|---|
| 只靠 grep 報 finding | 先追資料流再報告 |
| 在 router 做授權 | 在 `application/` 查 membership |
| 「使用者必須登入」 | 那是 AuthN，不是租戶隔離 |
| 為了 CI 綠燈關掉速率限制 | 保留記憶體限制器；提高 fixture 預算 |
| 把 `.env.example` 當外洩 | 它是佔位；生產不可用 `change-me-in-dev-only` 開機 |

## 升級／詢問

在削弱授權、速率限制或密鑰日誌規則之前；在新增 envelope 例外之前；在加入新 runtime 依賴之前，停下來問使用者。

## 來源

- getsentry `security-review` 與 `secret-serialization` — <https://github.com/getsentry/skills>
- openai `security-threat-model`／`security-best-practices` — <https://github.com/openai/skills>
- OWASP ASVS 5.0 V8 授權（V8.4.1 跨租戶） — <https://asvs.dev/v5.0.0/V8-Authorization/>
- OWASP Authorization Cheat Sheet — <https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html>
- Pino redaction — <https://getpino.io/#/docs/redaction>
- OWASP Top 10 for LLM 2025（LLM01／LLM06） — <https://genai.owasp.org/llm-top-10/>
