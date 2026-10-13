# 計劃：Create App Guided Wizard

Language: 英文配對 `2026-10-13-create-app-guided-wizard.md` · 中文 `2026-10-13-create-app-guided-wizard.zh.md`

| | |
|---|---|
| **Slug** | `create-app-guided-wizard` |
| **日期** | 2026-10-13 |
| **狀態** | draft — waiting for user approval |
| **正規檔** | `docs/plans/2026-10-13-create-app-guided-wizard.md` |
| **工作階段指針** | `/plan.md`（已 gitignore） |
| **Gate** | waiting for user |

法律：[AGENTS.zh.md](../../AGENTS.zh.md)。程序：[plan-feature](../skills/plan-feature.zh.md)。檢查：`pnpm ysk-kit plan --check docs/plans/2026-10-13-create-app-guided-wizard.zh.md`。此 PR **只含計劃**。使用者批准本檔之前，不要實作 `create-ysk-app`。

## 目標與使用者問題

互動式 `create-ysk-app` 必須用專業的引導式精靈，讓開發者按 **適用於／避免何時／權衡** 選擇 flavor、preset、資料庫與表面，並在**任何磁碟寫入之前**確認摘要。

今天 `tooling/create-ysk-app/src/prompt.ts` 只問光禿列表：`Flavor (saas, desktop, gateway, php-bridge, trading, static-web3) [saas]:`。對已認識套件的人足夠，對 agent（`--yes`／旗標）也正確。對 TTY 上的人類不夠：六種 flavor 看起來可互換、`php-bridge` 對 TypeScript 沒有說明、Tauri／Flutter／KMP 未標明已延後（ADR 0002），而且沒有確認閘門——答完最後一題就立刻呼叫 `createYskApp` 複製一棵樹。

未來實作（不是本 PR）完成後：TTY 執行會走編號決策層、在語言／客戶端邊界教育、按 flavor 跳過不適用層、印出摘要，使用者對 Proceed 答 `no` 則不建立就退出。`--yes` 與非 TTY 繼續對旗標／預設保持沉默。旗標解析、複製行為、flavor／preset／db 目錄不變。

## 範圍

- 包含：在使用者批准之前，只提交此日期計劃配對。狀態維持 **draft — waiting for user approval**。Gate：waiting for user。
- 包含（批准後、未來 commit）：把 `tooling/create-ysk-app/src/prompt.ts` 的 TTY 提問改成編號多步精靈，附豐富文案（適用於、避免何時、權衡）以及寫入前確認閘門。
- 包含（未來）：保留 `AskFn` 注入，讓 Vitest 可用腳本答案（`prompt.test.ts` 模式）。
- 包含（未來）：跳過所選 flavor 不用的層（`PRESET_SKIP` 涵蓋 `php-bridge`／`static-web3`；admin／mobile 只問 `saas`；尊重 `parsed.explicit.*`，已傳 CLI 旗標不再問）。
- 包含（未來）：flavor 確定後印出語言／客戶端邊界說明：預設堆疊是 TypeScript；`php-bridge` 是 OpenAPI + PHP／TS 客戶端 flavor；Tauri／Flutter／KMP **已延後**（[ADR 0002](../adr/0002-polyglot-clients.zh.md)）——只教育，不搭那些樹。
- 包含（未來）：確認摘要 + Proceed yes／no；`no` 不呼叫 `createYskApp`（沒有 dest 目錄、沒有複製）。
- 包含（未來）：`--yes`／`-y` 以及非 TTY（`stdin`／`stdout` 不是 TTY）永不提問，包括不問確認；只用旗標加預設，與今天完全相同。
- 包含（未來）：`help.ts` 與 `docs/cli/create-ysk-app.md` + `.zh.md` 提到引導式精靈；`docs/guides/flavors.zh.md` 的「客戶端語言選擇」仍是文案真相來源（精靈轉述，不發明第七種 flavor）。
- 包含（未來）：腳本化 `AskFn` 測試：層對應、跳過規則、confirm-no 取消、`--yes`／非 TTY 永不提問。
- 包含（未來）：中英文件深度一致；僅在公開套件行為真正出貨時才寫 changelog／changeset（create-app 是公開套件）。

## 非目標

- 不含：本 PR **不**改 `tooling/create-ysk-app/src/`（沒有 `prompt.ts`、`scaffold.ts`、`help.ts`、`index.ts` 或測試）。只交計劃檔。
- 不含：改 CLI 旗標、`parseArgs`、`FLAVORS`／`PRESETS`／`DBS`、複製／略過樹、thin preset、php-bridge 模板，或 dest 標記 `.ysk-kit.json`。
- 不含：搭 Tauri、Flutter、Kotlin Multiplatform，或第二套 HTTP API。精靈只教育，不加 flavor。
- 不含：HTTP 路徑、Prisma model、ts-rest 路徑、SDK／web-sdk、web／admin／mobile／desktop 畫面、envelope 例外。
- 不含：把行業領域放進本套件（salon、venue、map）。`create-ysk-app` 仍是平台骨架。
- 不含：改 `--yes`／非 TTY 預設（`saas`／`thin`／`mysql`／admin 開／mobile 開）。
- 不含：互動 TUI 函式庫（Ink、inquirer、prompts）。繼續用 `node:readline/promises` + `AskFn`，測試維持腳本字串。
- 不含：改 agent skill `new-product` 去等 TTY。Agent 仍傳旗標與 `--yes`。
- 不含：在目錄外發明 capability。Flavor 不是 capability。
- 不含：超出「TTY 語言」未決問題範圍的套件 i18n。使用者批准後若未要求，本故事不加 locale 旗標。

## 假設

- 精靈的對象是互動人類。Agent 與 CI 已傳 `--yes` 與旗標；該契約不可倒退。
- 精靈文案是 [flavors](../guides/flavors.zh.md)、[create-ysk-app CLI](../cli/create-ysk-app.zh.md)、[capabilities](../guides/capabilities.zh.md)（thin 對 full）與 [ADR 0002](../adr/0002-polyglot-clients.zh.md) 的轉述。若文件與 TTY 字串漂移，以文件為準，再改精靈。
- `PRESET_SKIP`（`php-bridge`、`static-web3`）仍是 preset 與資料庫提問的跳過集合。這些 flavor 在 `ResolvedCreateOptions` 裡仍拿到套件預設（`thin`／`mysql`），因為 `createYskApp` 即使複製時忽略也會驗證它們。
- admin／mobile 問題仍只問 saas。Gateway 一定包含 admin；其他 flavor 本來就略過那些 app。
- Confirm-no 是新行為。今天沒有確認步。實作應把取消做成可測路徑（建議：由 `resolveCreateOptions` 拋出小型 `CreateCancelledError` 或 `Error('create cancelled')`；`index.ts` 捕捉、印一行中止、`process.exit(0)`，永不呼叫 `createYskApp`）。
- 空白 Enter 仍代表已記錄的預設，與今天相同。
- 無效答案仍是三次嘗試後 `unknown <label>`（今天的 `pick`／`pickYesNo`），除非後續任務收緊——第一切片不要求。
- 產品名稱規則維持今天（`pickName`、三次、`product name required`）。dest 非空仍是確認 yes 之後 `createYskApp` 拋錯。
- 根目錄 `plan.md` 已 gitignore；只提交日期配對。
- 未決的 UX 選擇留在未決問題。本計劃不選定 TTY 語言，也不選定「只接受編號 vs 編號加 slug」。

## 受影響的 flavor／preset／capability

| 軸 | 值 | 備註 |
|---|---|---|
| Flavor | 套件本身（create-app CLI UX）+ 全部六種 dest flavor 作為**選單文案** | 不加新 flavor。選單按 `FLAVORS` 順序列 `saas`、`desktop`、`gateway`、`php-bridge`、`trading`、`static-web3`。精靈不額外複製 app。 |
| Preset | thin／full（除非 flavor 在 `PRESET_SKIP` 或 `--preset` 已明示，否則會問） | 文案來自 capabilities 指南：thin 剝走 llm、billing、organizations、devices；full 保留完整示範。 |
| Capabilities | 不加也不刪 | 精靈只解釋 thin 對 full。還原路徑仍是 `ysk-kit add llm\|team\|billing\|push`。 |

此改動不掛載、不卸載 capability。未來精靈跑完後的 dest 產品，仍是 `createYskApp` 今天已寫出的那些樹。

## 現況與重用

已探索 `tooling/create-ysk-app/`、`docs/guides/flavors.md`、`docs/adr/0002-polyglot-clients.md`、`docs/recipes/php-openapi-client.md`、`docs/cli/create-ysk-app.md`、`docs/skills/new-product.md`。優先重用，不另寫一套。

| 路徑 | 符號 | 重用為 |
|---|---|---|
| `tooling/create-ysk-app/src/prompt.ts` | `AskFn`、`ResolvedCreateOptions`、`resolveCreateOptions`、`withReadlineAsk`、`PRESET_SKIP`、`pick`／`pickYesNo`／`pickName` | **主要未來改檔。** 保留 `AskFn` 與 tty／`--yes` 提早返回。把光禿 `pick('Flavor', FLAVORS, 'saas')` 換成編號層 + 文案 + 確認。 |
| `tooling/create-ysk-app/src/scaffold.ts` | `FLAVORS`、`PRESETS`、`DBS`、`ParsedArgs.explicit.*`、`parseArgs`、`createYskApp` | **不改目錄或複製。** 精靈讀同一組陣列與 `explicit` 旗標。磁碟寫入仍在確認 yes 之後由 `createYskApp` 負責。 |
| `tooling/create-ysk-app/src/help.ts` | `HELP` | 未來：TTY 提到引導式精靈；旗標表與 `--yes` 永不提問維持原意。 |
| `tooling/create-ysk-app/src/index.ts` | `main` | 未來：捕捉確認取消；只在已解析選項之後呼叫 `createYskApp`。 |
| `tooling/create-ysk-app/src/prompt.test.ts` | `scriptedAsk`、`resolveCreateOptions` 案例 | **延伸。** 保留 `--yes`／非 TTY／明示旗標／php-bridge 跳過；加編號對應、語言說明出現、confirm-no。 |
| `tooling/create-ysk-app/src/index.test.ts` | HELP 斷言、`--help` | 未來：`HELP` 含精靈用詞；不為 TTY 新增 process-spawn（繼續 `AskFn`）。 |
| `docs/guides/flavors.md`「Client language choice」／`flavors.zh.md`「客戶端語言選擇」 | 需要／選擇／不要表 | 精靈 flavor 與語言邊界文案的來源。 |
| `docs/adr/0002-polyglot-clients.md` | 決定：OpenAPI + envelope；延後 Tauri／Flutter／KMP | 語言層只教育；不授權那些樹。 |
| `docs/recipes/php-openapi-client.md` | php-bridge 輸出清單 | php-bridge 適用於／避免何時。 |
| `docs/cli/create-ysk-app.md` + `.zh.md` | 互動一節 | 未來文件：精靈 + 確認；`--yes` 不變。 |
| `docs/skills/new-product.md` | 「Agent 傳旗標。不要等 TTY。」 | 保留。精靈給人類；agent 仍 `--yes`。 |
| `docs/guides/capabilities.md` | Thin 對 full 剝離表 | Preset 層文案。 |

沒有 `ysk-kit add module`。不加 `apps/api/src/modules/` 切片。不改 contracts 套件。

## 考慮過的方案

至少兩個可行做法。權衡：UX、測試面、TTY 字串 i18n、維護。

| 方案 | 複雜度 | 分層 | 遷移 | 客戶端 | 備註 |
|---|---|---|---|---|---|
| **A — 編號多步精靈 + 豐富文案 + 確認閘門** | 中（prompt.ts + 測試 + help／文件）。沒有 HTTP／Prisma。 | 只動 create-app CLI | 無（沒有 DB）。行為新增：confirm-no 中止 | 無（沒有 SDK／UI） | 編號選單、適用於／避免何時、語言說明、Proceed yes／no。`--yes`／非 TTY 不變。更多 TTY 字串要與 flavors.md 同步。 |
| **B — 維持光禿提問；只擴 `--help`／文件** | 低（help.ts + Markdown） | 文件 + HELP | 無 | 無 | 從不打開文件的人類仍只見 `Flavor (saas, …) [saas]:`。沒有確認閘門。i18n／維護最低。不能解決使用者問題。 |

**選定：** A。

**原因：** 失敗點是 TTY 路徑，不是缺少 `--help`。`help.ts` 已一行列出 flavor；`docs/guides/flavors.md` 已有適用表。互動執行 `pnpm create @ysk-kit/app` 的開發者不會先看到那些檔。確認閘門是唯一能阻止錯樹複製的方法（`createYskApp` 在提問結束後立刻寫入）。方案 B 若不改 `prompt.ts` 就加不了閘門，所以「只改文件」不是 A 的半套——它留下磁碟寫入陷阱。A 的測試成本有界：既有 `scriptedAsk` 模式可覆蓋對應與取消，無須真 TTY。i18n 成本真實，已列未決問題；不足以改選 B。維護：flavors.md 變更時要審精靈字串——可接受，因為 create-app 已在三處記錄 flavor（HELP、CLI 手冊、flavors 指南）。

否決的額外做法（不佔表列）：Ink／inquirer TUI（新依賴、`AskFn` 測試更難）；從語言說明去產生 Tauri／Flutter（超出 ADR 0002 第 0 階段）。

## 合約先行

**不適用 — 只改 CLI UX。** 沒有 DTO、command、error code、ts-rest 路徑、`OkSchema` 或 `ErrSchema`。`create-ysk-app` 不講 HTTP。不要「為精靈」加一份合約。

| 項目 | 名稱／路徑 | 備註 |
|---|---|---|
| DTO | 沒有 | 不改 `@ysk-kit/contracts` |
| Command | 沒有 | 旗標維持 `--flavor`／`--preset`／`--db`／`--no-admin`／`--no-mobile`／`--yes` |
| Error codes | 沒有 | 取消是 CLI 中止（`create cancelled`），不是 `{ ok: false, error }` |
| 路徑 | 沒有 | 沒有 `/v1/…` |

Envelope 例外維持現有四項。本工作不要求第五項。

## 資料模型／Prisma 與遷移

**不適用。** 沒有 Prisma model、欄位、關聯或遷移。不需要 `pnpm db:migrate`。精靈問 mysql／postgresql／sqlite 只是選取 `createYskApp` 裡既有的 `--db` 改寫（provider、driver adapter、Compose）。不改套件 schema。程序 [db-migration](../skills/db-migration.zh.md) 不適用。

## 模組切片與分層

**不適用。** 沒有 `apps/api/src/modules/<name>/{domain,application,infra}` 檔。domain 與 application 不碰 Express、Fastify、Prisma、React、BullMQ，因為根本不改它們。六角法律不變。不要為「create-app 精靈」另 mkdir 一套模組。

## SDK／web-sdk／客戶端表面

**不適用。** 沒有 `packages/sdk` resource、`packages/web-sdk` hook，也沒有 web／admin／mobile／desktop 畫面。之後產生 dest 產品時，客戶端仍經 `@ysk-kit/sdk`。精靈不可叫人類 `fetch('/v1/…')` 或 import Prisma。php-bridge 文案繼續指向 OpenAPI + envelope unwrap（[PHP OpenAPI 客戶端](../recipes/php-openapi-client.zh.md)）。

## Jobs／mail／realtime／notifications

**沒有。** 沒有隊列名稱、郵件模板、socket 事件或站內通知。精靈不入列工作。thin 對 full 文案可提到 jobs／mail 在 thin 仍保留；那是說明，不是新 worker。

## 安全與私隱

程序：實作時做 [security-review](../skills/security-review.zh.md)（只限 CLI 路徑；沒有 webhook、沒有 desktop preload）。

- **授權：** 沒有。骨架是本地檔案系統，不是租戶 API。
- **確認閘門：** 減少把完整 monorepo（或 php-bridge）複製進錯誤目錄。Confirm-no 不可寫 dest。
- **密鑰：** 精靈不可印 `.env.example` 密鑰值、OTP、Stripe `sk_`、webhook 密鑰。成功建立後的下一步維持今天（`cp .env.example .env`、已記錄的 seed 帳戶名稱——不要在 TTY 文案加比 `index.ts` 已印更多的現場密碼）。
- **名稱／dest：** 產品名稱仍變成 `process.cwd()` 下的目錄。確認摘要必須顯示已解析名稱，讓使用者看見寫入目標。既有 `dest is not empty` 檢查留在確認 yes 之後。
- **`--yes`：** 仍是 agent 的非互動路徑；不要加會卡住 CI 的隱藏提問。
- **Webhook／Electron：** 不在範圍（[webhook-handling](../skills/webhook-handling.zh.md)、[desktop-electron](../skills/desktop-electron.zh.md) 不用）。
- **多語言：** 語言層必須重複 ADR 0002：不要把 `application/` 抄進 PHP／Rust／Python。這是防止第二套 domain 的安全控制。

## 測試計劃

一句話：TTY 的 `resolveCreateOptions` 變成編號引導精靈，含跳過規則與 confirm-no 中止；`--yes`／非 TTY 保持沉默。

風險（最高優先；此為 CLI UX，不是金錢／租戶）：

1. **意外磁碟寫入** — confirm-no 仍建立一棵樹；`--yes` 在 CI 開始提問。
2. **錯誤對應** — 編號答案 `4` 變成錯的 flavor；slug／編號混用（視未決問題 2）。
3. **跳過規則倒退** — php-bridge 被問 db／preset；saas 沒被問 admin；明示 `--flavor` 又問一次。
4. **文件／HELP 漂移** — 精靈聲稱套件無法搭的 flavor 或客戶端堆疊（Tauri）。
5. **i18n／字串漂移** — TTY 文案與 flavors.md 矛盾（維護；不是資料遺失）。

### 分層對應

| 風險 | 層 | 檔案 |
|---|---|---|
| Confirm-no 中止；`--yes` 沉默 | 套件單元（create-app） | `tooling/create-ysk-app/src/prompt.test.ts` |
| 編號／slug 對應 | 套件單元 | `prompt.test.ts` |
| 跳過 preset／db／admin／mobile | 套件單元 | `prompt.test.ts`（延伸既有案例） |
| HELP 提到精靈 | 套件單元 | `tooling/create-ysk-app/src/index.test.ts` |
| 合約／envelope／授權 | 不適用 | 沒有 HTTP |
| Playwright／ui-review | 不適用 | 沒有 web UI |

記憶體 port：不適用（沒有 API）。不要啟動 Redis、Stripe、Twilio、FCM、Jaeger 或 Grafana。不要在 CI 開真正的 readline TTY。

### 案例（`given / when / then`）

批准後第一條紅燈 `it()`：**confirm-no 永不回傳會讓 `index.ts` 傳進 `createYskApp` 的成功 `ResolvedCreateOptions`。**

- [ ] **Confirm-no 取消（第一條紅燈）。** Given TTY 解析 `['clinic']`，腳本答案走完各層後 Proceed `no`。When 跑 `resolveCreateOptions`。Then 以取消錯誤拒絕（或等價 sentinel）。`scriptedAsk` 必須被問過確認題。若 `index.ts` 只在有解析值後才呼叫 `createYskApp`，不必 spy `createYskApp`。
- [ ] **Confirm-yes 繼續。** Given 相同各層且 Proceed `yes`（或空白預設 yes）。Then `{ name, flavor, db, preset, admin, mobile }` 與答案相符。確認步空白 Enter 是 yes，避免走完精靈的人被擋住。
- [ ] **`--yes` 永不提問。** Given `parseArgs(['clinic', '--yes'])` 且 `tty: true`。Then `calls` 是 `[]`，值等於旗標／預設。腳本裡剩餘答案不可被消耗。延伸今天的案例。
- [ ] **非 TTY 永不提問。** Given `tty: false`。Then `calls` 是 `[]`。延伸今天的案例。
- [ ] **Flavor 跳過層。** Given flavor `php-bridge`（編號或 slug，視未決問題 2）。Then 不問 preset／db／admin／mobile；解析後的 preset／db 維持套件預設；語言說明仍出現在已問或已印字串（用 `calls` 含已知子字串斷言，或若實作用「按 Enter 繼續」則那是一條 `AskFn` 問題——**較佳做法是把說明放進下一題 `ask()` 的前文**，讓 `scriptedAsk` 記到，無須新 TTY 函式庫）。
- [ ] **static-web3 同樣跳過 preset／db。**
- [ ] **saas 問 admin 與 mobile**，題目含後果文案（`Include admin?` 提到營運者 Vite app／`--no-admin`）。
- [ ] **gateway／desktop／trading 不問 admin／mobile。**
- [ ] **明示旗標不再問。** `--flavor desktop` 跳過 flavor（語言說明仍可印；不要再問 flavor slug）。`--preset`／`--db`／`--no-admin`／`--no-mobile` 與今天相同。
- [ ] **編號對應（若未決問題 2 選擇編號）。** Given 答案按 `FLAVORS` 順序為 `1`…`6`（或選定編號）。Then 解析 flavor 等於 `FLAVORS[n-1]`。無效 `0`、`7`、`saasx` 重試，三次後拋 `unknown flavor`。
- [ ] **仍接受 slug（僅當使用者對未決問題 2 答是）。** Given 在 flavor 提問輸入 `gateway`。Then flavor 是 `gateway`。若使用者選只接受編號，本案例不涵蓋，輸入 `saas` 算一次無效嘗試。
- [ ] **名稱提問** 在 TTY 省略時仍必填。
- [ ] **HELP／`--help`** 提到 wizard（或「guided」／引導），並仍提到 `--yes` 永不提問。
- [ ] Memory-repo 服務案例 — **不適用**（沒有 API 模組）。
- [ ] Envelope／error code 案例 — **不適用**。
- [ ] 授權／租戶／另一作者 — **不適用**。
- [ ] Hooks 只經 SDK — **不適用**。
- [ ] Playwright／ui-review — **不適用**（TTY CLI，不是 zinc 畫面）。

夾具：`prompt.test.ts` 的 `scriptedAsk(answers)`。`parseArgs([...])`。除非另加可選的 `index.ts` 取消測試，否則不要臨時目錄（優先只對 `resolveCreateOptions` 做單元測試）。

測試不涵蓋：真正互動 readline；flavor-smoke 矩陣（複製行為不變）；e2e Playwright；既有 `index.test.ts` help spawn 以外的 npm `create @ysk-kit/app` packing。

## 驗證命令

每條命令都有預期結果。**本計劃-only PR：** 只須跑計劃檢查且通過。**未來實作之後：** create-app 套件測試加上慣常套件閘門。

| 命令 | 預期結果 |
|---|---|
| `pnpm ysk-kit plan --check docs/plans/2026-10-13-create-app-guided-wizard.md` | 印出 `ysk-kit plan --check: ok` |
| `pnpm ysk-kit plan --check docs/plans/2026-10-13-create-app-guided-wizard.zh.md` | 印出 `ysk-kit plan --check: ok` |
| `pnpm --filter @ysk-kit/create-app test`（未來實作） | 退出碼 0；新的 `prompt.test.ts` 案例綠；既有 `--yes`／跳過案例仍綠 |
| `pnpm layers`（未來實作） | 退出碼 0；客戶端不碰 Express／Prisma／jobs／mail／push／AWS SDK（不變；CLI 套件不是客戶端 app） |
| `pnpm typecheck`（未來實作） | 退出碼 0 |
| `pnpm test`（未來實作） | 退出碼 0 |
| `pnpm gen:openapi`（未來實作） | `docs/openapi.yaml` 與 ts-rest 相符且無合約改動（仍跑此命令，讓閘門誠實） |
| `pnpm ysk-kit check agent`（未來實作） | 印出 `ysk-kit check agent: ok` |

實作後可選：`pnpm lint`。此純 CLI 故事不跑 `pnpm e2e`。Grok Build：`grok inspect`。

### 人手檢查

沒有 HTTP 或授權改動。實作後 TTY UX 就是產品表面——不可省略。

- [ ] UI 流程（TTY，實作後）：在真正 TTY 上跑 `pnpm --filter @ysk-kit/create-app start`，不要 `--yes`。為 `saas` 走完七層。閱讀適用於／避免何時。確認時答 `no`。工作目錄**沒有**新產品資料夾。
- [ ] TTY 確認 yes：用一次性名稱重做，Proceed `yes`，然後刪 dest。磁碟上的 flavor／preset／db／admin／mobile 與摘要相符（`.ysk-kit.json`）。
- [ ] TTY php-bridge：會跳過 preset／db 的 flavor；可見語言說明；confirm-no 仍不寫入。
- [ ] 非 TTY：`pnpm --filter @ysk-kit/create-app start wizard-ci-probe --yes --flavor gateway --db sqlite </dev/null`（或 pipe）用旗標／預設建立且不掛起。之後刪 dest。
- [ ] Envelope 形狀 `{ ok: true, data }`／`{ ok: false, error }` — **不適用**（沒有 HTTP）。
- [ ] 授權角色 — **不適用**。

## 文件／變更紀錄／changeset

計劃-only PR：**沒有** changelog、README 窗口或 changeset（尚未有可發布行為）。

未來實作之後：

- [ ] `docs/cli/create-ysk-app.md` + `.zh.md` — 互動一節描述編號精靈、跳過規則、確認閘門，以及 `--yes`／非 TTY 永不提問。
- [ ] `docs/guides/flavors.md` + `.zh.md` — 可選一行指向互動 create-app 使用此表；若 HELP + CLI 手冊 + 精靈字串已足夠，不要把整份指南再抄第三份。客戶端語言選擇表仍是正規來源。
- [ ] `docs/skills/new-product.md` + `.zh.md` — 保留「agent 傳旗標」；加一句人類在 TTY 會遇到精靈（agent 執行不要等它）。
- [ ] `tooling/create-ysk-app/src/help.ts` — 提到 TTY 精靈；`--yes` 一行意義不變。
- [ ] `CHANGELOG.md`／`CHANGELOG.zh.md` 與 README 最近三個版本窗口 — 當 create-app 行為出貨時（若 TTY UX 對公開套件使用者可見，用 minor）。
- [ ] `@ysk-kit/create-app` 的 changeset（若倉的 changeset 政策要求文件套件也加則再加）。Patch 對 minor：若視 confirm-no 中止為使用者會依賴的行為變更，用 **minor**；否則 patch。實作時記錄選擇；預設建議 **minor**，因為互動 UX 就是此套件的產品。

## 風險與回滾

| 風險 | 緩解 | 回滾 |
|---|---|---|
| Confirm-no 做成 throw 但 `index.ts` 沒捕捉 → 退出碼 1 像當機 | 具名錯誤 + 單元測試；`index.ts` 對應到退出碼 0 | 還原實作 commit；提問回到光禿列表 |
| 編號答案與 slug 碰撞（例如未來 flavor 名叫 `1`） | 今天 flavor 是 kebab 詞；測試釘死 `FLAVORS` 順序 | 還原精靈對應輔助函式 |
| TTY 字串 i18n 使維護相對 flavors.md 加倍 | prompt.ts 內單一文案表，事實同源；文件仍是正規 | 若使用者如此回答則 TTY 只用英文 |
| `--yes` 意外提問並卡住 CI（`flavor-smoke`、`pack-and-run`） | 把 `!opts.tty \|\| parsed.yes` 提早返回留在 `resolveCreateOptions` 最前；既有測試必須留下 | 還原；CI 已用 `--yes` |
| 使用者以為 Tauri／Flutter 可用，因為語言說明點了名 | 說明寫 **已延後／不搭**；測試斷言該子字串 | 後續文件跟進時放軟文案 |
| 人手驗證時意外寫 dest | 先做 confirm-no；用一次性名稱 | `rm -rf` dest；createYskApp 仍拒絕非空目錄 |

沒有遷移回退。不掛載 capability：不適用。還原 commit 即足夠。

## 任務清單

按順序。Gate 獲准後才開始實作。本 PR 在步驟 0 之後停止。

0. [x] 計劃（本 PR）
   - **檔案：** `docs/plans/2026-10-13-create-app-guided-wizard.md`、`docs/plans/2026-10-13-create-app-guided-wizard.zh.md`
   - **介面／合約／資料：** 沒有
   - **風險：** 標題不完整會令 `plan --check` 失敗
   - **回滾：** 刪配對／關閉計劃 PR
   - **驗收：** 兩份 `--check` 印 ok；狀態 **draft — waiting for user approval**；沒有 `tooling/create-ysk-app/src/` diff

1. [ ] 合約
   - **檔案：** 沒有
   - **介面／合約／資料：** 不適用
   - **風險：** 沒有
   - **回滾：** 不適用
   - **驗收：** 不加 DTO、沒有 TypeScript `enum`、不加 `OkSchema`／`ErrSchema`。實作 PR 可略過此步，只再確認不適用。

2. [ ] 骨架
   - **檔案：** `apps/api` 下沒有新檔。**不要**跑 `ysk-kit add module`。
   - **介面／合約／資料：** 沒有
   - **風險：** agent 可能仍 mkdir 模組
   - **回滾：** 刪掉任何意外模組
   - **驗收：** 精靈留在既有 create-app 套件；沒有平行樹

3. [ ] Application 規則（CLI 解析器 — 真正功能）
   - **檔案：** `tooling/create-ysk-app/src/prompt.ts`（精靈層 + 確認）；`tooling/create-ysk-app/src/index.ts`（捕捉取消，退出碼 0）；若字串使 `prompt.ts` 難讀，可在旁邊加小型 `wizard-copy.ts` — **同一套件，不是新 app**
   - **介面／合約／資料：** `AskFn` 與 `ResolvedCreateOptions` 維持。需要時加取消錯誤型別。不改 `ParsedArgs`／`createYskApp` 選項。
   - **風險：** 跳過規則或 `--yes` 倒退；取消時仍寫磁碟
   - **回滾：** 還原那兩個檔
   - **驗收：** 下列決策層已實作；腳本化 `AskFn` 測試通過（無 Redis／Stripe）

   **決策層（flavor 不適用或旗標已明示則跳過）：**

   1. **產品名稱** — 省略時用今天的 `pickName`。
   2. **產品形態 → flavor** — 編號選單（按 `FLAVORS` 順序 1–6）加上每種 flavor 一行適用於與避免何時（下方草稿文案）。權衡可另加短行（複製哪些 app／是否套用 preset）。
   3. **語言／客戶端邊界說明** — flavor 已知後一定出現（包括 `--flavor` 已明示時，只教育、不再問 flavor）。預設 TypeScript。`php-bridge` = OpenAPI + PHP／TS 客戶端。Tauri／Flutter／KMP **已延後**（ADR 0002）——只教育，不搭。指向：flavors 客戶端語言選擇、php-openapi-client recipe。
   4. **能力深度 → thin \| full** — `PRESET_SKIP` 或明示 `--preset` 則跳過。適用於／避免何時來自 capabilities thin 對 full 表。
   5. **資料庫 → mysql \| postgresql \| sqlite** — `PRESET_SKIP` 或明示 `--db` 則跳過。適用性見下。
   6. **表面（只限 saas）** — admin yes／no 與 mobile yes／no 加後果；非 saas 或已設 `--no-admin`／`--no-mobile` 則跳過。
   7. **確認摘要 + Proceed yes／no** — 印 name、flavor、preset（或「忽略」）、db（或「忽略」）、admin、mobile。Proceed `no` → 不建立就退出。空白 Enter = yes。

   **TTY 文案草稿（英文；最終語言是未決問題 1）。Flavor 選單：**

   | # | Flavor | 適用於 | 避免何時 |
   |---|---|---|---|
   | 1 | `saas` | 多表面產品：公開 web、營運者 admin、可選 Expo、一套 API | 你只要 Electron、機器 gateway、PHP 客戶端、只要 API+web 不要套件 admin／mobile，或只要沒有 Prisma 的 Vite |
   | 2 | `desktop` | Electron 經 `@ysk-kit/sdk`（`platform: desktop`）對接 API | 本倉需要 web／admin／mobile，或要 Tauri 二進位（已延後） |
   | 3 | `gateway` | 機器客戶端 + 營運者主控台；API keys（`GATEWAY.md`） | 你要此骨架產出公開 web 或 Expo app |
   | 4 | `php-bridge` | 對現有 Kit API 的 OpenAPI + 明白 envelope 的 TypeScript／PHP 客戶端 | 你要 Node apps、Prisma，或把 `application/` 抄進 PHP |
   | 5 | `trading` | API + web + worker；產品自有市場數據（`TRADING.md`） | 你要套件 admin／mobile／desktop apps |
   | 6 | `static-web3` | 只有 Vite web；沒有 Prisma／`DATABASE_URL`（`WEB3.md`） | 本倉需要 API |

   **Preset：** `thin` — 新產品；剝走 llm、billing、organizations、devices；其後用 `ysk-kit add` 還原。避免何時：你要完整示範。`full` — 掛上那些能力的活套件。避免何時：你要精簡生產起點。

   **資料庫：** `mysql` — 預設；Compose `mysql`；接近生產。避免何時：不能跑 Docker 或要檔案型 DB。`postgresql` — Postgres 團隊；Compose `postgres`。避免何時：你要維持套件預設 MySQL 路徑。`sqlite` — 本地 smoke／CI；沒有 Compose。避免何時：多寫者或生產並發重要。

   **表面（saas）：** admin yes → 複製 `apps/admin`（營運者）。Admin no → 等價 `--no-admin`。Mobile yes → 複製 Expo `apps/mobile`。Mobile no → `--no-mobile`。

4. [ ] 客戶端
   - **檔案：** `apps/web` 等沒有
   - **介面／合約／資料：** 不適用
   - **風險：** 沒有
   - **回滾：** 不適用
   - **驗收：** 沒有 SDK／web-sdk／raw `fetch` 工作

5. [ ] 驗證
   - **檔案：** `tooling/create-ysk-app/src/prompt.test.ts`、`index.test.ts`
   - **介面／合約／資料：** 沒有
   - **風險：** 漏掉 `--yes` 倒退
   - **回滾：** 測試與 prompt 一併還原
   - **驗收：** 上表驗證命令全綠；第一條紅燈 `it()` 是 confirm-no；`--yes` 仍不問

6. [ ] 文件
   - **檔案：** `docs/cli/create-ysk-app.md` + `.zh.md`；`help.ts`；可選 flavors／new-product 一行；CHANGELOG 配對；changeset
   - **介面／合約／資料：** 沒有
   - **風險：** 中英深度不一致；HELP 與測試漂移
   - **回滾：** 還原文件 + changeset
   - **驗收：** 中英配對深度一致；HELP 提到精靈；`--yes` 記為永不提問

## 未決問題

未解決。不要用猜測填滿。對應細節等使用者回答後才實作。

- **TTY 提問語言：** 只用英文（今天 `prompt.ts`／`HELP` 是英文）還是雙語提問（同一 TTY 英＋香港書面語，或 `LANG`／旗標切換）？文件無論哪邊都維持雙語。本計劃的草稿文案用英文，方便實作者有來源；這不是決定。
- **編號答案（1–6）對仍接受輸入 flavor slug？** 方法論要求編號選單。該提問是否仍接受 `saas`／`desktop`／…（今天 `allowed.includes(raw)` 行為）尚未決定。同一問題可能適用於 preset（`thin`／`full` 對 1–2）與資料庫（`mysql` 對 1–3）。任務 5 的測試必須跟使用者的回答；不要默默兩種都做。
