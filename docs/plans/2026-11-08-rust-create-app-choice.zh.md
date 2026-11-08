# 計劃：Rust create-app 選擇

Language: 英文配對 `2026-11-08-rust-create-app-choice.md` · 中文 `2026-11-08-rust-create-app-choice.zh.md`

| | |
|---|---|
| **Slug** | `rust-create-app-choice` |
| **日期** | 2026-11-08 |
| **狀態** | 草稿 — 等待擁有者批准。只做計劃。不要從此 PR 實作、合併、發佈 npm 或改版本號。 |
| **正規檔** | `docs/plans/2026-11-08-rust-create-app-choice.md` |
| **工作階段指針** | `/plan.md`（已 gitignore） |

法律：[AGENTS.zh.md](../../AGENTS.zh.md)。程序：[plan-feature](../skills/plan-feature.zh.md)。檢查：`pnpm ysk-kit plan --check docs/plans/2026-11-08-rust-create-app-choice.zh.md`。澄清：[clarify-feature](../skills/clarify-feature.zh.md)（最多五題）。路徑：[sdd-path](sdd-path.zh.md)。

**建議（一段）：** 把面向使用者的 Rust 選擇做成 API 類 flavor（`saas`、`desktop`、`gateway`、`trading`）上的**可選 `--with-rust-sidecar` 疊加**，不是第七種 flavor、不是目錄 capability、也不是第二個公開 API。v1 只複製 dest 專用 crate，在 composition 背後實作既有 `ICryptoPort` 密文格式；TypeScript `application/` 仍是唯一 domain。TTY 與 `--yes` 預設都是 **關**。暫緩 `desktop-tauri` 與 Rust OpenAPI 客戶端。否決用 Rust 重寫套件、Axum 當兄弟 API，以及「Rust 當應用程式語言」。

## 目標與使用者問題

Shek Ki Yan 要在 `create-ysk-app`／flavors／文件裡提供**面向使用者的 Rust 選擇**，並在任何運行時工作之前先計劃。

現行堆疊是 TypeScript。[ADR 0002](../adr/0002-polyglot-clients.zh.md) 已記錄多語言邊界：HTTP 客戶端只用 OpenAPI + envelope；Rust 只可以做 **port 背後的 worker 或 crypto adapter**；Tauri／Flutter／KMP 暫緩；禁止用 Rust 做兄弟 domain。[Flavors](../guides/flavors.zh.md) 客戶端語言表已有「CPU 熱路徑密碼學、編解碼或簽章 → **Rust sidecar**」。引導式精靈的 `LANGUAGE_NOTE` 提到 TypeScript、`php-bridge` 與已延後的 Tauri — **沒有** Rust 可選項，`create-ysk-app` 也不會複製 crate。

今天「想用 Rust」的人只有三條壞路：發明第七種看起來像第二套堆疊的 flavor；把 `application/` 抄進 Axum（ADR 禁止）；或私下 vendor sidecar（沒有 golden 密文格式、沒有 `pnpm layers` 故事、沒有 doctor／supply 釘選）。

**稍後**批准之後的結果（不是本 PR）：有文件、符合 ADR 的選擇；一支旗標 + TTY 問題；dest crate 模板放在 `ICryptoPort` 背後；產品語言仍是 TypeScript。

## 範圍

- 包含：本日期計劃配對（建議、UX、階段、檔案清單、安全、AGENTS 預算、ADR 補篇**草稿**）。
- 包含：交出計劃 PR 之前，對本配對跑 `pnpm ysk-kit plan --check`。
- 包含（批准後、稍後的實作 PR — 見任務清單）：`--with-rust-sidecar` 旗標、精靈 yes/no、php-bridge 風格模板、dest `ICryptoPort` adapter、文件 + ADR 0002 補篇（或 0003，僅在擁有者同意時標為已接受）、只在本機的 cargo smoke。
- 包含：明確的否決／暫緩表，讓擁有者不用猜。

## 非目標

- 不含：在本計劃 PR 實作 flavor／運行時骨架、把本 PR 當成已出貨 Rust 來合併、發佈 npm，或改 `package.json` 版本。
- 不含：v1 加第七種 `--flavor`（`rust`、`desktop-tauri`、`rust-bridge`）。
- 不含：發明目錄 capability `rust-worker`／`rust-sidecar`（`ysk-kit add` 名稱維持 [capabilities](../guides/capabilities.zh.md) 的十六個）。重用既有 `crypto`。
- 不含：Rust 當第二個公開 API、Axum／Actix／Warp 當產品 HTTP 伺服器、把 hexagonal domain 搬離 TypeScript，或「ysk-kit 的 Rust 版」。
- 不含：`desktop-tauri`、Flutter、KMP、FastAPI 當主 API（ADR 0002 第 2–3 階段）。有產品付錢時另開計劃。
- 不含：v1 的 Rust OpenAPI 客戶端 codegen（php-bridge 類比）。最早也是本故事的第 2 階段。
- 不含：napi-rs／N-API addon、公開 gRPC，或看起來像第二個 API 的本機 HTTP sidecar。
- 不含：用 Rust 加密既有 identity／billing／OTP 欄。v1 是 port + crate，不是資料遷移。
- 不含：讓 `pnpm test`、`flavor-smoke` 或必跑的 GitHub Actions 編譯 `rustc`（Actions 配額已用盡；預設 CI 不需 rustc）。
- 不含：AGENTS.md 正文新節、新硬規則，或 always-apply 的 Cursor 規則。根目錄加巢狀 `AGENTS.md` 餘額只有 **61** 位元組。
- 不含：把行業 domain（salon、venue、map）放進本套件。
- 不含：beta／RC／nightly Rust 工具鏈。實作時釘穩定版。
- 不含：改 `--yes`／非 TTY 對 flavor／preset／db／admin／mobile 的預設。
- 不含：TTY 精靈文案 i18n（與今天一樣只用英文）。

## 假設

- 擁有者要求先出計劃。實作要等**本檔**獲准。本 PR 只是研究紀錄。
- [ADR 0002](../adr/0002-polyglot-clients.zh.md) 維持 **已接受**。本計劃提議補篇（草稿見下），不默默取代 ADR。擁有者在實作 PR 接受之前，狀態維持 proposed。
- 在本 checkout（週分支 `cursor/weekly-2026-11-08-8dc2`，changelog v1.6.9）量得：名為 `AGENTS.md` 的檔合計 **24515** 位元組。預算 **24576**。餘額 **61**。`AGENTS.zh.md` 不計入。`.runs` 樹會略過。任何會改 `AGENTS.md` 的實作 PR 之前要重測。
- 此私人 worker（ki-mac-mini）已有 **rustc 1.99.1**／**cargo 1.99.1**（穩定版，2026-10-13）。不可假設 dest 開發者或 GitHub `ubuntu-latest` 也有。在實作寫入 `rust-toolchain.toml` 之前，不要把 1.99.1 當成套件釘選。
- 本倉沒有 `Cargo.toml`（2026-11-08 ripgrep）。根 `.gitignore` 沒有忽略 `target/`。
- `@ysk-kit/crypto` 匯出 `ICryptoPort` + `createAes256Gcm`（AES-256-GCM 密文：版本位元組 `1`、12 位元組 IV、ciphertext、16 位元組 tag）。`CRYPTO_MASTER_KEY` 已在 `ServerEnvSchema`。**今天 `apps/api/src/composition.ts` 沒有注入 `ICryptoPort`。** `ysk-kit add crypto` 只合併 env + `apiDeps`。
- Flavors 表的 `worker` 欄是既有 BullMQ 行程（`apps/api/src/worker.ts`／`pnpm worker`），不是 Rust。面向使用者的文案必須寫 **sidecar**，不要寫 worker。
- `php-bridge` 是唯一不複製整棵樹的 flavor：模板在 `tooling/create-ysk-app/templates/php-bridge/`。複製模式要重用這個。
- GH Actions 配額已用盡。實作不可加一個必跑、需要 `rustc` 的 Actions job。本計劃 PR 用本機 `plan --check`／`check agent` 即可。
- 香港繁體中文配對深度須一致。實作 PR 新增任何 `docs/**/*.md`（ADR、recipe、skill）時，`docs-pair` 會要求 `.zh.md` 兄弟。
- `exactOptionalPropertyTypes` 維持開啟：預設 node 時省略 `CRYPTO_ADAPTER`，不要傳 `undefined`。
- 測試維持記憶體／Node port。預設 `pnpm test` 不 spawn Rust。

## 受影響的 flavor／preset／capability

| 軸 | 值 | 備註 |
|---|---|---|
| Flavor | 套件本身，然後經 create-app 到 dest 產品 | 旗標適用於 `saas`、`desktop`、`gateway`、`trading`。`php-bridge` 與 `static-web3` **忽略**（沒有 API 行程），與 `--preset` 的 skip 規則相同。不是第七種 flavor。 |
| Preset | 不適用 | `--preset thin\|full` 不變。Rust sidecar 與 llm／team／billing／push 的裁剪正交。 |
| Capabilities | 重用 `crypto` | **不要**把 `rust-sidecar` 加進 `add-capability.ts` 的 `CAPABILITIES`。AGENTS.md 規定發明目錄名稱之前要先問。 |

## 現況與重用

探索（2026-11-08）找不到 Cargo crate、Tauri app、Rust OpenAPI 客戶端，也沒有 `--with-rust-*` 旗標。Rust 只出現在 ADR／flavors／精靈裡的**禁止或暫緩**。

### 邊界上已經有的東西

| 需要 | 套件裡已有 | 缺口 |
|---|---|---|
| 多語言 HTTP | ADR 0002、`php-bridge`、食譜 [php-openapi-client](../recipes/php-openapi-client.zh.md) | 沒有 Rust 客戶端；不是 v1 |
| CPU 熱路徑密碼學 | `@ysk-kit/crypto` 的 `ICryptoPort` + Node `createAes256Gcm`；capability `crypto`；`CRYPTO_MASTER_KEY` | 沒有 Rust 實作；composition 沒有注入該 port |
| 產品形狀 | `FLAVORS` 六種；精靈 `FLAVOR_ITEMS` 1–6 | Rust 不是 flavor，也不該變成 flavor |
| 語言教育 | `wizard-copy.ts` 的 `LANGUAGE_NOTE`；flavors 客戶端語言表 | 說明寫 Tauri 已延後；沒有 sidecar 可選項 |
| BullMQ worker | `pnpm worker`、`apps/api/src/worker.ts`、flavors 欄 `worker` | 若寫「Rust worker」會撞名 |
| 分層 | `.dependency-cruiser.cjs`（`pnpm layers`） | 只看 TS；看不見 Cargo |
| Agent 掃描 | `check agent`：no-ts-enum、clients-no-prisma、clients-no-raw-fetch、指針、skill-drift、24 KiB 預算 | 沒有 rust-boundary 規則 |
| 供應鏈 | `ysk-kit check supply` Node／PHP／kernel／lockfile IOC | 沒有 rustc／`Cargo.lock` 盤點 |
| 桌面 | Electron 44 + [desktop-electron](../skills/desktop-electron.zh.md)；Prisma 永不進 Electron | Tauri 暫緩；sidecar 屬於 **API** 行程，不是 renderer |
| Dest 標記 | `.ysk-kit.json` `{ kit, version, flavor, preset, db }` | 沒有 rust 欄；寧願偵測 `crates/ysk-sidecar/Cargo.toml`，不要改 schema |

### 要重用的檔（不要重寫）

| 路徑 | 符號 | 重用為 |
|---|---|---|
| `docs/adr/0002-polyglot-clients.zh.md` | 決定 + 分階段路線 | 補篇：sidecar 是既有「Rust 放在 port 背後」的第 1 階段**運行時**；Tauri 仍是第 2 階段 |
| `docs/guides/flavors.zh.md` | 客戶端語言表、worker 欄 | Electron 維持預設；sidecar 列從「只寫文件」升成「`--with-rust-sidecar`」；不要改名 BullMQ 的 `worker` |
| `tooling/create-ysk-app/src/wizard-copy.ts` | `LANGUAGE_NOTE`、`FLAVOR_ITEMS` | 延長說明：sidecar 可選、Tauri 仍暫緩。desktop 的 `avoidWhen` 維持「Tauri 二進位（已延後）」 |
| `tooling/create-ysk-app/src/prompt.ts` | `pickYesNo`、`PRESET_SKIP`、確認摘要 | 語言說明之後加 yes/no，只問 API flavor；摘要多一行 |
| `tooling/create-ysk-app/src/scaffold.ts` | `FLAVORS`、`parseArgs`、php-bridge 複製 | 新旗標；開啟時複製 `templates/rust-sidecar/`；php-bridge／static-web3 忽略 |
| `tooling/create-ysk-app/templates/php-bridge/` | 獨立模板樹 | `templates/rust-sidecar/` 的形狀（crate + README，不是 fork 整棵 monorepo） |
| `packages/crypto/src/index.ts` | `ICryptoPort`、密文佈局 | Golden 向量留在這裏；dest adapter 實作同一串位元組 |
| `packages/config/src/index.ts` | `CRYPTO_MASTER_KEY` | 可選 `CRYPTO_ADAPTER` 為 `'node' \| 'rust'` 字面量聯集 — 預設 node 時省略 |
| `apps/api/src/composition.ts` | 建構 adapter | 旗標開啟時 dest 才有 factory；living kit 可以繼續不接，直到有真正 use-case |
| `tooling/ysk-cli/src/add-capability.ts` | `CAPABILITIES` 已含 `crypto` | 不要加名稱。提示文案可以提到 sidecar 食譜 |
| `.github/scripts/flavor-smoke.sh` | php-bridge 在有 php 時 `php -l` | 類比：**可選**本機 `rust-sidecar-smoke.sh`（有 `rustc` 才跑）；預設 matrix 不需 rustc |
| `docs/skills/new-product.zh.md` | Flavor 提示表 | 加一列：CPU 熱路徑密碼學 → 在 API flavor 上加 `--with-rust-sidecar` |
| `docs/skills/supply-scan.zh.md`／`catalog.json` | PHP `require.php` 下限 | 稍後：rustc 線。v1 不要求 CI |
| `tooling/ysk-cli/src/check-agent.ts` | `AgentRule` 聯集 | 稍後：若存在 `crates/` 則 `rust-sidecar-boundary` |
| `docs/plans/2026-11-01-clarify-feature-sdd-path.zh.md` | 只做計劃的 PR 形狀 | 本檔結構 |
| `docs/plans/2026-10-13-create-app-guided-wizard.zh.md` | 精靈 UX 法律 | 數字 + slug；`--yes` 沉默；TTY 英文 |

## 考慮過的方案

### 產品形狀（「選擇 Rust」是甚麼意思）

| 方案 | 複雜度 | 分層 | 遷移 | 客戶端 | 備註 |
|---|---|---|---|---|---|
| **A. 可選 Rust sidecar crate**，放在 TS API 旁邊，在 `ICryptoPort` 背後（私有 HTTP／stdio；不是公開 API） | 中 | create-app 模板 + dest infra + 文件 | 既有 dest 無遷移（預設關） | 無；套件 TS 客戶端仍走 SDK | ADR 0002 已允許。**選定** |
| **B. `desktop-tauri` flavor**（Rust + WebView 桌面客戶端，消費 OpenAPI） | 高 | 新 flavor、desktop skill 分叉、CI、供應鏈 | 若 Electron 留下就有兩個桌面預設 | 新 dest app；仍然沒有第二套 domain | ADR 0002 第 2 階段：「有客戶付錢」。**暫緩** |
| **C. Rust OpenAPI 客戶端**（php-bridge 類比：解開 envelope，不抄 `application/`） | 中 | 新模板 flavor 或額外語言目錄 | 無 | 合作方打 `API_PUBLIC_URL` | 誠實的多語言客戶端；**沒有**把 Rust 放進產品熱路徑。**暫緩到本故事第 2 階段** |
| **D1. 第七種 flavor `rust`／`rust-api`**，複製或取代 `apps/api` | 高 | flavor matrix ×2、doctor、smoke | 看起來像第二套堆疊 | agent 會複製規則 | **否決** — 牴觸 ADR 方案 2（兄弟 domain） |
| **D2. Preset `rust` 或目錄 `ysk-kit add rust-worker`** | 中 | `CAPABILITIES`、thin／full 混淆 | upgrade／doctor 目錄震動 | 無 | **否決** — preset 是裁 llm／team／billing／push；AGENTS.md 禁止未詢問就發明 capability 名稱。擁有者可在未決問題覆寫 |
| **D3. 在 `@ysk-kit/crypto` 做 napi-rs native addon** | 高 | 已發佈 tarball 長出 `.node`；Electron ABI（desktop 44）；套件 CI 需要 rustc | npm provenance + optional deps | desktop 要重建 | **v1 否決** — ABI + pack-and-run 必需要 rustc |
| **D4. v1 IPC 用本機 HTTP／gRPC sidecar** | 中 | 看起來像第二個 API；會想套 envelope | agent 會加路由 | 合作方可能去打它 | **v1 否決**。ADR 允許內網 HTTP／gRPC；stdio 信任邊界更小 |
| **D5. 「TypeScript 的 Rust 版」當應用程式語言** | 不適用 | 等於 fork 套件 | 全盤 | 全部 | **否決** |

**選定：** A。  
**原因：** 這是唯一已經是法律的形狀（ADR 0002 + flavors 表）、不會增殖 flavor、讓 `@ysk-kit/contracts` 維持唯一 HTTP 來源，又能給 create-app 一個面向使用者的選擇、而不做第二套 domain。B 與 C 列為後續。D1–D5 是精靈必須繼續教育去避開的陷阱。

### UX 表面（使用者在哪裏揀）

| 表面 | 優點 | 缺點 | 判決 |
|---|---|---|---|
| 新 `--flavor rust`／`desktop-tauri` | 出現在 1–6 選單 | Flavor = 複製哪些 **app**；Rust 是 adapter。選單變 7；agent 會拿它代替 `saas` | **否決** |
| `--preset` 值 | 大家已經會傳這支旗標 | Preset 代表 thin／full 的 capability 深度 | **否決** |
| **`--with-rust-sidecar` 旗標**（預設關）+ `LANGUAGE_NOTE` 之後的 TTY yes/no，只問 API flavor | 對齊 `--no-admin`／`--no-mobile`（可選附加）。`--yes` 維持沉默。Agent 傳旗標。名稱不跟 `pnpm worker` 撞 | TTY 多一題；確認摘要要多一行 | **選定** |
| 只做精靈教育、沒有旗標（現況 + 較軟文案） | 零骨架風險 | 不是**選擇** — 今天已經教育並拒絕 | **否決作為出貨切片** |
| 每個 API dest 都強制 crate | 不用問 | 每個產品都要 rustc；CI 爆 | **否決** |

確認摘要（實作時）加 `Rust sidecar: yes|no|n/a`。php-bridge／static-web3 為 `n/a`。該題直接 Enter = **no**。

### v1 與稍後

| 項目 | v1（批准後第一個實作 PR） | 稍後 |
|---|---|---|
| `--with-rust-sidecar` + TTY yes/no + HELP | 要 | — |
| Dest `crates/ysk-sidecar`（stdio JSON，AES-256-GCM 對齊 Node 密文） | 要 | 更多 op（編解碼、簽章）當額外指令 |
| Dest `apps/api/src/infra/rust-crypto-adapter.ts` 實作 `ICryptoPort` | 要 | — |
| `CRYPTO_ADAPTER=rust`（省略鍵 = Node） | 要 | — |
| 把 living `composition.ts` 接到產品列加密 | 不要 | 有真正 use-case 再計劃 |
| `@ysk-kit/crypto` 測試的 golden 向量（Node） | 要 | 有 rustc 時 Rust 測試斷言同一串位元組 |
| 預設 `pnpm test`／flavor-smoke 編譯 rustc | 不要 | 可選本機腳本；在配額恢復**且**擁有者要求之前，永不變成必跑 Actions |
| ADR 0002 補篇標為已接受 | 要（在實作 PR） | — |
| `desktop-tauri` flavor | 不要 | ADR 第 2 階段，獨立計劃 |
| Rust OpenAPI 客戶端（`rust-bridge` 或 php-bridge 額外目錄） | 不要 | 本故事第 2 階段，獨立清單 |
| `ysk-kit add rust-sidecar` 目錄名稱 | 不要 | 僅當擁有者稍後批准發明 capability |
| `check supply` rustc 下限 + `Cargo.lock` 審計 | 文件 + 提交 lockfile | 目錄線 + 有 crate 時 `cargo audit` |
| `check agent` rust-boundary | 若存在 `crates/` 則輕量 grep | — |
| AGENTS.md 漸進披露列 | **不要**，除非先修剪 | Tool plan modes 刪句之後 |
| napi-rs、公開 gRPC、Axum API | 永不當預設 | 幾乎永不（ADR 第 3 階段） |

## 合約先行

沒有新的 ts-rest 路徑、DTO、command 或 envelope 例外。公開 JSON 維持 `{ ok: true, data }`／`{ ok: false, error }`。Sidecar 協議是**私有、行程本機的 stdio**，不是 OpenAPI。

| 項目 | 名稱／路徑 | 備註 |
|---|---|---|
| DTO | 沒有 | 沒有 HTTP 資源 |
| Command | 沒有 | sidecar op 是 `ICryptoPort` 上的 `encrypt`／`decrypt`，不是 REST command |
| Error codes | 重用既有 | 子行程 spawn／崩潰屬 infra 失敗 → 若稍後有 use-case 呼叫該 port，用既有 `INTERNAL`。v1 不要發明 `RUST_*` 代碼 |
| 路徑 | 沒有 | 不要把 sidecar 掛在 `/v1/` 或本機 TCP |
| 互通密文 | `@ysk-kit/crypto` | `[version=1][iv 12][ciphertext][tag 16]`，AES-256-GCM，金鑰 = `CRYPTO_MASTER_KEY` 64 hex 解成 32 位元組 |
| Stdio 幀（私有） | 只在 dest crate | 長度前綴或換行 JSON `{ id, op, blob }`／`{ id, ok, blob \| error }`。**不是**公開 envelope。crate README 寫明內部用 |
| Env | `CRYPTO_ADAPTER` | dest `.env.example` 可選 `'node' \| 'rust'`。省略 = Node。若 living kit 要認識此鍵，config 用字面量 `z.union`；v1 dest-only env 已足夠 |
| 旗標 | `--with-rust-sidecar` | 只給 create-app。未知 flavor 仍然丟 `not in this phase` |

### ADR 0002 補篇（草稿 — 尚未接受）

狀態：本計劃裡 **proposed**。擁有者接受本計劃並落地實作 PR 之前，不要改 `docs/adr/0002-*.md`。傾向在 0002 加**補篇**（維持一份多語言 ADR），除非擁有者要獨立編號 0003。

實作時可複製的英文見配對檔；中文意義如下：

```markdown
## 補篇 — 可選 Rust sidecar（proposed YYYY-MM-DD）

面向使用者的選擇：API 類 flavor 上的 `create-ysk-app --with-rust-sidecar`
（TTY yes/no，預設 no）。這不是 flavor、不是目錄 capability、也不是第二個公開 API。

- Dest 產品可以收到 `crates/ysk-sidecar`，在 `apps/api` composition 背後實作
  `ICryptoPort`（密碼學、編解碼、簽章）。
- TypeScript `application/` 仍是會籍、帳單、租戶與 envelope 規則的唯一位置。
  Rust 不可重寫那些規則。
- v1 的 IPC 是帶私有 stdio 的子行程。沒有公開 HTTP、沒有公開 gRPC、已發佈的
  `@ysk-kit/crypto` tarball 不做 napi-rs。
- TypeScript 圖仍以 `pnpm layers` 為準。dependency-cruiser 看不見 Cargo；
  當存在 `crates/` 時，`check agent` 可以加 rust-boundary grep。
- `desktop-tauri`、Flutter、KMP、FastAPI／Axum 當主 API，以及 Rust OpenAPI
  客戶端，維持本 ADR 分階段路線（第 1–3 階段）。本補篇不授權那些樹。
```

階段表微調（實作時）：第 0 階段維持已出貨的文件。在「1 — 額外 OpenAPI 客戶端語言」**之前**插入「1a — 可選 dest sidecar（本補篇）」。不要把 Tauri 從第 2 階段改號。

## 資料模型／Prisma 與遷移

沒有。沒有 Prisma model、欄位、關聯或遷移。不要跑 `pnpm db:migrate`。不要加密既有欄。

唯一「資料」合約是 `createAes256Gcm` 已隐含的**密文 blob**。實作必須在 `packages/crypto` 測試發佈 golden hex 夾具，讓 Rust `aes-gcm` crate 不用猜 nonce 大小或版本位元組。以後破壞該佈局是 crypto 版本 bump（`VERSION` 位元組），不是 SQL 遷移。

`.ysk-kit.json` 維持 `{ kit, version, flavor, preset, db }`。v1 **不要**加 `rustSidecar`；doctor／upgrade 偵測 `crates/ysk-sidecar/Cargo.toml`。

## 模組切片與分層

沒有新的 `ysk-kit add module`。v1 不改 `apps/api/src/modules/*/domain` 或 `application`。

| 分層 | v1 改動（實作、dest 模板） | 不可 |
|---|---|---|
| domain／application | 不動 | 匯入 `child_process`、Cargo 或 tokio |
| dest infra | `apps/api/src/infra/rust-crypto-adapter.ts` 實作 `ICryptoPort` | listen port；把金鑰／明文寫進日誌 |
| composition | dest factory：預設 Node；`CRYPTO_ADAPTER=rust` **且**二進位存在才用 rust | 把 rust 變成套件預設 |
| `@ysk-kit/crypto` | golden 向量；Node 實作維持預設 | 發佈 `.node` addon |
| `pnpm layers` | **不**改 `.dependency-cruiser.cjs` | 放寬 clients-no-server-infra |
| Electron | 不動 | 在 renderer 載入 sidecar；Prisma-in-Electron 的類比 |

硬規則 5 仍然成立：domain 與 application 不碰 Express、Fastify、Prisma、React、BullMQ — 也不碰 Cargo。

## SDK／web-sdk／客戶端表面

沒有運行時客戶端代碼。不要 raw `fetch`。客戶端不要 Prisma。Web／admin／mobile／desktop 今天不匯入 `@ysk-kit/crypto`（`clients-no-server-infra` 已禁止 `@ysk-kit/crypto`）。Sidecar 不可出現在 Vite 或 Expo。

`packages/sdk`／`packages/web-sdk`：沒有新 resource。若用 HTTP 發現 encrypt／decrypt，那是新的公開 API — 超出範圍。

Desktop flavor + sidecar：crate 仍然住在 **`apps/api` 旁邊**，不是 Electron 裏面。Desktop 經 `@ysk-kit/sdk` 打 API。

## Jobs／mail／realtime／notifications

Sidecar 沒有這些。v1 不要用 BullMQ job 去跟 Rust 說話。不要把 crate 叫 `worker`，也不要掛 `apps/api/src/worker.ts`。郵件、Socket.IO 與 push 維持 TypeScript port。

`pnpm worker` 仍然是 BullMQ 消費者。文案與 HELP 要保留那句，避免 trading／gateway 文件漂移。

## 安全與私隱

程序：[security-review](../skills/security-review.zh.md)。新信任邊界：一個可以加密／解密 API 送來任何東西的子行程。

| 主題 | v1 規則 |
|---|---|
| 授權 | Sidecar 是行程本機。沒有新角色、權限或 `/v1/` 路徑。沒有另一作者案例。 |
| 租戶 | 不變。Rust 不可把 org id 當成安全控制；`application/` 仍然檢查會籍。 |
| Envelope | 沒有新例外。Stdio JSON 不是公開 HTTP。 |
| 密鑰 | 生產環境已要求 `CRYPTO_MASTER_KEY`（`createCryptoFromEnv`、doctor）。永不把金鑰、OTP、JWT、Stripe `sk_`、webhook 密鑰、明文或密文寫進日誌。子行程繼承 API env — 與 Node `node:crypto` 同一級行程本機威脅。不要把金鑰放在 argv（ps 清單）。 |
| 網絡 | 子行程：不 bind、不用 `reqwest` 打公開 API、不開 shell。Spawn 不要經 `/bin/sh`。 |
| `unsafe` | 模板 crate 禁止。 |
| 供應鏈 | 提交 `Cargo.lock`。只釘穩定 `rust-toolchain.toml`。crate 集保持很小（`serde`、`serde_json`、RustCrypto `aes-gcm`）。不要 `git` 依賴。不要 beta 工具鏈。 |
| 桌面 | Sidecar 不是 Electron 的 IPC 通道。Electron 審查仍走 [desktop-electron](../skills/desktop-electron.zh.md)。 |
| 審計 | `cargo audit`／`cargo deny` 屬本機／後續；Actions 配額用盡期間不要變成必跑 GitHub job。 |
| 日誌 | 子行程 stderr 不是密鑰傾印。只寫結構化錯誤（`op failed`），不要 payload。 |

實作 PR 的威脅模型模式有理由（新信任邊界），但除非擁有者要求，否則維持可選。不要寫 exploit 步驟。

## 測試計劃

本計劃 PR 不加生產行為、不加新測試。實作 PR 跟 [test-plan](../skills/test-plan.zh.md)／[write-tests](../skills/write-tests.zh.md)：記憶體 port、不啟動 Redis／Stripe、**預設 Vitest 不需 rustc**。

### 變更

讓 dest 產品可以選擇 Rust sidecar 放在 `ICryptoPort` 背後，同時沒有第二套 domain、沒有第七種 flavor、必跑 CI 也不要 rustc。

### 風險

1. Agent 把 crate 當成可以用 Rust 重寫 `application/` 的許可。
2. `--with-rust-sidecar` 與 `pnpm worker`／flavors `worker` 混淆。
3. 預設 CI／flavor-smoke 開始要求 rustc。
4. 精靈聲稱 Tauri 可用。
5. 經本機 HTTP sidecar 偷加 envelope 例外。
6. `AGENTS.md` 超過 24 KiB（餘額 61 位元組）。
7. Node 與 Rust AES 密文分叉（互通）。
8. php-bridge 收到 crate（沒有 API）。
9. `CRYPTO_MASTER_KEY` 進日誌或 argv。
10. 未詢問擁有者就加入目錄名稱 `rust-sidecar`。

### 分層對應

| 風險 | 分層 | 檔 |
|---|---|---|
| 旗標／skip 規則 | create-app | `scaffold.ts`、`prompt.ts`、`help.ts`、`index.test.ts`、`prompt.test.ts` |
| 模板漂移 | create-app | `templates/rust-sidecar/**` |
| 互通密文 | 單元 | `packages/crypto/src/index.test.ts` golden 向量 |
| 不需 rustc 的 adapter | 單元 | dest adapter 測試用假子行程（腳本化 stdio）；預設仍是記憶體／`createAes256Gcm` |
| php-bridge skip | create-app | 既有 php-bridge dest 斷言 + crate 不存在 |
| 分層 | `pnpm layers` | 圖不變 |
| Agent 法律 | `check agent` | v1 預算不變；可選 rust-boundary grep |
| 文件配對 | docs-pair | ADR 補篇、flavors、create-ysk-app、recipe |

### 案例

1. **旗標關／`--yes` 預設** — given saas thin `--yes`／when 寫 dest／then 沒有 `crates/ysk-sidecar`，也沒有問確認之外的 sidecar 題（`--yes` 全沉默）。
2. **旗標開、API flavor** — given `--flavor gateway --with-rust-sidecar --yes`／when 寫 dest／then 存在 `crates/ysk-sidecar/Cargo.toml` 與 adapter 檔；README 寫明不是公開 API。
3. **旗標被忽略** — given php-bridge 或 static-web3 + `--with-rust-sidecar`／then 沒有 crate（或文件化的 no-op + 警告），與被忽略的 `--preset` 相同。
4. **TTY 預設 no** — given sidecar 題被腳本化成 Enter／then dest 沒有 crate；Proceed no 仍然不寫檔。
5. **語言說明** — given 精靈／then 文案仍寫 Tauri／Flutter／KMP **已延後**，並寫 sidecar 是可選、不是 flavor。
6. **Node golden 密文** — given `createAes256Gcm`／when encrypt／decrypt／then 夾具穩定（版本、IV 長度、tag 長度）。
7. **假子行程 adapter** — given 腳本化 stdio fake／when `ICryptoPort.encrypt`／then adapter 組 JSON 幀，不呼叫 `fetch`。
8. **未知 flavor** — 仍然 `not in this phase`（既有測試）。
9. **layers／check agent** — 帶 crate 的 dest 仍通過 TS layers；客戶端仍不可匯入 `@ysk-kit/crypto`。

### 夾具

- 既有 `AskFn` 精靈測試、php-bridge dest、`DEV_CRYPTO_KEY_HEX`。
- 新增：固定明文 + 金鑰的 golden ciphertext hex（Node）。可選 cargo 測試**不**進 `pnpm test`。
- 不要 Redis、Stripe、Playwright、網絡或 rustc。

### 不涵蓋範圍

- Memory-repo HTTP／授權案例（沒有新資源）。
- Playwright／ui-review（沒有畫面）。
- 在 GitHub Actions 編譯 crate。
- 在本計劃 PR 實作。

## 驗證命令

本計劃 PR 只有這兩個日期檔。

| 命令 | 預期結果 |
|---|---|
| `pnpm ysk-kit plan --check docs/plans/2026-11-08-rust-create-app-choice.md` | 印出 `ysk-kit plan --check: ok` |
| `pnpm ysk-kit plan --check docs/plans/2026-11-08-rust-create-app-choice.zh.md` | 印出 `ysk-kit plan --check: ok` |
| `pnpm ysk-kit check agent` | 印出 `ysk-kit check agent: ok`（預算不變；還沒有新包裝） |

不要跑 `pnpm e2e`。不要跑 flavor-smoke（Actions 配額；沒有運行時改動）。可選：`pnpm layers` 仍綠，因為圖沒變。Grok Build 可用 `grok inspect` 列出已載入規則；它不能代替 `plan --check`。

實作 PR（批准後）另外：

| 命令 | 預期結果 |
|---|---|
| `pnpm layers` | 退出碼 0；除非擁有者批准規則，否則 **不改** `.dependency-cruiser.cjs` |
| `pnpm typecheck` | 退出碼 0 |
| `pnpm test` | 退出碼 0 **不需** rustc；create-app 旗標案例綠 |
| `pnpm gen:openapi` | `docs/openapi.yaml` 不變 |
| `pnpm ysk-kit check agent` | `ok`；合計 AGENTS.md ≤ 24576 |
| `pnpm ysk-kit check errors` | `ok` |
| 對本配對 `pnpm ysk-kit plan --check` | 仍 ok（狀態或會變成 approved） |
| Dest crate 本機 `cargo test` | 只在有 rustc 時；不是合併門檻 |

### 人手檢查

本計劃 PR 沒有 UI、HTTP 或授權行為改動。擁有者審查本建議就是閘門。

- [ ] UI 流程：不適用（稍後實作：TTY yes/no + 確認行；沒有 Vite 畫面）
- [ ] Envelope 形狀：不適用（沒有新的公開 JSON）
- [ ] 授權角色：不適用
- [ ] 擁有者接受或調整方案 A、`--with-rust-sidecar`、暫緩 Tauri／OpenAPI-Rust，以及五條未決問題
- [ ] 若使用者要求對此切片做 Staff／QA 審計，跟隨 [audit-slice](../skills/audit-slice.zh.md) — 本計劃 PR 未要求

## 文件／變更紀錄／changeset

- [ ] 本計劃配對是研究紀錄。**本 PR 沒有 changelog、沒有 changeset、沒有 README 窗口。**
- [ ] 批准後（實作 PR）：ADR 0002 補篇配對（只在擁有者同意時標為已接受）；[flavors](../guides/flavors.zh.md) 配對（sidecar 列寫出旗標；Tauri 仍暫緩；worker 欄仍是 BullMQ）；[create-ysk-app](../cli/create-ysk-app.zh.md) 配對 + `HELP`；[architecture](../architecture.zh.md) 產生器列；[new-product](../skills/new-product.zh.md) flavor 提示；[product-plan](../product-plan.zh.md)「今天能做甚麼」；食譜 `docs/recipes/rust-sidecar.md` 配對（形狀跟 php-openapi-client）；可選 skill `docs/skills/rust-sidecar.md` **不要** AGENTS.md 列。
- [ ] 批准後：`.changeset/rust-sidecar.md` 對 `@ysk-kit/create-app` 做 patch（若 doctor／check-agent 加了偵測，也包含 `@ysk-kit/cli`）。套件清單抄最近一次 create-app changeset。不要手改 `package.json` 版本。
- [ ] 根 CHANGELOG／README 最近三個版本窗口在旗標出貨時才動，不是本 PR。
- [ ] AGENTS.md：v1 **零位元組**，除非先做出餘額。規定的修剪 + 列寫在「現況與重用」之下（英文檔 Current state）。不要把本計劃貼進 `AGENTS.md`。

### AGENTS.md 預算（實作 PR，只在擁有者堅持要一列時）

量得 **24515／24576**，餘額 **61**。一列漸進披露約 70–90 位元組 → **不修剪就會讓 `check agent` 失敗**。

**v1 預設：不改 AGENTS.md。** 指針放在 flavors、create-ysk-app、new-product、ADR 補篇。Do-not 清單已經寫不要把 domain 抄進兄弟 Rust API。

若擁有者要一列，**先修剪**（與 [clarify-feature](2026-11-01-clarify-feature-sdd-path.zh.md) 同一刀）：從 `### Tool plan modes` 刪掉這句英文，以及對應中文（plans README 已列出各工具）：

```text
Grok Build writes `~/.grok/sessions/<cwd>/<session-id>/plan.md`; Cursor, Claude Code, Codex, OpenCode, and Copilot each have their own plan surface. 
```

然後在「開新產品」列之後加 **一列**漸進披露（不要加硬規則）：

```markdown
| 可選 Rust sidecar | [flavors](docs/guides/flavors.zh.md)（`--with-rust-sidecar`；不是 flavor） |
```

改之前重測。若餘額仍不夠，放棄該列，只留文件指針。巢狀 `apps/*/AGENTS.md` 不動。php-bridge 仍然略過 agent stub。

若有新 skill，用薄包裝 `tooling/ysk-cli/templates/agent/skills/rust-sidecar/SKILL.md` 加 `.agents`／`.claude` 鏡像（位元組相同，`Use when`／`Do not`，中文觸發詞）。那**不**需要 AGENTS 列。`writeAgentStubs` 已經會複製每一個模板資料夾。

## 風險與回滾

| 風險 | 為何痛 | 緩解 |
|---|---|---|
| 1. Rust 第二套 domain | 授權／租戶漂移；`pnpm layers` 看不見 | 旗標文案 + crate README + ADR 補篇 + 可選 check-agent grep；review-change 的 Law 軸 |
| 2. 第七種 flavor | Matrix 爆炸；agent 選 `rust` 而不是 `saas` | 旗標疊加；未知 `--flavor rust` 仍是 `not in this phase` |
| 3. 名稱「worker」 | trading／gateway 操作者把 crate 接到 BullMQ | 面向使用者寫 **sidecar**；HELP 保持 `pnpm worker` 是隊列 |
| 4. 必跑 CI 要 rustc | Actions 配額用盡時無法合併；沒有 Rust 的 dest smoke 失敗 | 預設測試不需 rustc；可選本機腳本 |
| 5. AGENTS 超過 24 KiB | 套件與已升級產品的 `check agent` 變紅 | 不修剪就不加列；重測 |
| 6. Envelope 例外 | 本機 HTTP sidecar 變成公開 API | v1 只用 stdio |
| 7. 密文不匹配 | 生產環境默默解密失敗 | Golden 向量；VERSION 位元組 |
| 8. 密鑰外洩 | 金鑰進 argv／日誌 | 只用 env；永不記錄；security-review |
| 9. napi／Electron ABI | desktop flavor 重建地獄 | v1 不做 native addon |
| 10. 發明目錄名稱 | 違反 AGENTS 先問 | 重用 `crypto`；未決問題 1 |
| 11. 計劃 PR 寫 changelog | 暗示發佈 | 本 PR 只有計劃檔 |
| 12. 暗示 Tauri 可用 | 精靈曾經踩過 | 維持「已延後／不搭」 |

本 PR 回滾：還原計劃 commit。稍後實作 PR：還原旗標、模板、文件、changeset；dest 產品在自行刪除之前會留下 crate（`upgrade` 不應刪掉產品自己加的 sidecar，除非我們稍後另做 — v1 upgrade **不要**刪 sidecar）。

## 任務清單

按順序。步驟 0 是本計劃 PR。步驟 1–7 是**批准後**的實作 PR。不要從本分支開始 1–7。

0. [x] 研究紀錄（本檔）
   - **檔案：** `docs/plans/2026-11-08-rust-create-app-choice.md`、`docs/plans/2026-11-08-rust-create-app-choice.zh.md`
   - **介面／合約／資料：** 沒有
   - **風險：** `plan --check` 標題
   - **回滾：** 還原該 commit
   - **驗收：** 兩條 `--check` 印出 ok；狀態是草稿 — 等擁有者；沒有 flavor／運行時代碼；沒有 changeset

1. [ ] ADR + 使用者文件（若擁有者要先只出文件，仍可不含 crate；預設與 2–6 同一 PR）
   - **檔案：** `docs/adr/0002-polyglot-clients.md` + `.zh.md`（補篇）；`docs/guides/flavors.md` 配對；`docs/cli/create-ysk-app.md` 配對；`docs/architecture.md` 配對；`docs/skills/new-product.md` 配對；`docs/product-plan.md` 配對；recipe 配對；可選 skill 配對 + 三份包裝副本
   - **介面／合約／資料：** 沒有 HTTP。ADR 狀態只在擁有者同意時變成已接受
   - **風險：** 暗示 Tauri 已就緒；AGENTS.md 位元組
   - **回滾：** 還原那些文件
   - **驗收：** 中英深度一致；沒有 TypeScript `enum`；`docs-pair` 綠；除非批准修剪+列，否則不碰 AGENTS.md

2. [ ] create-app 旗標與精靈
   - **檔案：** `tooling/create-ysk-app/src/scaffold.ts`、`prompt.ts`、`wizard-copy.ts`、`help.ts`、`index.ts`、`prompt.test.ts`、`index.test.ts`
   - **介面／合約／資料：** `--with-rust-sidecar`；摘要行；php-bridge／static-web3 用 `PRESET_SKIP` 風格忽略
   - **風險：** `--yes` 仍去提問；flavor 1–6 編號不變
   - **回滾：** 還原那些檔
   - **驗收：** `--yes` 沉默且預設關；TTY Enter = no；未知 `--flavor rust` 仍是 `not in this phase`；測試覆蓋開／關／忽略／取消

3. [ ] Sidecar 模板 + dest adapter
   - **檔案：** `tooling/create-ysk-app/templates/rust-sidecar/**`（`Cargo.toml`、穩定釘的 `rust-toolchain.toml`、`src/main.rs`、README 配對、`.gitignore` 的 `target/`）；dest 路徑 `crates/ysk-sidecar/`、`apps/api/src/infra/rust-crypto-adapter.ts`；dest 根 `.gitignore` 的 `crates/**/target/`
   - **介面／合約／資料：** 私有 stdio；`ICryptoPort`；沒有 `/v1/`
   - **風險：** `unsafe`；過多 crates.io 依賴；密文不匹配
   - **回滾：** 刪模板目錄與複製掛鉤
   - **驗收：** crate README 寫明不是公開 API；沒有 Axum／Actix；沒有 `unsafe`；Node golden 向量存在；adapter 測試用假子行程

4. [ ] 可選本機 smoke（不是必跑 CI）
   - **檔案：** `.github/scripts/rust-sidecar-smoke.sh`（沒有 rustc 則 skip 0）；Actions 配額用盡期間 **不要** 在 `.github/workflows/ci.yml` 加 matrix 格
   - **介面／合約／資料：** 沒有
   - **風險：** 有人把它改成必跑
   - **回滾：** 刪該腳本
   - **驗收：** 預設 flavor-smoke 腳本不變；本機腳本在有 rustc 時跑 `cargo test` + Node 往返

5. [ ] 護欄（doctor／check agent／supply）— 保持很小
   - **檔案：** 可選 `check-agent.ts` 規則 `rust-sidecar-boundary`（Cargo.toml 不可依賴 axum／actix-web／warp；README 提到 ICryptoPort）；若 `CRYPTO_ADAPTER=rust` 但沒有 crate 則 doctor 警告；v1 **不**要求目錄 rustc 下限
   - **介面／合約／資料：** 沒有
   - **風險：** 對無關的未來 crate 誤報
   - **回滾：** 去掉該規則
   - **驗收：** `pnpm layers` 仍是 TS 權威；套件本身沒有 `crates/` 時 check agent 仍 ok

6. [ ] 驗證
   - **檔案：** 沒有額外
   - **介面／合約／資料：** 沒有
   - **風險：** OpenAPI dirty；AGENTS 預算
   - **回滾：** 還原實作 PR
   - **驗收：** 本機 `pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent && pnpm ysk-kit check errors` 綠；OpenAPI 不變

7. [ ] 變更紀錄／changeset
   - **檔案：** `CHANGELOG.md` 配對、README 最近三個版本、`docs/history.md` 配對、`.changeset/rust-sidecar.md`
   - **介面／合約／資料：** 沒有
   - **風險：** 手改版本號
   - **回滾：** 還原那些檔
   - **驗收：** create-app（以及若有掃描則 cli）的 patch；實作 PR 不改 `package.json` 版本；該 PR 不發佈 npm

## 未決問題

給擁有者的五條套件原生問題（clarify-feature 題幹）。不要猜測。任何實作 PR 之前，把答案折進假設／範圍。

1. **Flavor／preset／capabilities。** 確認 **方案 A**：在 API 類 flavor 上疊加 `--with-rust-sidecar`，**不是**第七種 flavor，也**不是**新的 `ysk-kit add` 目錄名稱（重用 `crypto`）。或者你其實要先做 **B**（`desktop-tauri`）或 **C**（Rust OpenAPI 客戶端）。
2. **Envelope。** 確認 v1 IPC 是**子行程私有 stdio**（沒有公開 HTTP、沒有新 envelope 例外、沒有公開 gRPC、沒有 napi-rs）。若答「要 HTTP sidecar」，**並不**批准例外；它留在這裏。
3. **授權。** 確認 sidecar 是**行程本機**（API spawn 它）；沒有新角色／權限；`CRYPTO_MASTER_KEY` 留在 env，永不進 argv／日誌。或者指出另一種信任邊界。
4. **UI 表面。** 確認 v1 **沒有客戶端畫面**（只有精靈 TTY；web／admin／mobile／desktop 不變），且 TTY 預設是 **no**。
5. **Living kit 對 dest-only。** 確認 crate 是**只有模板**（php-bridge 風格），因此本倉不會長出 `pnpm test` 必須編譯的 living `crates/`。或者要求倉內 living crate（那時需要不依賴已耗盡 Actions 的 rustc 故事）。

後續、不是本輪：rustc 精確釘選（實作時量；此 worker 有穩定版 1.99.1）、supply-scan 的 `cargo audit`、第 2 階段 OpenAPI-Rust 客戶端、有產品付錢時的 Tauri。
