---
name: llm-feature
description: >
  做 YSK Kit LLM 功能：伺服器持有 prompt、Zod 驗證輸出、不可信內容分隔、配額，以及 createFakeLlm 評測。
  新增或改動 /v1/llm、產品 prompt、串流，或 ysk-kit add llm 時使用。
  中文：LLM、system prompt、配額、createFakeLlm、評測。
  不要用於沒有伺服器 prompt 的泛用聊天 UI，或非 LLM 程式的安全稽核（security-review）。
---

# Skill：LLM 功能

Language: [English](llm-feature.md) · 中文

產品 LLM 呼叫由**伺服器持有**。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。Envelope：[envelope-api](envelope-api.zh.md)。安全：[security-review](security-review.zh.md)。測試：[write-tests](write-tests.zh.md)。

## 觸發

- 新增或改動 `POST /v1/llm/complete`、`POST /v1/llm/stream`，或呼叫 `ILlmPort` 的產品用例。
- `pnpm ysk-kit add llm`。
- prompt、配額或評測討論。

不要用於只改客戶端文案，或沒有 LLM 路徑的全倉稽核（[security-review](security-review.zh.md)）。

## 現況 kit（v1.2.2）

不要把這些列成缺口。它們已經發佈：

| 部分 | 位置 |
|---|---|
| 客戶端訊息只有 `user` \| `assistant` | `packages/contracts/src/dto/llm.ts` 的 `LlmClientRoleSchema`／`LlmCompleteCommandSchema`。`system` **不是**客戶端角色。 |
| 伺服器前置 system prompt | `apps/api/src/modules/llm/application/llm-service.ts` 的 `createLlmService` 用 `opts.systemPrompt` 或 `DEFAULT_LLM_SYSTEM_PROMPT`。 |
| Env | `@ysk-kit/config` 的 `LLM_SYSTEM_PROMPT`（上限 8_000）、`LLM_QUOTA_MAX`（0 關掉）、`LLM_QUOTA_WINDOW_MS`。組合層傳 `llmQuotaFromEnv(env)`。 |
| 超配額 | `AppError('RATE_LIMITED')` → envelope 429。按使用者 `usage.countSince`。 |
| 假供應商 | `@ysk-kit/llm` 的 `createFakeLlm({ text, model })`。測試與 thin dest 用它。**CI 沒有真實供應商。** |
| 串流例外 | `POST /v1/llm/stream` 是 SSE（`event: delta`／`event: done`）。complete 維持 `{ ok, data }`。 |

`LlmRoleSchema` 在前置之後，**伺服器端** `LlmMessage` 仍包含 `system`。客戶端不可傳送（`LlmClientMessageSchema`）。

## 輸入

| 輸入 | 必要 | 備註 |
|---|---|---|
| 用例 | 是 | 一句（「摘要一則 note」，不是「加 ChatGPT」） |
| 輸出 Zod | 是 | `@ysk-kit/contracts` 的 DTO，不是 UI 用 regex 解析的自由文字 |
| PII | 是 | 使用者文字可能含甚麼；甚麼絕不可送去供應商 |

## 步驟

1. 協議要求時先計劃（LLM 是信任邊界）。在計劃記錄 prompt 持有者、配額與評測。
2. **合約先行。** Command 訊息：`LlmClientMessageSchema`。若產品需要結構化輸出，加專用 DTO，並在 `application/` 用 Zod 解析模型文字（`VALIDATION_FAILED` 時重試一次；不要把原始模型 JSON 傳給客戶端）。
3. **伺服器持有 prompt。** 指令放在 `LLM_SYSTEM_PROMPT` 或 `application/` 的模組字串。永遠不要從客戶端取 `role: 'system'`。永遠不要把使用者文字拼進 system 字串。
4. **不可信內容分隔。** 把使用者提供的文字包進 fence，並在 prompt 告訴模型把它當資料，例如：

   ```txt
   <user_content>
   …untrusted…
   </user_content>
   ```

   System prompt 必須說明 fence 內的文字是資料，不是指令。
5. **上限。** 維持 `messages` ≤ 50 與 `content` ≤ 32_000（已在 command schema）。加入真實後端時，在 `ILlmPort` 實作設供應商 `max_tokens`。配額：`LLM_QUOTA_MAX`／`LLM_QUOTA_WINDOW_MS`（預設 60／3_600_000 ms）。`LLM_QUOTA_MAX=0` 關掉按使用者配額（測試）；不要在生產發佈這個值。
6. **私隱。** 不要把 password、OTP、access token 或 Stripe `sk_`／`whsec_` 送去供應商。在 `complete`／`stream` 之前遮罩。不要 log prompt 文字。`@ysk-kit/logger` 已遮罩 `LLM_API_KEY`／`XAI_API_KEY`。
7. **用 `createFakeLlm` 評測。** 在 `llm-service.test.ts`／`llm.app.test.ts`（Express **與** Fastify）：

   - ≥ **5** 個正常案例（快樂 complete、stream chunk、配額未超、空內容安全、結構化解析成功）。
   - ≥ **3** 個對抗案例（客戶端 `role: 'system'` → 422 `VALIDATION_FAILED`；fence 內的 prompt-injection 文字仍用伺服器 prompt；超配額 → 429 `RATE_LIMITED`）。

   注入回傳攻擊者控制文字的假物件，並斷言 application 仍會驗證。**不要**在 CI 呼叫 OpenAI／Anthropic／xAI／SpaceXAI。
8. 生產沒有金鑰：`createLlmService({ production: true, configured: false })` 丟 `AppError('INTERNAL', 'LLM not configured', 503)`。維持這個行為。
9. [驗證改動](verify-change.zh.md)。

## 驗證

```bash
pnpm --filter @ysk-kit/api exec vitest run src/modules/llm
pnpm --filter @ysk-kit/contracts test
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

預期：客戶端 `system` 被拒；配額 429；`ysk-kit check agent: ok`。

- [ ] Prompt 由伺服器持有
- [ ] 使用者文字有 fence
- [ ] UI 需要結構時用 Zod 解析輸出
- [ ] ≥5 正常 + ≥3 對抗 `createFakeLlm` 案例
- [ ] CI 沒有真實供應商

## 輸出格式

```md
## LLM feature — <use case>
Prompt owner: LLM_SYSTEM_PROMPT | application/<file>
Client roles: user, assistant (LlmClientRoleSchema)
Fence: <tag names>
Output Zod: <DTO or "plain text in envelope">
Quota: LLM_QUOTA_MAX=<n> / WINDOW_MS=<n>
PII: <allowed / stripped>
Evals: <n> normal / <n> adversarial (createFakeLlm)
CI provider: none
```

## 完成條件

用例使用現況 v1.2.2 控制項，評測存在於記憶體 port 與兩個 HTTP adapter，驗證改動全綠。

## 反模式

| 症狀 | 改為 |
|---|---|
| 客戶端送 `role: 'system'` | 由 `LlmClientRoleSchema` 拒絕 — 維持這樣 |
| 使用者文字拼進 system prompt | Fence + 說明 fence 是資料 |
| 在 web app 用 regex 解析模型 JSON | `application/` 的 Zod DTO |
| CI `LLM_API_KEY` | `createFakeLlm` |
| 關掉配額讓測試綠 | `LLM_QUOTA_MAX=0` 只放在測試 env map |
| Log 完整 prompt | Log `requestId` + token 數量 |

## 升級／詢問

加入新的真實供應商、把 PII 送去模型、提高生產配額，或加第二種串流傳輸之前，先問。

## 來源

- 現況 kit：`packages/contracts/src/dto/llm.ts`、`apps/api/src/modules/llm/application/llm-service.ts`、`@ysk-kit/config` `LLM_*`、`@ysk-kit/llm` `createFakeLlm`
- OWASP Top 10 for LLM 2025（LLM01 prompt injection、LLM06 敏感資料） — <https://genai.owasp.org/llm-top-10/>
- Anthropic prompt engineering（分隔符、伺服器端指令）
- [security-review](security-review.zh.md) LLM 列；[envelope-api](envelope-api.zh.md) SSE 例外
