# 計劃：供應鏈掃描

Language: 英文配對 `2026-10-23-supply-scan.md` · 中文 `2026-10-23-supply-scan.zh.md`

| | |
|---|---|
| **Slug** | `supply-scan` |
| **日期** | 2026-10-23 |
| **狀態** | accepted |
| **正規檔** | `docs/plans/2026-10-23-supply-scan.md` |
| **工作階段指針** | `/plan.md`（已 gitignore） |

法律：[AGENTS.zh.md](../../AGENTS.zh.md)。程序：[plan-feature](../skills/plan-feature.zh.md)。檢查：`pnpm ysk-kit plan --check docs/plans/2026-10-23-supply-scan.zh.md`。

## 目標與使用者問題

Agent 現有 `security-review`（以 diff 為範圍的授權與密鑰；明確不適用於一般依賴升級）以及 CI 的 `pnpm audit`（只看 npm GHSA）。他們無法回答：此機器上的 Node、PHP、Linux kernel，或此倉的 engines／composer／lockfile／Actions pin，是否低於已知的嚴重下限？php2shell（CVE-2026-109618／CVE-2026-109619）與 Node Brotli RCE（CVE-2026-111497）的下限在**直譯器**，不在 `pnpm-lock.yaml`。結果 agent 不做，或 `npx` 不明掃描器。

結果：`pnpm ysk-kit check supply [--json] [--repo-only] [--online]` 加上 skill `supply-scan`，讓 agent 盤點第三方程式與版本；當具名 CVE 新於 `catalog.updated` 時更新內建目錄；修補時不寫 exploit PoC、不引入 Trivy。

## 範圍

- 包含：skill `supply-scan`（文件配對 + templates／`.agents`／`.claude` 包裝）。
- 包含：`ysk-kit check supply`，與 `check agent`／`check errors`／`check logs` 並列。
- 包含：內建目錄 `tooling/ysk-cli/src/supply/catalog.json`，記入 2026 年 10 月 Node／PHP 下限、少量 npm 失陷套件種子、Linux kernel 提醒。
- 包含：收集主機 Node／pnpm／PHP／`uname`+os-release；倉內 `engines.node`、`packageManager`、composer `require.php`、compose image 標籤、GitHub Actions `uses:` SHA 對 tag、lockfile 名稱@version 對種子。
- 包含：`--online` 包裝 `pnpm audit --json` 並尊重 `auditConfig.ignoreGhsas`。CI 以 `pnpm ysk-kit check supply --repo-only --online` 取代 `pnpm audit --audit-level=low`。
- 包含：給 agent 的 `--json`。預設文字列與其他 check 相同。
- 包含：把 kit `engines.node` 升到 `>=26.12.1`，php-bridge `"php": ">=8.2.35"`。
- 包含：doctor 檢查 id `supply`（執行中的 Node 低於目錄下限為 error；kernel 提醒為 warning）。
- 包含：verify-change 條件額外項；security-review 供應鏈指向此 skill；AGENTS.md 漸進披露列；CLI 手冊配對；recipe；changelog／README 窗口；lockstep changeset；smoke 與 `docs-pair` SKILLS 陣列。

## 非目標

- 不含：Trivy、Grype、OSV-Scanner 二進制，或執行它們的新 GitHub Action。
- 不含：v1 即時呼叫 OSV.dev HTTP。
- 不含：從 `uname -r` 宣稱 kernel 已修補；因 GitHub-hosted kernel CVE 讓 CI 失敗。
- 不含：撰寫或執行 exploit PoC（php2shell、Dirty Frag、npm 蠕蟲）。
- 不含：新 HTTP 路由、Prisma、SDK、envelope 例外或 capability 名稱。
- 不含：把 CVE 規則併進 `check agent`。
- 不含：用 `dpkg -l` 掃遍發行版套件；完整 SBOM 流水線；Snyk。

## 假設

- 2026-10-23 的 `actions/setup-node` `node-version: 26` 會解析到 ≥26.12.1。若 CI 仍落到 26.12.0，就把 patch 版本釘死為 `26.12.1`。
- 目錄會過期；skill 的研究迴圈（上游公告 → 改目錄 → 再跑）才是更新機制，不是每日爬取。
- php-bridge 沒有 `composer.lock`；在有 lockfile 之前，PHP 約束就是倉內訊號。
- 硬規則 9：Vitest 永不呼叫 npm registry、OSV 或掃描器二進制。線上 audit 以錄製 JSON 注入。
- Doctor 比 CLI 寬鬆：dest 產品若仍是 `engines.node >=26.0.0`，doctor 不因此 error；`check supply` 仍會對 `constraint-below-floor` 失敗，直到他們提高範圍。

## 受影響的 flavor／preset／capability

| 軸 | 值 | 備註 |
|---|---|---|
| Flavor | kit 本身 | CLI 與 skill 經 `ysk-kit upgrade`／`create-ysk-app` 抄到所有 flavor。php-bridge 是 PHP 約束表面 |
| Preset | thin／full | CLI + skill 兩者都帶 |
| Capabilities | 沒有新增 | 重用既有 `pnpm audit` 與 `ignoreGhsas`；不發明目錄名稱 |

## 現況與重用

先探索樹，才提議新檔。列出相關的既有檔案與符號，並寫出倉內路徑。

| 路徑 | 符號 | 重用為 |
|---|---|---|
| `tooling/ysk-cli/src/index.ts` | `check` 分派 | 加 `check supply` 分支 |
| `tooling/ysk-cli/src/help.ts` | `HELP` | Usage 與命令區塊 |
| `tooling/ysk-cli/src/check-logs.ts` | findings + formatter | 報告／`--json` 的形狀 |
| `tooling/ysk-cli/src/doctor.ts` | `parseVer`、`cmpVer`、`satisfiesRange` | 抽到 `semver-range.ts`；doctor id `supply` |
| `.github/workflows/ci.yml` | `pnpm audit --audit-level=low` | 換成 `check supply --repo-only --online` |
| `pnpm-workspace.yaml` | `auditConfig.ignoreGhsas` | 同一份 GHSA 清單 |
| `docs/skills/error-log-review.md` | skill + 包裝 | `supply-scan` 最接近的類比 |
| `docs/skills/security-review.md` | 供應鏈 | 只加指針；不要塞爆 |
| `tooling/ysk-cli/src/docs-pair.test.ts` | `SKILLS` | 追加 `supply-scan` |
| `.github/scripts/flavor-smoke.sh` | skill 檔清單 | 追加包裝路徑 |

最大缺口：沒有 runtime 盤點，也沒有 npm 以外世界級 CVE 的程序。

## 考慮過的方案

有真正替代方案時，至少列出兩個可行做法。

| 方案 | 複雜度 | 分層 | 遷移 | 客戶端 | 備註 |
|---|---|---|---|---|---|
| A kit 自有盤點 + 內建目錄 + 包裝 `pnpm audit` | 中 | CLI、skill、CI、doctor | 無 | 無 | 離線下限；`--online` 對 GHSA |
| B 預設加上 OSV-Scanner 或 Trivy | 高 | 新二進制 + Action SHA | 無 | 無 | Trivy 於 2026 年 3 月失陷（CVE-2026-33634）；測試不能啟動它 |
| C 只有 skill（`pnpm audit` + 網上搜尋） | 低 | 只改文件 | 無 | 無 | 沒有穩定 `--json`；agent 會發明 `npx` 掃描器 |

**選定：** A  
**原因：** php2shell 與 Node Brotli 是版本下限問題；kit 已有 check 命令形狀；security-review 已禁止不明掃描器 Action。

## 合約先行

DTO 名稱、欄位、error code、ts-rest 路徑。先加 `OkSchema`／`ErrSchema`，才寫 handler。

| 項目 | 名稱／路徑 | 備註 |
|---|---|---|
| DTO | 沒有 | 沒有 HTTP 資源 |
| Command | 沒有 | 沒有 ts-rest 路徑 |
| Error codes | 沒有 | CLI JSON 不是 envelope |
| 路徑 | 沒有 | 不加 `/v1/…` |
| CLI JSON | `check supply --json` | `{ ok, catalogUpdated, inventory, findings[] }` 給 agent |

## 資料模型／Prisma 與遷移

沒有。不加 Prisma model。不需要 `pnpm db:migrate`。

## 模組切片與分層

`apps/api` 無改動。domain 與 application 不碰 Express、Fastify、Prisma、React、BullMQ。行為全部在 `tooling/ysk-cli/src/supply/` 與既有 check 分派。

## SDK／web-sdk／客戶端表面

沒有。不加 SDK resource、web-sdk hook 或客戶端畫面。客戶端仍不可 import Prisma，亦不可 raw-fetch kit 路徑。

## Jobs／mail／realtime／notifications

沒有。不加隊列、郵件模板、socket 事件或站內通知。

## 安全與私隱

spawn `pnpm audit` 時不要把 registry token、`.npmrc` 憑證或 webhook 密鑰寫進日誌。不要加第三方 Action。重用 CI 已跑的 `pnpm audit`。Skill 禁止 exploit PoC 與對不明掃描器做 `npx`（與 security-review 一致）。收緊 `engines.node` 與 php-bridge PHP 範圍才是 2026 年 10 月 runtime 的實際修補；CLI 是讓 agent 發現下一宗事件的方法。程序：[security-review](../skills/security-review.zh.md)。

## 測試計劃

用 [test-plan](../skills/test-plan.zh.md) 填寫（按風險排序的 `given / when / then`、夾具、不涵蓋範圍、分層對應）。只用記憶體 port。不要啟動 Redis、Stripe、Twilio、FCM、Jaeger 或 Grafana。Trophy：`tooling/ysk-cli` 的 Vitest。永不打 registry。

- given Node `26.12.0` 且目錄下限 `26.12.1`，when 跑 `checkSupply`，then `runtime-below-floor` 寫出 CVE-2026-111497；given `26.12.1`，then 沒有 runtime finding。
- given `engines.node: ">=26.0.0"`，when `--repo-only`，then `constraint-below-floor`；given `>=26.12.1`，then 乾淨。
- given PHP `8.2.34`，then `runtime-below-floor`；given `8.2.35`，then 通過；given composer `>=8.2`，then `constraint-below-floor`；given PHP `8.1`，then `runtime-eol`；given 沒有 php 二進制且沒有 composer.json，then 跳過；`--repo-only` 跳過主機 PHP。
- given Linux `kernelRelease`，then `kernel-advisory` 為 warn 且退出 0；`--repo-only` 省略它。
- given lockfile 含 `@ctrl/tinycolor@4.1.1`，then `compromised-package`。
- given 錄製的 `pnpm audit --json` 含未忽略的 high GHSA，then `audit-advisory` 失敗；given 命中 `ignoreGhsas`，then 省略。Vitest 永不真正 spawn audit。
- given `uses: actions/checkout@v7`，then `action-unpinned`；given 40 字元 SHA，then 通過。
- given compose `image: mysql:latest`，then `image-unpinned`；given `mysql:8.4`，then 通過。
- given 本 kit 已升 engines／php，when `check supply --repo-only`，then `ysk-kit check supply: ok`。
- given doctor `nodeVersion` `26.12.0`，then `supply` 為 error；given `26.12.1`，then 通過（約束只由 CLI 處理）。
- given skill 包裝，then `docs-pair` 列出 `supply-scan` 且副本一致。

- [x] Memory-repo 服務案例 — 不適用（CLI 夾具，不是 HTTP port）
- [x] Envelope／error code 案例 — 不適用（沒有 HTTP）
- [ ] 資源有擁有者時，授權／租戶／另一作者案例 — 不在範圍
- [ ] 若改了 UI，hooks 只經 SDK — 不適用
- [ ] 僅在改了登入、shell 或使用者可見路徑時才加 Playwright／ui-review — 不適用

不涵蓋：即時 OSV、Trivy、`dpkg -l`、重現 exploit。

## 驗證命令

每條命令都有預期結果。按改動增刪列。

| 命令 | 預期結果 |
|---|---|
| `pnpm layers` | 退出碼 0；客戶端不碰 Express／Prisma／jobs／mail／push／AWS SDK |
| `pnpm typecheck` | 退出碼 0 |
| `pnpm test` | 退出碼 0；新 CLI 夾具；不打 registry／Trivy／OSV |
| `pnpm gen:openapi` | `docs/openapi.yaml` 相對 HEAD 無改 |
| `pnpm ysk-kit check agent` | 印出 `ysk-kit check agent: ok` |
| `pnpm ysk-kit check errors` | 印出 `ysk-kit check errors: ok` |
| `pnpm ysk-kit check supply --repo-only` | engines／php 提升後印出 `ysk-kit check supply: ok` |
| `pnpm ysk-kit plan --check docs/plans/2026-10-23-supply-scan.zh.md` | 印出 `ysk-kit plan --check: ok` |

可選：`pnpm lint`。不需要 `pnpm e2e`。Grok Build：`grok inspect`。

### 人手檢查

沒有 UI、HTTP 或授權改動。只檢查 CLI：

- [ ] `pnpm ysk-kit check supply --json` 印出 agent 可解析的 inventory + findings
- [ ] 本 kit 的 `--online` 與今日 `pnpm audit` 忽略行為一致
- [ ] 若已安裝 PHP，可跑 `php -v`；`--repo-only` 不要求它

## 文件／變更紀錄／changeset

- [ ] `docs/skills/supply-scan.md` 配對 + 包裝；recipe `scan-supply`；CLI 章節；security-review 供應鏈指針；verify-change 條件額外項
- [ ] `CHANGELOG.md`／`CHANGELOG.zh.md` 與 README 最近三個版本窗口（安全）
- [ ] 全部 26 個公開 `@ysk-kit/*` 套件的 lockstep patch changeset（`@ysk-kit/cli` 是可發佈表面）

另外：AGENTS 漸進披露、skills 目錄、debug-issue「不要用於 CVE 盤點」、architecture 一行、doctor 表、smoke 清單。

## 風險與回滾

目錄過期 — skill 研究迴圈；`updated` 欄讓延遲可見。CI Node 尚未 26.12.1 — 在 `setup-node` 釘 patch。生成產品在升級 CLI／engines 之前會 `constraint-below-floor` — doctor 不因此 error；changelog 記錄 engines 提升。錯誤的 kernel 失敗 — v1 永不因 kernel 退出 1。回滾：還原 CLI 命令與 CI 步驟；恢復 `pnpm audit --audit-level=low`；若 engines 提升已是正確修補則保留。

## 任務清單

按順序列出。每步寫明要改的檔案、介面／合約／資料變更、風險、回滾、驗收條件。

1. [ ] 計劃檔
   - **檔案：** `docs/plans/2026-10-23-supply-scan.md`、`.zh.md`
   - **介面／合約／資料：** 沒有
   - **風險：** 標題仍是佔位
   - **回滾：** 刪日期配對
   - **驗收：** 兩檔 `pnpm ysk-kit plan --check` 通過
2. [ ] Semver 抽出 + 目錄 + CLI
   - **檔案：** `tooling/ysk-cli/src/semver-range.ts`、`supply/catalog.json`、`supply/check-supply.ts`、`check-supply.test.ts`、`index.ts`、`help.ts`、`doctor.ts`
   - **介面／合約／資料：** `checkSupply(root, opts) → report`；旗標 `--json` `--repo-only` `--online`
   - **風險：** Vitest 內真正跑 `pnpm audit`
   - **回滾：** 刪新檔；還原分派
   - **驗收：** 夾具案例綠燈；HELP 含 `check supply`
3. [ ] Runtime 下限
   - **檔案：** 根 `package.json` `engines.node`；php-bridge `composer.json`；doctor 提示／測試
   - **介面／合約／資料：** `>=26.12.1`；PHP `>=8.2.35`
   - **風險：** 本機 Node 26.12.0
   - **回滾：** 只還原 engines
   - **驗收：** 本 kit `check supply --repo-only` 通過
4. [ ] CI + smoke + SKILLS
   - **檔案：** `.github/workflows/ci.yml`、`flavor-smoke.sh`、`docs-pair.test.ts`、`upgrade.test.ts`、`agent-stubs.test.ts`
   - **介面／合約／資料：** CI 命令對換
   - **風險：** 線上 audit 噪音對今日忽略清單
   - **回滾：** 恢復 `pnpm audit --audit-level=low`
   - **驗收：** `ignoreGhsas` 行為相同
5. [ ] Skill + 文件
   - **檔案：** `docs/skills/supply-scan.md` 配對、包裝、目錄、AGENTS.md、CLI 手冊、recipe、security-review、verify-change、debug-issue、architecture、security.mdc
   - **介面／合約／資料：** 沒有
   - **風險：** skill-drift／24 KiB 預算
   - **回滾：** 還原文件與包裝
   - **驗收：** 中英配對深度一致；`check agent: ok`
6. [ ] Changeset + changelog
   - **檔案：** `.changeset/*.md`、`CHANGELOG.md` 配對、README 窗口
   - **介面／合約／資料：** lockstep patch
   - **風險：** 漏掉公開套件
   - **回滾：** 刪 changeset
   - **驗收：** 列出 26 個套件；README 有安全條
7. [ ] 驗證
   - **檔案：** 無額外
   - **介面／合約／資料：** 沒有
   - **風險：** 驗證鏈耗時
   - **回滾：** 不適用
   - **驗收：** 上表驗證命令全綠

## 未決問題

- 後續（不是 v1）：`--online` 對已盤點的 Node／PHP PURL 查 OSV.dev，測試仍用夾具。
- 稍後是否加 `--strict-host` 處理 kernel。預設維持只 warn。
- Electron runtime 下限：除非 desktop flavor 之後要寫進同一目錄，否則跳過。
