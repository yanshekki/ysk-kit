---
name: clarify-feature
description: >
  批准前最多問五題 kit 原生問題，並把答案折進日期計劃（假設、範圍、未決問題）。
  Use when Open questions are non-empty, the user asks to clarify, 澄清, 釐清,
  or /clarify-feature.
  中文：澄清、釐清、未決問題、批准前。
  Do not use to implement, to vendor Spec Kit or .specify/, or when Open
  questions are already empty.
---

# Skill：澄清功能

Language: [English](clarify-feature.md) · 中文

日期計劃仍有未解決的未決問題時，在批准前先問。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。計劃：[plan-feature](plan-feature.zh.md)。路徑卡：[sdd-path](../plans/sdd-path.zh.md)。模板：[docs/plans/_template.zh.md](../plans/_template.zh.md)。

本 skill **只問**。它不實作、不審查 diff，也不批准新的 envelope 例外。`AGENTS.md` 仍是唯一憲法。不要建立 `.specify/`。不要貼 Spec Kit。

## 觸發

- 使用者要求澄清、釐清，或 `/clarify-feature`。
- 日期計劃存在，且未決問題至少有一條未解決項目（不是 `none`／`n/a`／`沒有`／`不適用`）。
- Agent 正要請求批准或開始實作，而那些項目仍非空。

不要用於：

- 計劃協議說可略過的工作（錯字、只改註解、單檔重新命名）。
- 未決問題是空的，或是允許的短「沒有」。
- 使用者豁免批准閘，或說自行決定並繼續。把決定寫進假設。不要再問。
- 工作是實作、[review-change](review-change.zh.md)、[audit-slice](audit-slice.zh.md) 或 [security-review](security-review.zh.md)。
- 建立 `.specify/`、跑 Spec Kit，或加第二套憲法。

## 輸入

| 輸入 | 必要 | 備註 |
|---|---|---|
| 日期計劃配對 | 是 | `docs/plans/<yyyy-mm-dd>-<slug>.md` 與 `.zh.md` |
| 哪些項目仍開放 | 是 | 先讀。計劃已經回答的不要再問 |
| Flavor／preset | 有 `.ysk-kit.json` 時 | `thin`：不要假設 llm／team／billing／push |

## 問題幹

只問計劃尚未回答的幹。**最多五題**，一輪。還有缺口就留在未決問題。除非使用者要求，不要開第二輪。不要問行業領域問題（那些屬於產品倉，不屬於本 kit）。

1. **授權。** 哪個角色或權限可以呼叫？擁有者還是任何已登入使用者？另一作者的結果是 `FORBIDDEN` 還是 `NOT_FOUND`？
2. **租戶。** 以組織為範圍還是全域？跨租戶：`NOT_FOUND` 或空白頁，不要洩漏一列。flavor 沒有組織（沒有 team 的 thin、php-bridge、static-web3）且計劃不是在加 team 時，略過。
3. **Envelope。** 維持 `{ ok: true, data }`／`{ ok: false, error }`，還是使用者要求例外（SSE、PDF、webhook 確認）？預設：不加新例外。答「要」並不批准例外；把請求寫進未決問題，留給使用者。
4. **Flavor／preset／capability。** 哪個 flavor、thin 還是 full、切片可以假設哪些目錄 capability。一題，不要整份菜單。不要發明目錄名稱。
5. **UI 表面。** 只做 API，還是 web／admin／mobile／desktop 的哪幾個。若有 UI，寫出畫面名稱。不要在這裡設計（[ui-design](ui-design.zh.md)／[layout-system](layout-system.zh.md) 在批准之後）。

## 步驟

1. 讀英文日期計劃與中文配對，包括假設、範圍、非目標、未決問題。
2. 拿掉計劃已經回答的幹。其餘在一則訊息裡問，最多五題。
3. 等答案。若使用者說自行決定，寫進假設並停止再問。
4. 同一輪折入。把已解決的項目從未決問題移到假設；若改變切片，也改範圍／非目標。**兩種語言都改**。不要開始合約、模組、Prisma 或客戶端。
5. 對兩份日期檔再跑 `pnpm ysk-kit plan --check`。然後回到 [plan-feature](plan-feature.zh.md)，等待批准。
6. 按[輸出格式](#輸出格式)交回。

## 驗證

```bash
pnpm ysk-kit plan --check docs/plans/<yyyy-mm-dd>-<slug>.md
pnpm ysk-kit plan --check docs/plans/<yyyy-mm-dd>-<slug>.zh.md
```

兩者都印出 `ysk-kit plan --check: ok`。不要對 [sdd-path](../plans/sdd-path.zh.md) 跑 `plan --check`。

## 輸出格式

```md
## Clarify — docs/plans/<date>-<slug>.md
Asked: <n> (max 5)
Still open: <bullets or none>
Updated: Assumptions | Scope | Non-goals | Open questions (EN + zh)
Gate: still waiting for approval
Next: plan-feature fill | user approves plan
```

## 完成條件

日期配對記下每個答案，未決問題不再包含已問過的項目，兩種語言一致，而且這一輪沒有改合約或客戶端檔。

## 反模式

| 症狀 | 改為 |
|---|---|
| 把猜測寫進假設 | 先問，或寫「使用者說自行決定」 |
| 一輪問了六題或更多 | 五題就停；其餘留著 |
| 只改了英文計劃 | `--check` 之前兩種語言都改 |
| 把「要，新 envelope」當成批准 | 留在未決問題 |
| `.specify/` 或 Spec Kit 提示詞 | 留在 `docs/plans/` 與 `AGENTS.md` |
| 澄清這一輪就跑 `add-module` | 等計劃批准 |

## 升級／詢問

這五條幹就是訪談。不要為了「問得徹底」再加一題產品領域問題。
