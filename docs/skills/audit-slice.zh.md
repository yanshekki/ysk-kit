---
name: audit-slice
description: >
  對 YSK Kit 的 git diff 或具名模組做有範圍的 Staff／Security／QA Architect
  審查：架構、死碼候選、效能、對抗性 given/when/then、以 doctor 查環境。
  Use when Staff review, full audit, 完整審查, 切片審計, 對抗性測試, dead-code,
  死碼, 效能, or a 9-part mega-prompt.
  中文：切片審計、Staff 審查、完整審查、對抗性測試、死碼、效能。
  Do not use to implement a feature (plan-feature), ordinary PR review
  (review-change), authz-only diffs (security-review), or to delete files /
  add Cypress/Jest.
---

# Skill：切片審計

Language: [English](audit-slice.md) · 中文

跑一次**有範圍**的 Staff／安全／QA 審查，並輸出九段報告。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。子程序：[review-change](review-change.zh.md)、[security-review](security-review.zh.md)、[supply-scan](supply-scan.zh.md)、[test-plan](test-plan.zh.md)、[write-tests](write-tests.zh.md)、[ui-review](ui-review.zh.md)、[verify-change](verify-change.zh.md)。分層：[hexagonal](../guides/hexagonal.zh.md)。測試：[測試指南](../guides/testing.zh.md)。

本 skill **只做編排**。它不取代法律／計劃審查，不摺進 security-review，也不把長提示詞貼進 `AGENTS.md`。

## 觸發

- 使用者要求 Staff／Security／QA Architect 審查、「full audit」、完整審查、切片審計、對抗性測試、死碼清理、效能，或貼上帶那九個標題的長提示詞。
- 對**具名**目標產品模組或目前 diff 做發佈前 QA。

不要用於：

- 實作功能（[plan-feature](plan-feature.zh.md)）。
- 普通 PR 審查，除非使用者要求這次組合審計（[review-change](review-change.zh.md)）。
- 只改授權／webhook／SQL 的 diff（[security-review](security-review.zh.md)、[webhook-handling](webhook-handling.zh.md)、[db-migration](db-migration.zh.md)）。
- `create-ysk-app` 剛搭完骨架（產生樹不是產品死碼）。
- 為了加 Cypress／Jest／axe／knip，或為了刪檔。

## 輸入

| 輸入 | 必要 | 備註 |
|---|---|---|
| 範圍 | 是 | 相對 base 的 `diff`（預設）**或**具名路徑／`apps/api/src/modules/<kebab>` **或**目標產品根。禁止默默變成整個 kit `saas` flavor 樹 |
| Flavor／preset | 有 `.ysk-kit.json` 時 | `thin` 不可因沒有 llm／billing／orgs／push 被扣分 |
| 寫測試？ | 否 | 預設 **只出計劃**。只有使用者說要實作時才走 [write-tests](write-tests.zh.md) |

## 硬規則

1. **報告範圍 = 具名切片或 diff。** 倉是研究範圍。既有產生掛載、Fastify 雙胞胎、記憶體 repo、Prisma fragment、`create-ysk-app` 模板、capability skip token 都不是「死碼」。
2. **不要改樹**，除非使用者要求實作測試或已接受刪除計劃。審查 ≠ 合併。
3. **不要寫攻擊 PoC** 或對線上流量發動攻擊。對抗性工作是記憶體 port 與 SuperTest 層的 given／when／then，對應既有 envelope 代碼：過大 body → `VALIDATION_FAILED`；另一組織 → `NOT_FOUND`／空頁；缺 JWT → `UNAUTHENTICATED`；未驗證 webhook → 拒絕；限速 → `RATE_LIMITED`；重複 → `CONFLICT`。不要發明新代碼。
4. **不要加依賴**（Cypress、Jest、axe、knip、Redis cache、額外 Chromium）。先問，與 [write-tests](write-tests.zh.md)／[upgrade-kit](upgrade-kit.zh.md) 相同。
5. **環境 = doctor + engines + flavor + 驗證命令**，不是 USB。裝置／USB／模擬器／DevTools 只在使用者要求流動／裝置 QA，或範圍含 `apps/mobile`／`apps/desktop` 時，作為可選**人手**列。
6. **死碼是候選 + 風險**，從來不是「刪光未使用 export」。動態 import、ts-rest `appContract`、Express+Fastify register、flavor 閘檔都是高風險誤報。刪除需要計劃、測試與使用者同意。本審查期間不要刪檔。
7. **測試：輸出 [test-plan](test-plan.zh.md) 標題。** 只有使用者要求實作時才貼可跑的 Vitest，而且要放進對應檔（`*.app.test.ts`、Express **與** Fastify 的 SuperTest、SDK `fetchImpl`、Playwright 只用於登入／shell）。禁止 Cypress／Jest 片段。
8. **效能：** 前端 = 額外 HTTP client、新的重型 UI kit、未標尺寸圖片、Vite 頁面無上限列表。後端 = 無上限 Prisma `findMany`、`infra/` 的 N+1、請求路徑上的同步 fs／crypto、list DTO 缺分頁。不要把 Redis 當預設修復（jobs 已是可選）。先問。
9. **架構：** hexagonal `domain`／`application`／`infra`、合約先行、客戶端經 `@ysk-kit/sdk`。標出 Vite 元件裏的業務規則、raw `fetch`、客戶端 Prisma、TypeScript `enum`、`any`、把 `undefined` 賦給可選屬性。不要提議 Hono／Drizzle／Nest／Next。
10. **重用：** 優先 `ysk-kit add module`、`@ysk-kit/ui`、既有 error code。不要為產品 domain 開 `packages/utils`。

## 步驟

1. **釐清範圍。** 預設：`git diff <base>...HEAD`（base 為 `origin/main`）。若使用者點了 kebab 或路徑，只審那些。若沒點切片又沒有 diff，**先問** — 不要審計整棵活着的 `saas` 樹。
2. **讀 flavor。** `.ysk-kit.json` 的 `flavor`／`preset`／`db`。只評分實際存在的表面。`thin` 沒有 llm／billing／orgs／push 不是發現。
3. **環境。** 跑（或記錄為何略過）：

   ```bash
   pnpm ysk-kit doctor
   pnpm ysk-kit check agent
   pnpm ysk-kit check errors
   pnpm ysk-kit check supply --repo-only
   ```

   把 `node -v`／`pnpm -v` 對照 `package.json` 的 `engines`。Playwright Chromium 可選（CI 設 `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`）。USB 手機、額外 Chromium、DevTools 擴充、模擬器、Python、Cypress、Jest **不在此棧** — 不要安裝。
4. **法律／計劃**（有 diff 時）：跟隨 [review-change](review-change.zh.md) 並連到其表。不要把同一發現再寫成第二份架構清單。
5. **架構。** 對範圍內的 `domain/`／`application/`／`infra/` 對照 [hexagonal](../guides/hexagonal.zh.md)。證據：`pnpm layers`。若 Prisma 或 Express 進了 `application/`，或客戶端 import Prisma／對 kit 路徑 raw `fetch`，判失敗。
6. **死碼候選。** 只在**切片**內搜未使用 export。填候選表並標風險（動態／產生／flavor）。檔案留在原位。
7. **效能。** 走下列清單。優先分頁與查詢形狀，不要新基礎建設。
8. **安全。** 表格委派 [security-review](security-review.zh.md)（嚴重程度 × 信心，**沒有 PoC**）。lockfile／runtime 在範圍內則 [supply-scan](supply-scan.zh.md)。對抗性案例用 given／when／then（層 + 檔 + envelope `error.code`）。
9. **測試。** 輸出 [test-plan](test-plan.zh.md) 標題（Change／Risks／Layer map／Cases／Fixtures／Out of scope）。只有「寫測試 = 正在實作」才交棒 [write-tests](write-tests.zh.md)。
10. **人手 + 重用 + 總結。** 裝置／視覺／鍵盤只列自動化看不見的。共用 hook 留在 `@ysk-kit/ui`／web-sdk。P0 交人類。**不要合併。**

## 效能清單

| 表面 | 找甚麼 | 建議改動 | 要先問？ |
|---|---|---|---|
| Vite 頁 | 額外 HTTP client，不是 `@ysk-kit/sdk`／`@ysk-kit/web-sdk` | 用 SDK | 否 |
| Vite 頁 | 新的重型 UI kit／混用圓角 | 留在 `@ysk-kit/ui` + zinc | 是（新依賴） |
| Vite 頁 | 未標尺寸圖片、無上限 `.map` 列表 | 寬高；分頁 | 否 |
| `infra/` | 無上限 Prisma `findMany` | cursor／take；list DTO 分頁 | 否 |
| `infra/` | N+1（每列一查） | 在 port 用 `include`／批次 | 否 |
| 請求路徑 | handler 內同步 `fs`／`crypto` | 既有 port；不要加 Redis | 是（Redis／cache） |
| Bundle | web／admin 新 runtime 依賴 | 先問；優先既有套件 | 是 |

與 [ui-review](ui-review.zh.md) 重疊的 UI 列（未標圖片、額外 HTTP client、重型 UI 依賴）也屬該 skill — 連過去，不要再做第二次視覺審查。不要把 `@axe-core/playwright` 加進 CI。

## 驗證

```bash
pnpm ysk-kit doctor
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent && pnpm ysk-kit check errors
```

預期：寫出 doctor 發現（或略過原因）；能跑時 `pnpm layers` 退出碼 0；改 skill 檔後 `ysk-kit check agent: ok`。除非切片含登入／shell 且埠空閒，不要跑 `pnpm e2e`。

- [ ] 範圍是 diff 或具名路徑（不是默默的整樹 kit 審計）
- [ ] 沒有刪檔；沒有安裝 Cypress／Jest／USB
- [ ] 安全標題是 security-review 表或明確略過
- [ ] 測試標題用 test-plan 形狀；只有使用者要求才附 Vitest
- [ ] 報告寫明審查 ≠ 合併

## 輸出格式

```md
## Audit slice — <範圍> (<base>...HEAD 或路徑)

Flavor／preset: <來自 .ysk-kit.json 或 kit>
寫測試: 只計劃 | 正在實作（使用者要求）

### 1. 環境與工具就緒
doctor: ok | FAIL (<id>)
node／pnpm: <對 engines>
check agent／errors／supply: ok | FAIL | skipped
Playwright Chromium: 有 | 略過（CI PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD 或埠被佔）
USB 手機／額外 Chromium／DevTools／模擬器: 非必要 | 使用者要求且 <找到／缺少>
Python／Cypress／Jest: 不在此棧（不要安裝）

### 2. 架構與組織
| # | 嚴重程度 | 位置 | 發現 | 修復或交人類 |
法律／計劃（若有 diff）: PASS | FAIL | 不適用 — 連到 review-change 表

### 3. 死碼候選（本 skill 不刪）
| 路徑 | 符號 | 為何似未使用 | 風險（動態／產生／flavor） | 可否安全刪？ |

### 4. 效能
| 表面 | 問題 | 證據 | 建議改動 | 預期影響 | 要先問？ |

### 5. 安全與對抗性計劃
委派 security-review 表（嚴重程度 × 信心）。沒有 PoC。
對抗性案例用 given／when／then（層 + 檔）。lockfile／runtime 在範圍內則 supply-scan。

### 6. 自動化測試計劃（不是貼上大段程式）
test-plan 標題：Change／Risks／Layer map／Cases／Fixtures／Out of scope。
只有「寫測試 = 正在實作」才附可跑程式。

### 7. 人手檢查清單
裝置、視覺 375／768／1280、鍵盤、seed 管理員登入、webhook 控制台 — 只列自動化看不見的。

### 8. 重用與設計
共用 hook／元件須留在 @ysk-kit/ui／web-sdk；否則留在該模組切片。

### 9. 優先順序總結
P0 交人類（授權、密鑰、DROP、新 runtime 依賴）。
P1 經 write-tests 要寫的測試。
P2 死碼／效能瑣事。
```

嚴重程度：`high`（硬規則破裂、跨租戶、密鑰外洩）／`medium`／`low`。`AGENTS.md` 沒點名的純風格瑣事略過。

## 完成條件

九段報告已按具名切片或 diff 填寫。環境用 doctor + engines，不是 USB。死碼列是帶風險的候選。安全已委派；沒有攻擊 PoC。測試是 test-plan（只有被要求才附 Vitest）。除非使用者要求實作測試，否則樹沒有改動。這次審查沒有合併。

## 反模式

| 症狀 | 改做這個 |
|---|---|
| 對本倉活着的 `saas` flavor 做整樹審計 | 預設範圍 = diff 或具名模組 |
| 刪未使用的 Fastify register／記憶體 repo／flavor stub | 候選表；產生／flavor = 不安全 |
| 寫 Cypress／Jest／Python 測試 | Vitest + SuperTest + 一條 Playwright Chromium smoke |
| 探 USB／額外 Chrome／DevTools／模擬器 | doctor + engines；裝置列只在被要求時 |
| 「執行攻擊」／SQLi PoC | given／when／then → envelope 代碼；Prisma 不是裸 SQL |
| 審查期間把測試倒進樹 | 只出 test-plan；只有被要求才 write-tests |
| 加 Redis／knip／axe／Trivy「做完」審計 | 先問；優先分頁與既有閘門 |
| 摺進 `security-review` 或 `AGENTS.md` | 本 skill + 一列漸進披露 |
| `create-ysk-app` 後自動跑 | 觸發是使用者要求／發佈前，不是 scaffold |
| 因為報告很完整就合併 | 審查 ≠ 合併 |

## 升級／詢問

刪檔、加 runtime 或掃描器、寫使用者沒要求的測試、審計整棵 kit 樹、削弱授權／速率限制／密鑰日誌，或合併之前，先停下來問。
