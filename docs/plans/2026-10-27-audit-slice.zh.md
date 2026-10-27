# 計劃：切片審計

Language: 英文配對 `2026-10-27-audit-slice.md` · 中文 `2026-10-27-audit-slice.zh.md`

| | |
|---|---|
| **Slug** | `audit-slice` |
| **日期** | 2026-10-27 |
| **狀態** | draft — 等待使用者批准（只做研究；本 PR 不實作 skill） |
| **正規檔** | `docs/plans/2026-10-27-audit-slice.md` |
| **工作階段指針** | `/plan.md`（已 gitignore） |

法律：[AGENTS.zh.md](../../AGENTS.zh.md)。程序：[plan-feature](../skills/plan-feature.zh.md)。檢查：`pnpm ysk-kit plan --check docs/plans/2026-10-27-audit-slice.zh.md`。

## 目標與使用者問題

有人提議把一段「Staff Engineer + Security Engineer + QA Architect」長提示詞放進 ysk-kit，讓 agent 做嚴格架構審查、清死碼、效能、對抗性安全測試、環境偵測（USB 手機、第二套 Chromium、DevTools 擴充、模擬器），然後直接寫可執行測試，並用固定九段格式回報。原文是繁體中文，夾雜口語意圖。

Kit 其實已用多份 skill 教同一意圖：hexagonal 分層、`review-change`、`security-review`、`test-plan` → `write-tests`、`ui-review`、`supply-scan`、`verify-change`、`ysk-kit doctor`／`check *`。Agent 仍會漏做組合審查：只跑其中一份 skill，或貼上與 kit 法律衝突的通用審計（整樹刪檔、Cypress／Jest、攻擊 PoC、在 Cloud Agent 上找 USB）。

本計劃記錄的結果：**判詞為 yes-with-edits（要改過才加）**。不要把候選提示詞整段貼進 `AGENTS.md`。獲准之後，新增一份雙語編排 skill `audit-slice`：保留高價值的九段報告，把環境／測試／死碼改寫成 kit 閘門，並交回既有 skill，而不是再寫一套。

本 PR **只提交日期計劃**。不合併、不發佈、在使用者接受下列改寫合約之前不新增 skill 檔。

## 範圍

- 包含：本日期計劃配對，作為研究紀錄（判詞、放置位置、kit 原生改寫、風險排序、工作量）。
- 包含（批准後的後續 PR）：skill `audit-slice`（`docs/skills/audit-slice.md` + `.zh.md`），以及 `tooling/ysk-cli/templates/agent/skills/audit-slice/`、`.agents/skills/`、`.claude/skills/` 的薄包裝（create-app／upgrade 會漂移檢查地複製到 `.cursor/skills/` 與 `.grok/skills/`）。
- 包含（批准後）：`AGENTS.md`／`AGENTS.zh.md` 一列漸進披露；`docs/skills/index.md` 配對一列；`tooling/ysk-cli/src/docs-pair.test.ts` 的 `SKILLS` 陣列；thin-smoke 與 flavor-smoke 檔案斷言；create-app 測試；`review-change` 與 `security-review`「不要用於」的指針句。
- 包含（批准後，可選一句）：計劃模板的**人手檢查**可寫「若使用者要求 Staff／QA 審計，跟隨 `audit-slice`」。
- 包含：鎖定 changeset 與 changelog／README 窗口——**只在 skill 檔真正送出時**，對應當時 kit 的下一個 patch。不是這次研究 PR。

## 非目標

- 不含：未經使用者批准就合併本 PR（或後續實作）。不含 npm 發佈。
- 不含：把候選提示詞或九段清單倒進 `AGENTS.md`（根檔已約 20.6 KiB；根目錄加巢狀合計上限 24 KiB）。
- 不含：以 Cursor custom mode／Plan Mode 檔作為正式位置（目標產品靠 `create-ysk-app` 與 `ysk-kit upgrade` 取得 skill，不是靠本機 Cursor 模式）。
- 不含：在 `create-ysk-app` 搭完骨架後自動跑整樹審計（產生出來的 thin／full 樹會被標成「kit 廢碼」）。
- 不含：把 Cypress、Jest、`@axe-core/playwright`、knip、ts-prune、`fast-check`、Trivy，或 USB／ADB 裝置驅動設成預設。
- 不含：指示 agent 在審查期間寫攻擊 PoC、對線上系統發動攻擊、或刪檔。
- 不含：新 HTTP 路徑、Prisma model、envelope 例外、capability 或 SDK 方法。
- 不含：把長提示詞摺進 `security-review`（該 skill 沿用 getsentry 風格：**報告範圍 = diff**）。
- 不含：取代 `review-change` 的法律／計劃兩軸，或測試 trophy。

## 假設

- 對話裏的候選提示詞全文即評估對象；倉內沒有另一份已提交檔。
- ysk.hk 產品頁在 kit v1.6.5 上線與此研究無關。
- Cloud Agent、GitHub-hosted CI（`ubuntu-latest`、`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`）與目標產品 CI 很少有 USB 手機、第二套 Chromium、React DevTools 或模擬器。`ysk-kit doctor` 已覆蓋 engines、env、密鑰、資料庫、rules、agent、errors、supply。
- Kit 測試棧是 Vitest + Testing Library + 一條 Playwright Chromium smoke。倉內沒有 Cypress 或 Jest（ripgrep 無匹配）。
- 「只跟 stable／功能要批准」在此處指：不要加新 runtime 或掃描器；未經詢問不要把 Electron 45／TypeScript 7／Prisma 8 當預設（[upgrade-kit](../skills/upgrade-kit.zh.md)）；在本計劃獲接受之前不要實作 `audit-slice`。
- 後續實作 PR 需要慣例的 skill 接線清單（包裝、smoke、`SKILLS` 陣列）。此清單已有先例（`supply-scan`、`error-log-review`、日常循環 skills）。

## 受影響的 flavor／preset／capability

| 軸 | 值 | 備註 |
|---|---|---|
| Flavor | kit 本身，之後經 upgrade／create-app 到每個工作區 flavor | php-bridge 不收 skill 包裝；不要發明只給 PHP 的審計 |
| Preset | thin／full | thin 沒有 llm／billing／orgs／push — 審計不可因缺少這些表面而扣分 |
| Capabilities | 只作引用 | 授權／租戶仍走 `security-review`；webhook／Electron／LLM 留在各自 skill |

## 現況與重用

探索結果：候選提示詞與**既有 skill 大量重疊**。缺口是編排，加上三條尚未獨立成 skill 的審查軸（效能、帶風險閘的死碼、誠實的環境偵測）。若原樣送出，衝突是真實且有害的。

### 候選章節對照既有覆蓋

| 候選章節 | Kit 已有 | 缺口／衝突 |
|---|---|---|
| 角色扮演「Staff + Security + QA」 | Skill 以觸發為準，不是人設。`review-change` 是法律 + 計劃 | 人設提示嘈雜；保留 YAML 觸發即可 |
| 真實自動化優先 + 人手清單 | `test-plan`（trophy、不涵蓋範圍）+ 計劃模板**人手檢查** + `ui-review` | 保留；改寫「現在就寫測試」 |
| 零容忍死碼 | 沒有 knip／ts-prune。Biome 不是 CI 未使用 export 掃描 | 需要帶閘門的*候選*，禁止默默刪 |
| 效能（re-render、bundle、N+1） | `ui-review` 效能格很薄（不要額外 HTTP client、不要重型 UI 依賴）。沒有 N+1／bundle skill | **真正缺口** — 加一段 kit 原生清單 |
| 安全 + 對抗性 | `security-review`（授權、租戶、密鑰、webhook、LLM、速率、CORS、供應鏈）+ `supply-scan` + `desktop-electron` + `webhook-handling` + `llm-feature` | 候選要求「執行攻擊」並列 SQLi／XSS／命令注入；kit 禁止攻擊 PoC；Prisma + Zod 已約束 SQL／輸入 |
| 環境（USB、額外 Chrome、擴充、模擬器、Python、Cypress／Jest） | `ysk-kit doctor`；`engines.node` ≥26.12.1；`apps/web/e2e` 的 Playwright Chromium；CI 跳過瀏覽器下載 | USB／擴充／Python／Cypress／Jest **不屬於此棧** |
| 寫出可執行測試 | `test-plan` 之後才 `write-tests`；垂直 TDD；記憶體 port；Express **與** Fastify | 審查 skill 不可把測試倒進樹，除非使用者要求實作 |
| 可重用／單一職責／命名 | hexagonal 指南、`add-module`、硬規則 1–5、`@ysk-kit/ui` | 標出產品重複邏輯；不要另開平行 shared 資料夾 |
| 九段輸出 | 每份 skill 自有格式（`review-change` 表、`security-review` ASVS 表、`test-plan` 標題） | 編排器可保留九個標題，**條件是**呼叫那些格式，而不是取代它們 |
| 整個目前 codebase | `review-change`／`security-review`：**報告範圍 = diff**；反模式是「把 diff 以外的檔當發現」 | 對本倉活着的 `saas` flavor 做整樹審計，會大量誤報 |
| TypeScript `any` | 已開 `exactOptionalPropertyTypes`；`check agent` 沒有專門掃 `any` | 在範圍檔報告 `any`；本 skill 第一版不要加新的 `check agent` 規則 |

### 會重用的檔（不要重寫）

| 路徑 | 符號 | 重用為 |
|---|---|---|
| `docs/skills/review-change.md` | 法律／計劃兩軸、高風險人工清單 | 有 diff 時編排器的第一個子程序 |
| `docs/skills/security-review.md` | 以 diff 為範圍的授權、威脅模型子模式 | 安全標題委派至此 |
| `docs/skills/supply-scan.md` | `pnpm ysk-kit check supply` | 依賴標題；不要 `npx` Trivy |
| `docs/skills/test-plan.md` | 風險排序、分層對應、given／when／then | 自動化測試標題輸出此形狀 |
| `docs/skills/write-tests.md` | Trophy、Vitest／Playwright 命令 | 只在使用者要求實作測試時交棒 |
| `docs/skills/ui-review.md` | 視覺／無障礙／狀態／375 | UI 列；不要把 axe 加進 CI |
| `docs/skills/verify-change.md` | 五條驗證命令 | 環境「能否驗證？」 |
| `docs/skills/debug-issue.md` | 紅燈迴圈 Express **與** Fastify | 發現變成修 bug 時 |
| `docs/guides/hexagonal.md` | domain／application／infra | 架構清單 |
| `docs/guides/testing.md` | Trophy、CI 工作、沒有 Cypress／Jest | 引用，不要複製 |
| `tooling/ysk-cli/src/doctor.ts` | engines、env、密鑰、資料庫、agent、errors、supply | 環境章節 |
| `.dependency-cruiser.cjs`／`pnpm layers` | 分層圖 | 架構證據 |
| `docs/plans/_template.md` | 人手檢查已存在 | 之後可選加一句指針 |
| `docs/plans/2026-10-06-daily-loop-skills.md` | Skill 接線模式 | 抄檔案清單，不要抄提示詞 |

## 考慮過的方案

| 方案 | 複雜度 | 分層 | 遷移 | 客戶端 | 備註 |
|---|---|---|---|---|---|
| A. 把候選提示詞貼進 `AGENTS.md` | 低 | 無 | 無 | 每個 agent 都載入 | 爆 24 KiB；對抗 diff 範圍、trophy、禁止 PoC、禁止 Cypress；**否決** |
| B. 只做 Cursor custom mode／本機提示 | 低 | 無 | 無 | 只有 Cursor Desktop | 目標產品、Claude、Grok、Copilot、Cloud Agent 都看不見；**不可當正式位置** |
| C. 原地擴寫 `security-review` + `review-change` | 中 | 只文件 | 無 | 所有 flavor | 把 PR 審查與整樹 QA 混在一起；稀釋 getsentry 的 diff 範圍；**否決** |
| D. 新編排 skill `audit-slice` + AGENTS 一列 | 中 | 文件 + 包裝 + smoke 清單 | 無 | 經 upgrade 到目標產品 | 與 `supply-scan`／`error-log-review` 落地方式相同；**選定** |
| E. create-app 搭完骨架自動審計 | 高 | create-app | 無 | 每個新目標產品 | 審計的是產生出來的 kit 檔；還會探 USB；**否決** |

**選定：** D（現在只研究；skill 等批准後才實作）。  
**原因：** 高價值部分（嚴重程度、人手清單、對分層的架構、對抗性*規劃*）應放在 agent 真會載入的 skill，同時不取代法律／計劃審查，也不鼓勵刪掉 Fastify 雙胞胎。A 與 C 違反已寫明的反模式。B 到不了目標產品。E 是最嘈雜的放置方式。

## 合約先行

沒有 DTO、command、error code 或 ts-rest 路徑。此處的「合約」是 skill 觸發、範圍規則與輸出標題。

| 項目 | 名稱／路徑 | 備註 |
|---|---|---|
| DTO | 沒有 | 只文件 |
| Command | 沒有 | |
| Error codes | 重用既有代碼 | 對抗性案例對應 `UNAUTHENTICATED`、`FORBIDDEN`、`VALIDATION_FAILED`、`RATE_LIMITED`、`NOT_FOUND`、`CONFLICT` — 審查時不要發明新代碼 |
| 路徑 | 沒有 | 從 OpenAPI 發現；若之後實作測試，經 SDK 呼叫 |

### Skill 合約（批准後才實作）

**名稱：** `audit-slice`  
**包裝：** YAML `name` + `description`（≤1024 字元，含中文觸發：切片審計、Staff 審查、完整審查、對抗性測試、死碼、效能）。指向 `docs/skills/audit-slice.md` 與 `AGENTS.md`。

**觸發**

- 使用者要求 Staff／Security／QA Architect 審查、「full audit」、完整審查、對抗性測試、死碼清理，或貼上帶那九個標題的長提示詞。
- 對**具名**目標產品模組或目前 diff 做發佈前 QA。

**不要用於**

- 實作功能（`plan-feature`）。
- 普通 PR 審查，除非使用者要求這次組合審計（`review-change`）。
- 只改授權／webhook／SQL 的 diff（`security-review`、`webhook-handling`、`db-migration`）。
- `create-ysk-app` 剛搭完骨架（產生樹不是產品死碼）。
- 為了加 Cypress／Jest／axe／knip，或為了刪檔。

**輸入**

| 輸入 | 必要 | 備註 |
|---|---|---|
| 範圍 | 是 | 相對 base 的 `diff`（預設）**或**具名路徑／`apps/api/src/modules/<kebab>` **或**目標產品根。禁止默默變成整個 kit `saas` flavor 樹 |
| Flavor／preset | 有 `.ysk-kit.json` 時 | thin 不可因沒有 llm／billing／orgs／push 被扣分 |
| 寫測試？ | 否 | 預設 **只出計劃**。只有使用者說要實作時才走 `write-tests` |

**本 skill 的硬規則（對候選提示詞的 kit 原生修改）**

1. **報告範圍 = 具名切片或 diff。** 倉是研究範圍。既有產生掛載、Fastify 雙胞胎、記憶體 repo、Prisma fragment、`create-ysk-app` 模板、capability skip token 都不是「死碼」。
2. **不要改樹**，除非使用者要求實作測試或已接受刪除計劃。審查 ≠ 合併。
3. **不要寫攻擊 PoC** 或對線上流量發動攻擊。對抗性工作是記憶體 port 與 SuperTest 層的 given／when／then（過大 body → `VALIDATION_FAILED`；另一組織 → `NOT_FOUND`／空頁；缺 JWT → `UNAUTHENTICATED`；未驗證 webhook → 拒絕）。
4. **不要加依賴**（Cypress、Jest、axe、knip、Redis cache、額外 Chromium）。先問，與 `write-tests`／`upgrade-kit` 相同。
5. **環境 = doctor + engines + flavor + 驗證命令**，不是 USB。裝置／USB／模擬器／DevTools 只在使用者要求流動／裝置 QA，或範圍含 `apps/mobile`／`apps/desktop` 時，作為可選**人手**列。
6. **死碼是候選 + 風險**，從來不是「刪光未使用 export」。動態 import、ts-rest `appContract`、Express+Fastify register、flavor 閘檔都是高風險誤報。刪除需要計劃、測試與使用者同意。
7. **測試：輸出 `test-plan` 標題。** 只有使用者要求實作時才貼可跑的 Vitest，而且要放進對應檔（`*.app.test.ts`、Express **與** Fastify 的 SuperTest、SDK `fetchImpl`、Playwright 只用於登入／shell）。禁止 Cypress／Jest 片段。
8. **效能：** 前端 = 額外 HTTP client、新的重型 UI kit、未標尺寸圖片、Vite 頁面無上限列表。後端 = 無上限 Prisma `findMany`、`infra/` 的 N+1、請求路徑上的同步 fs／crypto、list DTO 缺分頁。不要把 Redis 當預設修復（jobs 已是可選）。
9. **架構：** hexagonal `domain`／`application`／`infra`、合約先行、客戶端經 `@ysk-kit/sdk`。標出 Vite 元件裏的業務規則、raw `fetch`、客戶端 Prisma、TypeScript `enum`、`any`、把 `undefined` 賦給可選屬性。不要提議 Hono／Drizzle／Nest／Next。
10. **重用：** 優先 `ysk-kit add module`、`@ysk-kit/ui`、既有 error code。不要為產品 domain 開 `packages/utils`。

**改寫後的九段輸出**（保留使用者結構，改實質）

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

## 資料模型／Prisma 與遷移

沒有。不適用 — 不改 schema，不跑 `pnpm db:migrate`。

## 模組切片與分層

不改 `apps/api/src/modules/*/application` 或 `infra`。Skill 在範圍含某 kebab 時會*讀*那些資料夾；若目標產品把 Prisma 或 Express 放進 `application/`，架構章節判失敗。

## SDK／web-sdk／客戶端表面

沒有 runtime 客戶端程式。Skill 會用與 `pnpm ysk-kit check agent` 相同的規則，標出目標產品的 `fetch('/v1/...')` 與 Prisma import。

## Jobs／mail／realtime／notifications

沒有。不適用 — 審計時不要把 Redis／cache／mail 當成預設效能方案。

## 安全與私隱

本 skill 不可削弱授權、速率限制或密鑰日誌規則。探查時不可記錄 OTP、JWT、Stripe `sk_` 或 webhook 密鑰。不可產出攻擊步驟。依賴發現走 [supply-scan](../skills/supply-scan.zh.md)（`pnpm ysk-kit check supply --repo-only`，登記處允許時加 `--online`）。新 runtime 依賴仍須**先問**。新信任邊界的威脅模型子模式留在 [security-review](../skills/security-review.zh.md)。

## 測試計劃

本研究 PR 不加產品行為。之後的 skill PR：合約層的 docs-pair + smoke 檔存在性，不是 application 測試。

### 改動

先記錄（之後才送出）一份編排 skill，讓 agent 做有範圍的 Staff／安全／QA 審計，而不對抗 kit 法律。

### 風險

1. Agent 把該 skill 當成准許刪產生雙胞胎或寫 Cypress（對目標產品等於供應鏈 + 資料損失類比）。
2. 對本 kit 用整樹範圍會誤報（full preset 示範的 llm／billing）。
3. Skill 漂移／漏了 smoke 斷言 → `check agent` 或 thin-smoke 紅燈。
4. 漸進披露列過長觸及 AGENTS.md 預算（低）。

### 分層對應

| 風險 | 層 | 檔 |
|---|---|---|
| 缺文件配對 | docs-pair | `tooling/ysk-cli/src/docs-pair.test.ts`（`SKILLS` 含 `audit-slice`） |
| 包裝漂移 | check agent | `.agents/skills/audit-slice/SKILL.md` 對模板 |
| 目標產品缺 stub | create-app／CI | `tooling/create-ysk-app/src/index.test.ts`、`.github/workflows/ci.yml` thin-smoke、`.github/scripts/flavor-smoke.sh` |

### 案例

1. **配對存在** — 層：docs-pair。given skill 名 `audit-slice`／when 跑 `docs-pair` 測試／then 英文 skill、中文配對、模板、`.agents` 與 `.claude` 副本都存在且提及 `AGENTS.md`。
2. **thin 目標產品收到包裝** — 層：create-app。given `create-ysk-app --preset thin`／when 寫出 dest／then `.agents/skills/audit-slice/SKILL.md` 存在（php-bridge 仍略過）。
3. **skill 正文拒絕原樣提示詞** — 層：文件。given `audit-slice.md`／when grep／then 把 Cypress／Jest／USB 標成不在此棧，並寫明審查期間不要刪檔。

### 夾具

- 既有 `docs-pair` 的 `SKILLS` 陣列與 flavor-smoke 路徑清單。
- 這些案例不需要 Redis、Stripe、Playwright。

### 不涵蓋範圍

- Memory-repo 服務案例、envelope HTTP、Playwright、真實 USB。
- **本 PR** 實作該 skill。

## 驗證命令

每條命令都有預期結果。本研究 PR 只改文件。

| 命令 | 預期結果 |
|---|---|
| `pnpm ysk-kit plan --check docs/plans/2026-10-27-audit-slice.md` | 印出 `ysk-kit plan --check: ok` |
| `pnpm ysk-kit plan --check docs/plans/2026-10-27-audit-slice.zh.md` | 印出 `ysk-kit plan --check: ok` |
| `pnpm ysk-kit check agent` | 印出 `ysk-kit check agent: ok`（預算不變；尚未有新包裝） |
| `pnpm ysk-kit check errors` | 印出 `ysk-kit check errors: ok` |
| `pnpm layers` | 退出碼 0（runtime 圖無改） |
| `pnpm typecheck` | 退出碼 0 |
| `pnpm test` | 退出碼 0 |
| `pnpm gen:openapi` | `docs/openapi.yaml` 不變 |

可選：`pnpm lint`。不要跑 `pnpm e2e`（沒改登入／shell）。Grok Build：`grok inspect` 在提交後會列出本計劃，在包裝存在之前不會列出新 skill。

### 人手檢查

沒有 UI／HTTP／授權流程 — 本改動是計劃檔。閘門是人類審視本文的**判詞與 skill 合約**。

- [ ] UI 流程：不適用
- [ ] Envelope 形狀：不適用
- [ ] 授權角色：不適用
- [ ] 使用者接受或否決名稱 `audit-slice`、預設範圍 = diff，以及「只計劃測試、不要刪檔」

## 文件／變更紀錄／changeset

- [ ] 本計劃配對即研究紀錄。
- [ ] 批准後：`docs/skills/audit-slice.md` 配對、index、AGENTS 一列、包裝、smoke 清單。
- [ ] Changelog／README 窗口／鎖定 changeset：**skill 送出時**才做，不是本 PR。
- [ ] 不要提及 ysk.hk v1.6.5 產品頁。

## 風險與回滾

| 若原樣送出候選提示詞的風險 | 為何有害 | Kit 原生緩解 |
|---|---|---|
| 1. Agent 在「審查」期間把測試寫進樹 | 繞過計劃閘、垂直 TDD、Express+Fastify 雙胞胎 | 預設不寫測試；只出 test-plan |
| 2. 刪「未使用」的 Fastify register、記憶體 repo、capability stub | 破壞 `HTTP_ADAPTER=fastify`、CI、thin 對 full | 死碼表加風險；產生／flavor = 不安全 |
| 3. 探 USB／額外 Chrome／擴充／模擬器 | Cloud Agent 與 CI 會失敗；浪費安裝 | doctor + 可選 Playwright；裝置列只在被要求時 |
| 4. 建議 Cypress／Jest／Python runtime | 第二套測試棧；新依賴要批准 | 明文不在此棧 |
| 5. 倒進 `AGENTS.md` | AGENTS 合計預算 24 KiB；根檔已約 20.6 KiB | 只加一列漸進披露 |
| 6. 對 kit `saas` 做整樹審計 | 示範 llm／billing／orgs 出現數以百計發現 | 預設範圍 = diff 或具名模組 |
| 7. 「執行攻擊」／SQLi PoC | `supply-scan`／security-review 禁止；Prisma 不是裸 SQL | 只做對抗性*計劃*；用 envelope error code |
| 8. 以 Cursor custom mode 為家 | 目標應用與非 Cursor agent 永不載入 | 經 create-app／upgrade 的 skill 包裝 |
| 9. 搭完骨架自動跑 | 新產品看起來「很髒」 | 觸發是使用者要求／發佈前，不是 scaffold |
| 10. 效能「現在就加 Redis／cache」 | 新基礎建設、密鑰、CI | 先問；優先分頁與查詢形狀 |
| 11. 包裝加得不均導致 skill 漂移 | `check agent`／thin-smoke 紅燈 | 與 `supply-scan` 相同的接線清單 |
| 12. 人設提示永遠開啟 | 每次對話耗 token 並刷瑣事 | YAML 觸發；不要 alwaysApply 一條 Cursor 規則 |

回滾：還原本計劃 commit（本 PR）。之後的 skill PR：還原 skill 檔、`SKILLS` 列、smoke 斷言、AGENTS 列；目標產品跑 `ysk-kit upgrade` 可恢復先前包裝。

## 任務清單

按順序。本 PR 停在步驟 0。其餘等批准。

0. [x] 研究紀錄（本檔）
   - **檔案：** `docs/plans/2026-10-27-audit-slice.md`、`docs/plans/2026-10-27-audit-slice.zh.md`
   - **介面／合約／資料：** 沒有
   - **風險：** plan-check 標題
   - **回滾：** 還原 commit
   - **驗收：** 兩份 `--check` 印 ok；狀態 **draft — 等待使用者批准**；沒有 skill 包裝；沒有 changeset

1. [ ] 合約（skill YAML + 輸出標題）— 批准後
   - **檔案：** `docs/skills/audit-slice.md`、`docs/skills/audit-slice.zh.md`
   - **介面／合約／資料：** 沒有（無 DTO）
   - **風險：** 複製 security-review；過長
   - **回滾：** 刪配對
   - **驗收：** 有觸發／不要用於／輸入／九段輸出／反模式；Cypress／Jest／USB 標成不在此棧；沒有 TypeScript `enum`

2. [ ] 骨架包裝 — 批准後
   - **檔案：** `tooling/ysk-cli/templates/agent/skills/audit-slice/SKILL.md`、`.agents/skills/audit-slice/SKILL.md`、`.claude/skills/audit-slice/SKILL.md`；`docs-pair.test.ts` 的 `SKILLS`；thin-smoke；`flavor-smoke.sh`；create-app 測試
   - **介面／合約／資料：** 沒有
   - **風險：** skill 漂移
   - **回滾：** 從清單移除名稱
   - **驗收：** `pnpm ysk-kit check agent` ok；thin dest 有包裝；php-bridge 仍略過

3. [ ] Application 規則
   - **檔案：** 沒有
   - **介面／合約／資料：** 沒有
   - **風險：** 沒有
   - **回滾：** 不適用
   - **驗收：** 不適用 — 無 `application/` 程式。不要手開模組資料夾。

4. [ ] 客戶端
   - **檔案：** 沒有
   - **介面／合約／資料：** 沒有
   - **風險：** 沒有
   - **回滾：** 不適用
   - **驗收：** 不適用 — 無 SDK／UI。之後可選：在 `review-change`／`security-review` 的「不要」加一句。

5. [ ] 驗證 — skill PR 之後
   - **檔案：** 無額外
   - **介面／合約／資料：** 沒有
   - **風險：** smoke 清單漏列
   - **回滾：** 還原 skill PR
   - **驗收：** `pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent && pnpm ysk-kit check errors` 綠；OpenAPI 不變

6. [ ] 文件 — skill PR 之後
   - **檔案：** `docs/skills/index.md` 配對、`AGENTS.md` 配對（一列）、可選計劃模板一句、changelog／README、鎖定 changeset
   - **介面／合約／資料：** 沒有
   - **風險：** 24 KiB 預算（AGENTS 列保持一行）
   - **回滾：** 還原文件
   - **驗收：** 中英配對深度一致；`check agent` 仍 ok

## 未決問題

未解決的項目留在這裏。不要用猜測填滿。

- 確認 skill **名稱**用 `audit-slice`、`deep-review` 還是 `qa-audit`。建議：`audit-slice`（範圍是切片，不是整棵樹）。
- 確認**預設範圍**是 git diff。替代：目標產品 `apps/api/src/modules/*`，排除 kit 套件。整棵 kit 樹應保持為使用者顯式覆寫。
- 第一版 skill **應否**寫測試檔，還是永遠只出 test-plan？建議：只出計劃，除非使用者說「寫測試」。
- 之後可選（不是第一版）：`check agent` 掃 `apps/` 的 TypeScript `any` — 另開計劃；不要綁進本 skill。
- 是否加一條 Cursor `.mdc`（`alwaysApply: false`、不設 globs、只靠 description）。建議：**不要**額外規則檔；skill 包裝已夠。永遠開啟會消耗 token。
