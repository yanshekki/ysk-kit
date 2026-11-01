# 計劃：澄清功能與 SDD 路徑

Language: 英文配對 `2026-11-01-clarify-feature-sdd-path.md` · 中文 `2026-11-01-clarify-feature-sdd-path.zh.md`

| | |
|---|---|
| **Slug** | `clarify-feature-sdd-path` |
| **日期** | 2026-11-01 |
| **狀態** | draft — 等待使用者批准 |
| **正規檔** | `docs/plans/2026-11-01-clarify-feature-sdd-path.md` |
| **工作階段指針** | `/plan.md`（已 gitignore） |

法律：[AGENTS.zh.md](../../AGENTS.zh.md)。程序：[plan-feature](../skills/plan-feature.zh.md)。檢查：`pnpm ysk-kit plan --check docs/plans/2026-11-01-clarify-feature-sdd-path.zh.md`。

本檔是已批准的 Spec Kit 對齊切片（只含提案 1 與 5）的研究紀錄。Skill 檔與 `docs/plans/sdd-path.md` 在之後的 PR 送出。本 PR 不合併、不實作。

## 目標與使用者問題

使用 ysk-kit 的 agent 已有憲法（`AGENTS.md`）、可保存計劃（`plan-feature` + `docs/plans/_template.md` + `ysk-kit plan --check`）、合約先行的實作 skill、`verify-change`、`review-change`，以及可選的 `audit-slice`。仍有兩個缺口：

1. 沒有 kit 原生的**澄清**閘。日期計劃的未決問題不是空的時候，agent 會猜測，或用產品領域問題來問，而那些問題對不上授權、租戶、envelope、flavor／preset、UI 表面。
2. 精簡路徑與完整路徑埋在文件裡。`docs/plans/README.md` 有工具計劃模式對照，但沒有說該跑哪一條 skill 序列，也沒有給 Cursor、Claude Code、Grok Build 的可複製提示。

Spec Kit（GitHub 的 specify 覆層：constitution → specify → clarify → plan → tasks → implement → converge）是有用的*順序*，不是第二套法律。ysk-kit 是產品 kit。把 Spec Kit CLI 引進來，或在 `docs/plans/` 旁邊加 `.specify/`，會把紀錄拆成兩份。

批准之後的結果：一份雙語 skill `clarify-feature`、一張雙語路徑卡 `docs/plans/sdd-path.md`、與 `supply-scan`／`audit-slice` 相同路徑的薄包裝，以及 `AGENTS.md` 漸進披露兩列加計劃協議一句。精簡工作維持 `plan-feature` → 實作 skill → `verify-change` → `review-change`。完整工作在批准前插入 `clarify-feature`。Converge 只具名為後續，本切片不寫。

## 範圍

- 包含：這對日期計劃（建議、skill 合約、路徑卡大綱、位元組預算、接線清單）。
- 包含（批准後的後續 PR）：`docs/skills/clarify-feature.md` + `.zh.md`。
- 包含（批准後）：薄包裝 `tooling/ysk-cli/templates/agent/skills/clarify-feature/SKILL.md`，以及 `.agents/skills/clarify-feature/` 與 `.claude/skills/clarify-feature/` 的逐位元組相同副本。`create-ysk-app`／`ysk-kit upgrade` 已透過 `writeAgentStubs` 把每個模板 skill 複製到 `.cursor/skills/` 與 `.grok/skills/`。不要提交那兩棵樹（`.gitignore` 忽略 `.cursor/*`，規則除外，並忽略 `.grok/`）。
- 包含（批准後）：`docs/plans/sdd-path.md` + `.zh.md`，寫明精簡與完整序列，以及可複製提示。
- 包含（批准後）：`AGENTS.md`／`AGENTS.zh.md` 各一列指向 `clarify-feature`、一列指向 `sdd-path`，再加計劃協議一句。英文字節見「現況與重用」。
- 包含（批准後）：index 列、`plan-feature` 一句指針（長 skill + 薄包裝）、`docs/plans/README.md` 位置表一列、`docs/product-plan.md` 一列、smoke／create-app／`SKILLS` 斷言、鎖步 changeset、變更紀錄與 README 窗口。形狀與 `ae7bc50`（audit-slice）相同，不是新的發佈流程。
- 包含：把本計劃 PR 交出去之前，對**這對**日期檔跑 `pnpm ysk-kit plan --check`。

## 非目標

- 不含：在使用者批准本計劃之前合併本 PR，或實作該 skill。
- 不含：Spec Kit CLI、`specify` init，或在 `docs/plans/` 旁邊放 `.specify/` 樹（memory、constitution、spec、plan）。
- 不含：把 Spec Kit 提示詞、斜線命令或第二套憲法貼進 `AGENTS.md` 或 `sdd-path.md`。
- 不含：`converge-feature`、`analyze-plan`、需求清單。只列為後續。完整路徑可以*具名* converge 為尚未送出。
- 不含：`plan --check` 對未決問題裡的 `TBD`／`待定` 做軟警告。這個詞常常是正確的未解決項目。對每份誠實計劃都響，或為此加 CLI 旗標、說明與測試，不是本切片。Skill 負責叫 agent 去問；不改檢查器。
- 不含：新的 HTTP 路由、Prisma model、envelope 例外、capability、SDK 方法或依賴升級。
- 不含：把程序寫進 `AGENTS.md` 正文、新硬規則，或 always-apply 的 Cursor 規則。只做漸進披露。根目錄加巢狀 `AGENTS.md` 必須維持 ≤ 24 KiB（`tooling/ysk-cli/src/check-agent-guidance.ts` 的 `AGENTS_MD_BUDGET_BYTES`）。
- 不含：php-bridge 的 skill 包裝。該 flavor 仍然略過 agent stub。
- 不含：npm 發佈，以及人手改 `package.json` 版本。之後的 Version Packages PR 才消化 changeset。

## 假設

- 使用者於 2026-11-01 批准本切片（clarify-feature + 精簡／完整路徑文件），並要求先寫計劃。Skill 檔等待批准。
- 在 `origin/main` `c5b89a6`（kit v1.6.6，2026-11-01）量得：名為 `AGENTS.md` 的檔合計 **24269** 位元組。預算 **24576**。餘額 **307**。`AGENTS.zh.md` 不計入（掃描器只配對檔名 `AGENTS.md`）。`.runs` 樹會略過。
- 下面規定的英文增補是 **246** 位元組，大約餘 **61**。實作 PR 改 `AGENTS.md` 之前先重測。若屆時餘額低於 246，先縮短 `### Tool plan modes`（該段已指向 `docs/plans/README.md`）。不要刪硬規則。不要為了「寫清楚一點」加長規定句子，除非同步刪掉同等位元組。
- Spec Kit 公開文件（https://github.github.com/spec-kit/）描述該覆層順序。本計劃不 vendor 該倉，也不把那些文件當成 kit 法律。
- 在本樹 ripgrep：沒有 `specify`、`clarify-feature`、`sdd-path`、`spec-kit` 或 `Spec Kit`。
- `writeAgentStubs`（`tooling/ysk-cli/src/agent-stubs.ts`）會把每個 `templates/agent/skills/<name>/SKILL.md` 複製到 `.agents`、`.claude`、`.cursor`、`.grok`。多一個模板目錄就夠 dest 產品使用。本倉仍要提交 `.agents` 與 `.claude` 副本，因為 `docs-pair` 與 `check agent` 會拿它們跟模板比。
- 下一次發佈是每個公開套件的 **patch**（套件清單與 `ae7bc50` 的 `.changeset/audit-slice.md` 相同），所以 Version Packages 會把 1.6.6 推到 1.6.7，除非先有另一份 changeset。Skill PR 不要把 1.6.7 寫進 `package.json`。
- 香港繁體中文配對保持同等深度。任何 `docs/**/*.md` 沒有 `.zh.md` 兄弟檔，`docs-pair` 會失敗，包括 `sdd-path.md`。

## 受影響的 flavor／preset／capability

| 軸 | 值 | 備註 |
|---|---|---|
| Flavor | kit 本身，然後經 create-app／upgrade 到工作區 flavor | php-bridge 不收 skill 包裝 |
| Preset | thin／full | 澄清時不要假設 thin 有 llm、team、billing 或 push |
| Capabilities | 只引用 | 問題可以問適用哪一個目錄 capability。不要發明目錄名稱 |

## 現況與重用

現在沒有澄清 skill，也沒有路徑卡。計劃協議已經要求：先探索、未核實的事實放進假設或未決問題、不要猜測、批准前不要實作，`plan --check` 會拒絕缺少或仍是佔位的 `##` 標題（`tooling/ysk-cli/src/plan.ts`）。允許的短章節正文只有 `none`、`n/a`、`nil`、`no`、`沒有`、`不適用`（可加句號）。所以 `TBD` 項目是合法內容，檢查器警告是行為變更，不是一行小改。

`check agent` 的 skill-drift（`check-agent-guidance.ts`）會載入模板目錄裡的每個 skill 名，以及磁碟上存在的 `AGENT_SKILL_TREES`。這份 checkout 沒有 `.cursor/skills` 與 `.grok/skills`。實作者若在本機建了這兩個目錄，內容必須與模板一致，否則 `check agent` 失敗。不要提交它們。

### 順序裡已有的部分

| 需要 | kit 已有 | 缺口 |
|---|---|---|
| 法律 | `AGENTS.md` 計劃協議、硬規則、完成定義 | 不要加第二套憲法 |
| 寫計劃 | `plan-feature`、`_template.md`、`pnpm ysk-kit plan`、`plan --check` | 未決問題非空時沒有停 |
| 實作 | `add-module`、`add-capability`、`envelope-api`、`contract-change`、`db-migration`、`ui-design`、`layout-system`，以及 `docs/skills/index.md` 的其他列 | 路徑卡沒有寫出這條序列 |
| 證明 | `verify-change` | 兩條路徑的終點仍是它 |
| 法律 + 計劃審查 | `review-change` | 精簡與完整都在這裡結束 |
| Staff／QA | `audit-slice` | 可選，使用者要求才跑，不是預設步驟 |
| 工具計劃模式 | `docs/plans/README.md` | 埋住了；沒有精簡／完整提示 |
| Dest 產品安裝 | `writeAgentStubs`，upgrade 允許清單含 `docs/skills`、`docs/plans`、`.agents` | 新 skill 必須是模板目錄加已提交的鏡像 |

### 要重用的檔（不要重寫）

| 路徑 | 符號 | 重用為 |
|---|---|---|
| `docs/skills/plan-feature.md` | 步驟、批准閘 | 加一句：未決問題非空 → 先 `clarify-feature` 才請求批准 |
| `tooling/ysk-cli/templates/agent/skills/plan-feature/SKILL.md` | 短包裝 | 第 3 步同一句；保留 YAML 的 `Use when`／`Do not` |
| `docs/skills/supply-scan.md`／`audit-slice.md` | YAML + 觸發／不要用於／輸入／步驟／輸出 | `clarify-feature` 的形狀 |
| `tooling/ysk-cli/templates/agent/skills/audit-slice/SKILL.md` | 薄包裝 | 澄清包裝的形狀（description ≤1024 字元，`skill-triggers.test.ts`） |
| `tooling/ysk-cli/src/docs-pair.test.ts` | `SKILLS` | 加上 `'clarify-feature'` |
| `tooling/ysk-cli/src/agent-stubs.ts` | `writeAgentStubs`、`AGENT_SKILL_TREES` | 不改程式 |
| `tooling/ysk-cli/src/upgrade.ts` | `UPGRADE_PATHS` | 不改程式 |
| `.github/workflows/ci.yml` | thin-smoke `test -f` | 多一個 skill 路徑 |
| `.github/scripts/flavor-smoke.sh` | agent 檔迴圈 | 多一個 skill 路徑；php-bridge 仍略過 |
| `tooling/create-ysk-app/src/index.test.ts` | full + thin 期望 skill 存在；php-bridge 期望不存在 | 與 `audit-slice` 相同的三個斷言 |
| `tooling/ysk-cli/src/agent-stubs.test.ts` | `existsSync` audit-slice | 多一行 |
| `tooling/ysk-cli/src/upgrade.test.ts` | `existsSync` audit-slice | 多一行 |
| `docs/plans/README.md` | 位置表 | `sdd-path.md` 一列（不是日期計劃；不要對它 `plan --check`） |
| `docs/product-plan.md` | 「今天可以做的事」 | 一列，與切片審計同等重量 |
| `docs/history.md` | 版本一行 | 變更紀錄的版本號確定時才寫 |
| `ae7bc50:.changeset/audit-slice.md` | 鎖步 patch 清單 | 複製套件清單；改摘要句 |

### 規定的 `AGENTS.md` 位元組（實作 PR）

只追加這些，該 PR 不要再加其他英文 `AGENTS.md` 位元組。

漸進披露，緊接在「計劃功能」那一列之後：

```markdown
| Clarify open questions | [clarify-feature](docs/skills/clarify-feature.md) |
| Lean / full path | [sdd-path](docs/plans/sdd-path.md) |
```

這兩行含結尾換行是 **79 + 58 = 137** 位元組。

批准閘段落：用一個前導空格接上這句，不要多空一行（**109** 位元組）：

```text
 Unresolved Open questions: [clarify-feature](docs/skills/clarify-feature.md) (at most five) before approval.
```

合計 **246**。在 `c5b89a6` 上的剩餘餘額是 **61**。`AGENTS.zh.md`（不計入預算）用同一意思：

```markdown
| 澄清未決問題 | [clarify-feature](docs/skills/clarify-feature.zh.md) |
| 精簡／完整路徑 | [sdd-path](docs/plans/sdd-path.zh.md) |
```

計劃協議句子（中文），同一段、前導空格：

```text
 未決問題仍有未解決項目時，批准前先跟隨 [clarify-feature](docs/skills/clarify-feature.zh.md)（最多五題）。
```

若重測顯示餘額低於 246，刪掉 `### Tool plan modes` 裡的這句英文，以及中文配對裡的對應句（README 已經列出每個工具）：

```text
Grok Build writes `~/.grok/sessions/<cwd>/<session-id>/plan.md`; Cursor, Claude Code, Codex, OpenCode, and Copilot each have their own plan surface. 
```

保留「原生計劃只是草稿」以及「獲准紀錄是 `pnpm ysk-kit plan <slug>`」這兩句。

## 考慮過的方案

| 方案 | 複雜度 | 分層 | 遷移 | 客戶端 | 備註 |
|---|---|---|---|---|---|
| A. Vendor Spec Kit CLI，並在 `docs/plans/` 旁放 `.specify/` | 高 | 文件 + 第二個 CLI + 第二個計劃庫 | 雙份紀錄 | agent 開到哪份檔就跟哪份 | 第二套憲法。**否決** |
| B. 只把澄清折進 `plan-feature`，精簡／完整寫成 `docs/plans/README.md` 的一節 | 低 | 兩份既有文件 | 無 | 每次 plan-feature 都跑 | 精簡路徑變成訪談。路徑仍在 agent 已經錯過的檔裡。**否決為歸宿** |
| C. 新 skill `clarify-feature` + `docs/plans/sdd-path.md` + AGENTS 兩列 + 協議一句 | 中 | 文件 + 包裝 + smoke 清單 | 無 | 經 create-app／upgrade 到 dest 產品 | 觸發保持有條件。與 `supply-scan`／`audit-slice` 相同。**選定** |
| D. Always-apply 的 Cursor 規則，或把 Spec Kit 澄清提示貼進 `AGENTS.md` | 寫起來低、住下去高 | `AGENTS.md` 或 `.cursor/rules` | 無 | 只有 Cursor，或每一則對話 | 吃掉 307 位元組餘額。只放 Cursor 規則時 Claude 與 Grok 的 dest 產品看不到。**否決** |

**選定：** C（現在寫本計劃；skill 與路徑卡在批准之後才做）。  
**原因：** 澄清是閘，不是重寫 `plan-feature`。未決問題已經是空的時候，精簡路徑必須保持短。路徑卡才是可複製的表面。包裝用 `audit-slice` 的同一條路到達 dest 產品。A 與 D 拆開或膨脹法律。B 再把路徑藏起來，並強迫不需要提問的工作也要問。

## 合約先行

沒有 DTO、command、error code 或 ts-rest 路徑。合約是 skill 觸發、五條問題幹，以及路徑卡。

| 項目 | 名稱／路徑 | 備註 |
|---|---|---|
| DTO | 沒有 | 只改文件 |
| Command | 沒有 | 本切片不要加 `ysk-kit clarify` 子命令 |
| Error codes | 重用既有代碼 | 問題可以點名 `UNAUTHENTICATED`、`FORBIDDEN`、`NOT_FOUND`、`VALIDATION_FAILED`。不要發明代碼 |
| 路徑 | 沒有 | |

### Skill 合約（批准後才實作）

**名稱：** `clarify-feature`  
**包裝：** YAML `name` + `description`（≤1024 字元）。description 必須含 `Use when` 與 `Do not`（`skill-triggers.test.ts`）。中文觸發：澄清、釐清、未決問題、批准前。指向 `docs/skills/clarify-feature.md` 與 `AGENTS.md`。正文保持短步驟，重量與 `supply-scan`／`audit-slice` 包裝相同。

建議 description（實作者可以收緊，不可以拿掉 `Use when`／`Do not`／資料夾名）：

```yaml
name: clarify-feature
description: >
  Ask at most five kit-native questions and fold the answers into the dated
  YSK Kit plan (Assumptions, Scope, Open questions) before approval.
  Use when Open questions are non-empty, the user asks to clarify, 澄清, 釐清,
  or /clarify-feature.
  中文：澄清、釐清、未決問題、批准前。
  Do not use to implement, to vendor Spec Kit or .specify/, or when Open
  questions are already empty.
```

**觸發**

- 使用者要求澄清、釐清，或 `/clarify-feature`。
- 日期計劃存在，且未決問題至少有一條未解決項目（不是 `none`／`n/a`／`沒有`／`不適用`）。
- Agent 正要請求批准或開始實作，而那些項目仍非空。

**不要用於**

- 計劃協議說可略過的工作（錯字、只改註解、單檔重新命名）。
- 未決問題是空的，或是允許的短「沒有」。
- 使用者豁免批准閘，或說自行決定並繼續。把決定寫進假設。不要再問。
- 工作是實作、`review-change`、`audit-slice` 或 `security-review`。本 skill 只問。它不審查 diff，也不批准新的 envelope 例外。
- 建立 `.specify/`、跑 Spec Kit，或加第二套憲法。

**輸入**

| 輸入 | 必須 | 備註 |
|---|---|---|
| 日期計劃配對 | 是 | `docs/plans/<yyyy-mm-dd>-<slug>.md` 與 `.zh.md` |
| 哪些項目仍開放 | 是 | 先讀。計劃已經回答的不要再問 |
| Flavor／preset | 有 `.ysk-kit.json` 時 | thin：不要假設 llm／team／billing／push |

**問題幹（最多五題，一輪）**

只問計劃尚未回答的幹。到五題就停。還有缺口就留在未決問題。除非使用者要求，不要開第二輪。不要問行業領域問題（那些屬於產品倉，不屬於本 kit）。

1. **授權。** 哪個角色或權限可以呼叫？擁有者還是任何已登入使用者？另一作者的結果是 `FORBIDDEN` 還是 `NOT_FOUND`？
2. **租戶。** 以組織為範圍還是全域？跨租戶：`NOT_FOUND` 或空白頁，不要洩漏一列。flavor 沒有組織（沒有 team 的 thin、php-bridge、static-web3）且計劃不是在加 team 時，略過。
3. **Envelope。** 維持 `{ ok: true, data }`／`{ ok: false, error }`，還是使用者要求例外（SSE、PDF、webhook 確認）？預設：不加新例外。答「要」並不批准例外；把請求寫進未決問題，留給使用者。
4. **Flavor／preset／capability。** 哪個 flavor、thin 還是 full、切片可以假設哪些目錄 capability。一題，不要整份菜單。
5. **UI 表面。** 只做 API，還是 web／admin／mobile／desktop 的哪幾個。若有 UI，寫出畫面名稱。不要在這裡設計（`ui-design`／`layout-system` 在批准之後）。

**折入**

同一輪改英文日期計劃與中文配對。把已解決的項目從未決問題移到假設；若改變切片，也改範圍／非目標。不要開始合約、模組、Prisma 或客戶端。對兩份日期檔再跑 `pnpm ysk-kit plan --check`。

**輸出**

```md
## Clarify — docs/plans/<date>-<slug>.md
Asked: <n> (max 5)
Still open: <bullets or none>
Updated: Assumptions | Scope | Non-goals | Open questions (EN + zh)
Gate: still waiting for approval
Next: plan-feature fill | user approves plan
```

### 路徑卡合約（批准後才實作）

`docs/plans/sdd-path.md` + `.zh.md`。不是日期功能計劃。不要對它跑 `plan --check`（標題不會符合 `_template.md`）。`docs-pair` 仍然要求兄弟檔。

法律段：`AGENTS.md` 是唯一憲法。本檔是路徑卡。不要建立 `.specify/`。不要貼 Spec Kit。

| 路徑 | 何時用 | 序列 |
|---|---|---|
| 精簡 | 未決問題是空的，或使用者已經決定五條幹 | `plan-feature` → 計劃點名的實作 skill → `verify-change` → `review-change` |
| 完整 | 未決問題非空，或使用者要求澄清 | `clarify-feature` → `plan-feature` → 同一批實作 skill → `verify-change` →（converge：**尚未送出**，後續）→ 只有使用者要求時才 `audit-slice` |

實作 skill 是既有 index，不是新的 `implement` skill：`add-module`、`add-capability`、`envelope-api`、`contract-change`、`db-migration`、`ui-design`、`layout-system`，以及計劃任務清單點名的其他列。

可複製提示：**一份共用提示**，再加每工具一行，避免 Cursor／Claude／Grok 漂成三套憲法。

共用：

```text
Follow docs/plans/sdd-path.md.
Law: AGENTS.md. Do not create .specify/ and do not paste Spec Kit.
Lean: write docs/plans/<yyyy-mm-dd>-<slug>.md from docs/plans/_template.md and the Chinese pair. pnpm ysk-kit plan --check both files. Stop for my approval. After I approve, implement only the plan checklist, then verify-change, then review-change.
Full: if Open questions are non-empty, run clarify-feature first (at most five questions) and fold the answers into both plan files. Then the lean steps.
Do not add converge-feature, analyze-plan, or a requirements checklist.
```

該提示下面的工具行：

- **Cursor。** Plan mode 可能寫 `.cursor/plans/`。抄進日期檔。`.cursor/plans/` 不是紀錄。
- **Claude Code。** 日期檔獲准之前留在 plan 權限模式。
- **Grok Build。** 工作階段 `~/.grok/sessions/…/plan.md` 是草稿。抄進日期模板。`grok inspect` 列出規則；它不取代 `plan --check`。

`docs/plans/README.md` 位置表加一列：`sdd-path.md`／`sdd-path.zh.md` — 精簡與完整路徑卡，不是功能計劃。該 README 既有的 `/plan` 提示保留。不要分叉第二份模板。

`plan-feature` 長 skill，在「填滿每個章節」那步之後：若未決問題仍有未解決項目，先跟隨 `clarify-feature`，才請求批准。包裝第 3 步加上同一句，結尾仍是 `plan --check` 並等待批准。三份包裝副本保持一致（模板、`.agents`、`.claude`）。

## 資料模型／Prisma 與遷移

沒有。沒有 Prisma model、欄位、關聯或遷移。不要跑 `pnpm db:migrate`。

## 模組切片與分層

不改 `apps/api/src/modules/*`。domain 與 application 不動。不要人手建模組目錄。不要改 `.dependency-cruiser.cjs`。

## SDK／web-sdk／客戶端表面

沒有執行期客戶端程式。不要 raw `fetch`。客戶端不要 Prisma。若獲准的計劃含畫面，路徑卡可以點名 `ui-design` 為之後的步驟。本切片不加畫面。

## Jobs／mail／realtime／notifications

沒有。沒有隊列、郵件模板、socket 事件或站內通知。

## 安全與私隱

本 skill 可以問授權與租戶兩條幹。它不可以削弱授權、速率限制或密鑰日誌規則。不可以把 OTP、JWT、Stripe `sk_` 或 webhook 密鑰寫進日誌。不可以寫 exploit 步驟。想要新 envelope 例外的答案留在未決問題；那不是批准。威脅模型仍走 [security-review](../skills/security-review.zh.md)。入站 webhook 仍走 [webhook-handling](../skills/webhook-handling.zh.md)。桌面 main／preload 仍走 [desktop-electron](../skills/desktop-electron.zh.md)。

## 測試計劃

本計劃 PR 不加產品行為，也不加新測試。實作 PR 加 docs-pair 與檔案存在斷言，不是 memory-repo 或 HTTP 案例。

### 變更

先寫下，之後才送出：有條件的澄清 skill，以及精簡／完整路徑卡，並且不另立憲法。

### 風險

1. `AGENTS.md` 超過 24 KiB（量得餘額 307；規定增補 246）。
2. Agent 把澄清當成可以實作，或當成可以 vendor Spec Kit。
3. 精簡路徑每次都問五題（觸發寫得太寬）。
4. 模板／`.agents`／`.claude` 包裝漂移。
5. 有人對 `sdd-path.md` 跑 `plan --check`，把失敗當成計劃壞了。
6. 答案只寫進英文計劃。

### 分層對應

| 風險 | 分層 | 檔案 |
|---|---|---|
| 缺文件配對 | docs-pair | `tooling/ysk-cli/src/docs-pair.test.ts`（`SKILLS` 含 `clarify-feature`；既有掃描會要求 `sdd-path.md` 有 `.zh.md` 兄弟檔） |
| 包裝漂移 | check agent | 模板對 `.agents` 對 `.claude` |
| 合約被沖淡 | docs-pair | 新斷言：兩種語言都寫最多五題，並且不要建立 `.specify/` |
| Dest 產品缺 stub | create-app／CI | `index.test.ts`、thin-smoke、`flavor-smoke.sh` |
| php-bridge 收到 skill | create-app | 既有 php-bridge 測試，加上 `clarify-feature` 不存在 |

### 案例

1. **配對與包裝存在** — 層：docs-pair。given skill 名 `clarify-feature`／when 跑 docs-pair 測試／then 英文 skill、中文配對、模板、`.agents` 與 `.claude` 副本都存在、內容一致，且提及 `AGENTS.md`。
2. **thin dest 收到包裝；php-bridge 不收** — 層：create-app。given `create-ysk-app` saas thin／when 寫出 dest／then `.agents/skills/clarify-feature/SKILL.md` 存在。given php-bridge／then 該檔不存在。
3. **skill 正文守住上限** — 層：文件。given `clarify-feature.md` 與中文配對／when grep／then 兩者都寫最多五題（中文：最多五），且兩者都寫不要建立 `.specify/`。
4. **路徑卡寫出兩條序列** — 層：文件。given `sdd-path.md` 與中文配對／when grep／then 精簡點名 `plan-feature`、`verify-change`、`review-change`；完整在 `plan-feature` 之前點名 `clarify-feature`；converge 標成尚未送出；禁止 `.specify/`。

### 夾具

- 既有 `SKILLS` 陣列、flavor-smoke 路徑清單、create-app dest 目錄。
- 不用 Redis、Stripe、Playwright 或網路。

### 不涵蓋

- Memory-repo 服務案例、envelope HTTP、授權整合測試、e2e。
- 在本計劃 PR 實作 skill。
- `plan --check` 對 `TBD` 發出警告的單元測試（已延後）。

## 驗證命令

本計劃 PR 只有這兩份日期檔。

| 命令 | 預期結果 |
|---|---|
| `pnpm ysk-kit plan --check docs/plans/2026-11-01-clarify-feature-sdd-path.md` | 印出 `ysk-kit plan --check: ok` |
| `pnpm ysk-kit plan --check docs/plans/2026-11-01-clarify-feature-sdd-path.zh.md` | 印出 `ysk-kit plan --check: ok` |
| `pnpm ysk-kit check agent` | 印出 `ysk-kit check agent: ok`（預算不變；尚未有新包裝） |

實作 PR（批准後）另加：

| 命令 | 預期結果 |
|---|---|
| `pnpm layers` | 退出碼 0；執行期圖不變 |
| `pnpm typecheck` | 退出碼 0 |
| `pnpm test` | 退出碼 0，含 docs-pair、skill-triggers、agent-stubs、upgrade、create-app |
| `pnpm gen:openapi` | `docs/openapi.yaml` 不變 |
| `pnpm ysk-kit check agent` | 規定的 AGENTS 編輯之後印出 `ysk-kit check agent: ok` |
| `pnpm ysk-kit check errors` | 印出 `ysk-kit check errors: ok` |

不要跑 `pnpm e2e`（沒有登入或 shell 改動）。不要對 `docs/plans/sdd-path.md` 跑 `plan --check`。可選：`pnpm lint`。Grok Build 上 `grok inspect` 列出已載入規則；它不取代 `plan --check`。

### 人手檢查

本 PR 沒有 UI、HTTP 或授權行為變更。本建議的人手審查就是閘。

- [ ] UI 流程：不適用
- [ ] Envelope 形狀：不適用
- [ ] 授權角色：不適用
- [ ] 使用者接受或否決方案 C、五條問題幹、246 位元組的 AGENTS 文字，以及延後 `plan --check` 的 TBD 警告

## 文件／變更紀錄／changeset

- [ ] 這對計劃是研究紀錄。本 PR 沒有變更紀錄。
- [ ] 批准後：skill 配對、路徑卡配對、index 配對、`plan-feature` 配對、plans README 配對、product-plan 配對、history 配對、AGENTS 配對（規定位元組）。
- [ ] 批准後：`.changeset/clarify-feature-sdd-path.md`，patch 套件清單與 `ae7bc50:.changeset/audit-slice.md` 相同。摘要：加入 clarify-feature 與精簡／完整 SDD 路徑卡（沒有 Spec Kit CLI，沒有 `.specify/`）。
- [ ] Skill 送出時才移動根目錄 `CHANGELOG.md`／`CHANGELOG.zh.md` 與 README 最近三個版本窗口。只從 README 窗口拿掉最舊一則；完整變更紀錄仍保留它。不要在這裡改 `package.json` 版本。
- [ ] 不要加依賴升級一節。

## 風險與回滾

| 風險 | 為何有害 | 緩解 |
|---|---|---|
| 1. AGENTS 超過 24 KiB | `check agent` 讓 kit 與每個複製 `AGENTS.md` 的升級產品失敗 | 規定 246 位元組；先重測；只有需要時才削 Tool plan modes |
| 2. 第二套憲法或 `.specify/` | Agent 改錯計劃 | Skill 與路徑卡禁止；docs-pair 斷言 |
| 3. 澄清永遠開啟 | 精簡修復變成訪談 | 觸發是未決問題非空，或使用者明確要求 |
| 4. 超過五題 | Spec Kit 式迴圈 | 一輪、上限五、其餘留在未決問題 |
| 5. 把猜測寫進假設 | 違反計劃協議 | 只折入使用者的答案；豁免閘要寫「使用者說自行決定」 |
| 6. 只改英文 | 中文計劃漂移 | 同一輪編輯；輸出行寫 EN + zh |
| 7. 包裝漂移 | `check agent`／thin-smoke 變紅 | 三份已提交副本 + 測試，清單與 audit-slice 相同 |
| 8. 對 `sdd-path.md` 跑 `plan --check` | 假失敗 | 路徑卡寫明它不是日期計劃；README 那列同樣寫明 |
| 9. 仍然送出 TBD 警告 | 誠實計劃看起來不乾淨 | 明文非目標 |
| 10. php-bridge 出現 skill | 該 flavor 沒有 agent 樹 | 測試維持 `existsSync` 為 false |
| 11. 計劃 PR 寫了變更紀錄 | 看起來像要發佈 | 本 PR 只有計劃檔 |
| 12. 澄清裡批准了新 envelope 例外 | 繞過「envelope 例外要先問」 | 「要」留在未決問題 |

回滾本 PR：還原計劃 commit。之後的 skill PR：還原 skill 檔、`SKILLS`、smoke 行、AGENTS 列、路徑卡與 changeset。dest 產品上的 `ysk-kit upgrade` 會還原先前的包裝。

## 任務清單

按順序。第 0 步是本計劃 PR。第 1–6 步是批准後的實作 PR。

0. [x] 研究紀錄（本檔）
   - **檔案：** `docs/plans/2026-11-01-clarify-feature-sdd-path.md`、`docs/plans/2026-11-01-clarify-feature-sdd-path.zh.md`
   - **介面／合約／資料：** 沒有
   - **風險：** `plan --check` 標題
   - **回滾：** 還原 commit
   - **驗收：** 兩條 `--check` 都印出 ok；狀態為 draft — 等待使用者批准；沒有 skill 檔；沒有 changeset

1. [ ] Skill 合約
   - **檔案：** `docs/skills/clarify-feature.md`、`docs/skills/clarify-feature.zh.md`
   - **介面／合約／資料：** 沒有（沒有 DTO）。觸發、不要用於、五條幹、折入規則、輸出塊按「合約先行」所寫
   - **風險：** 訪談太寬；貼上 Spec Kit
   - **回滾：** 刪掉這對檔
   - **驗收：** 最多五題；幹是授權、租戶、envelope、flavor／preset、UI 表面；禁止 `.specify/`；沒有 TypeScript `enum`

2. [ ] 包裝與接線
   - **檔案：** `tooling/ysk-cli/templates/agent/skills/clarify-feature/SKILL.md`；`.agents/skills/clarify-feature/SKILL.md`；`.claude/skills/clarify-feature/SKILL.md`；`plan-feature` 包裝一行改動的同樣三棵樹；`docs-pair.test.ts` 的 `SKILLS`；`agent-stubs.test.ts`；`upgrade.test.ts`；`tooling/create-ysk-app/src/index.test.ts`（full 與 thin 為 true，php-bridge 為 false）；`.github/workflows/ci.yml`；`.github/scripts/flavor-smoke.sh`
   - **介面／合約／資料：** 沒有
   - **風險：** skill-drift；description 超過 1024 或缺少 `Use when`／`Do not`
   - **回滾：** 從清單移除名稱並刪除目錄
   - **驗收：** 三份已提交副本逐位元組相同；`skill-triggers` 通過；thin dest 有包裝；php-bridge 沒有；不提交 `.cursor/skills` 或 `.grok/skills`

3. [ ] 路徑卡與 AGENTS 以外的指針
   - **檔案：** `docs/plans/sdd-path.md`、`docs/plans/sdd-path.zh.md`；`docs/plans/README.md`、`docs/plans/README.zh.md`（位置表一列）；`docs/skills/index.md`、`docs/skills/index.zh.md`；`docs/skills/plan-feature.md`、`docs/skills/plan-feature.zh.md`；`docs/product-plan.md`、`docs/product-plan.zh.md`
   - **介面／合約／資料：** 沒有
   - **風險：** 三份提示漂掉；把 `sdd-path` 寫成假的功能計劃
   - **回滾：** 刪掉路徑卡並還原那些列
   - **驗收：** 一份共用提示加三行工具說明；精簡與完整序列與本計劃一致；converge 標成尚未送出；不要把該檔傳給 `plan --check`

4. [ ] AGENTS 列
   - **檔案：** `AGENTS.md`、`AGENTS.zh.md`
   - **介面／合約／資料：** 沒有
   - **風險：** 24 KiB 預算（規定 246 位元組；先重測）
   - **回滾：** 還原三處英文插入與中文配對
   - **驗收：** 使用「現況與重用」的英文字串，或更短但仍連結兩份文件的裁剪；`pnpm ysk-kit check agent` ok；沒有新硬規則，也沒有貼 Spec Kit

5. [ ] 驗證
   - **檔案：** 沒有額外檔案
   - **介面／合約／資料：** 沒有
   - **風險：** smoke 清單漏了某個 `audit-slice` 鄰項
   - **回滾：** 還原實作 PR
   - **驗收：** `pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent && pnpm ysk-kit check errors` 全綠；OpenAPI 不變；上面四個文件案例通過

6. [ ] 文件／變更紀錄／changeset
   - **檔案：** `CHANGELOG.md`、`CHANGELOG.zh.md`、`README.md`、`README.zh.md`、`docs/history.md`、`docs/history.zh.md`、`.changeset/clarify-feature-sdd-path.md`
   - **介面／合約／資料：** 沒有
   - **風險：** 人手改版本號；README 窗口從完整變更紀錄刪掉一個版本
   - **回滾：** 還原這些檔
   - **驗收：** 中英深度一致；changeset patch 清單與 audit-slice 相同；本 PR 不改 `package.json` 版本；沒有依賴升級

## 未決問題

這裡沒有會擋住方案 C 的項目。不要用猜測填滿。

- 本計劃的批准就是閘。在使用者接受方案 C、五條問題幹、規定的 AGENTS 位元組，以及延後 `plan --check` TBD 警告之前，不要加 skill 檔。
- 後續，不是實作 PR 的問題：`converge-feature`、`analyze-plan`、需求清單，以及 `plan --check` 對 `TBD`／`待定` 的軟警告。
- 若 main 上之後的 `AGENTS.md` 編輯把餘額壓到 246 位元組以下，使用「現況與重用」裡的 Tool plan modes 裁剪。除非那句已經不在，否則不要另發明一種裁法。
