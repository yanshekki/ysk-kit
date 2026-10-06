# 計劃：Published Esm Bins

Language: 英文配對 `2026-10-06-published-esm-bins.md` · 中文 `2026-10-06-published-esm-bins.zh.md`

| | |
|---|---|
| **Slug** | `published-esm-bins` |
| **日期** | 2026-10-06 |
| **狀態** | approved |
| **正規檔** | `docs/plans/2026-10-06-published-esm-bins.md` |
| **工作階段指針** | `/plan.md`（已 gitignore） |

法律：[AGENTS.zh.md](../../AGENTS.zh.md)。程序：[plan-feature](../skills/plan-feature.zh.md)。檢查：`pnpm ysk-kit plan --check docs/plans/2026-10-06-published-esm-bins.zh.md`。

使用者已寫明故障、26 個套件的審計、Release 缺 tag、文件指令、鎖步 changeset，以及「只開一個 PR、不要合併」。此計劃視為已批准。

## 目標與使用者問題

已發佈的 `@ysk-kit/create-app` 與 `@ysk-kit/cli` 不能執行。`package.json` 是 `"type": "module"`，bin 指向 `dist/index.js`，但該檔沒有 `#!/usr/bin/env node`，所以 shell 執行 bin 會出現 `import: not found`。同一套 `tsc` 輸出使用沒有副檔名的相對路徑（`import { HELP } from './help'`），因此 `node dist/index.js` 會以 `ERR_MODULE_NOT_FOUND` 失敗。26 個公開程式庫的 `dist/` 都是同一種輸出。Release 工作流程把 v1.2.1 發到 npm，但沒有 annotated `v1.2.1` tag 或 GitHub Release，`create-ysk-app` 無法下載它剛發佈的 kit 樹。

## 範圍

- 包含：每個公開 `@ysk-kit` 套件的 `dist/` 都是有效 Node ESM；CLI bin 有 shebang 且可執行；`pack-and-run` CI job；文件寫明 `npm create @ysk-kit/app`／`pnpm create @ysk-kit/app`；鎖步 patch changeset；v1.2.2 變更紀錄與 README 三版本窗口；Release 在成功發佈後建立 `vX.Y.Z` tag 與 GitHub Release，並安裝那些 tarball、執行 CLI bin 做驗證；一個 PR、CI 全綠、不合併、不從本次工作發佈 npm。

## 非目標

- 不含：合併 PR、發佈 1.2.2、補上缺失的 `v1.2.1` tag、把 apps 打包、改 dest 的 copy-tree、新增無 scope 的 `create-ysk-app` 套件，或把 npm token 加回 Release。

## 假設

- 發佈認證仍然只使用 npm Trusted Publishing（OIDC）；環境不可出現靜態 npm 憑證變數。
- Dest 產品仍透過 `exports` 使用工作區 TypeScript `src/`，因此原始碼的 `.js` 路徑在 apps 的 `moduleResolution: bundler` 下必須仍然有效。
- `changesets/action` 維持 `create-github-releases: false` 與 `push-git-tags: false`；本倉自己建立單一產品 tag，因為自訂的 `pnpm release:publish` 輸出不是 Changesets 的 tag 格式。
- 不在此改 branch protection；job 名稱固定為 `pack-and-run`，以便之後設為 required check。

## 受影響的 flavor／preset／capability

| 軸 | 值 | 備註 |
|---|---|---|
| Flavor | kit 本身 | dest 樹經 copy-tree 繼承套件原始碼與 tsconfig |
| Preset | thin／full | 兩者都複製 `packages/*` 與兩個 CLI |
| Capabilities | 不適用 | 沒有目錄 add；只改發佈與工具 |

## 現況與重用

根目錄 `tsconfig.base.json` 已經設定 `"module": "NodeNext"` 與 `"moduleResolution": "NodeNext"`。每個公開套件把它覆寫成 `ESNext`／`bundler`，所以 `tsc -p tsconfig.build.json` 會把沒有副檔名的路徑抄進 `dist/`。Apps 繼續用 bundler（Vite／Expo）。重用 `.github/unpublished-packages.mjs` 的 `publicPackages()`、只走 OIDC 的發佈腳本、`ci-workflows.test.ts`、`sync-kit-version.test.ts` 鎖步，以及現有 CI job 佈局。

| 路徑 | 符號 | 重用為 |
|---|---|---|
| `tsconfig.base.json` | NodeNext | 公開套件去掉 bundler 覆寫 |
| `.github/unpublished-packages.mjs` | `publicPackages` | pack-and-run 與 tag-and-release |
| `.github/publish-packages.mjs` | OIDC 斷言、`npm view` 等待 | 發佈後呼叫；不加入 token |
| `.github/workflows/release.yml` | changesets/action | 保留版本 PR；發佈後加 tag／Release／驗證 |
| `tooling/ysk-cli/src/ci-workflows.test.ts` | 工作流程斷言 | 不再依賴 `published == true` |
| `tooling/ysk-cli/src/sync-kit-version.test.ts` | 鎖步 26 | 新的 patch changeset 必須列出全部 26 個 |
| `tooling/create-ysk-app/src/kit-root.ts` | `resolveKitCommit` | 發佈後仍然需要 tag `v{version}` |

## 考慮過的方案

| 方案 | 複雜度 | 分層 | 遷移 | 客戶端 | 備註 |
|---|---|---|---|---|---|
| A. 公開套件相對 import 使用明確 `.js`，繼承 NodeNext；CLI `index.ts` 加 shebang；`tsc` 輸出即為有效 ESM | 中 | 套件 + 兩個 CLI + CI | 原始碼路徑變更；dest 一併複製 | 無（apps 仍用 bundler） | 符合 `tsconfig.base.json`；typecheck 會抓住漏加的副檔名 |
| B. 只用 tsup／esbuild 打包 CLI 並加 shebang banner；程式庫維持沒有副檔名的 `tsc` | bin 低 | 兩個 CLI | 新的 bundler | 無 | `import('@ysk-kit/contracts')` 仍然失敗；使用者要求每個套件的 dist 都是有效 Node ESM |
| C. 編譯後改寫 `dist/` 插入 `.js` 與 shebang，原始碼維持沒有副檔名 | 低 | build 腳本 | 兩套表示 | 無 | 會靜默漂移；`tsc --noEmit` 守不住 tarball |

**選定：** A。  
**原因：** 根 tsconfig 已經是 NodeNext。明確 `.js` 是 TypeScript Node ESM 合約，copy-tree 到 dest 產品仍然有效，而且有人再寫 `from './foo'` 時 `pnpm typecheck` 會失敗。只打包 CLI 修不好其餘 24 個程式庫。改寫 dist 會讓 typecheck 看不見這個錯誤。Apps、Vite、Expo 維持 `moduleResolution: bundler`。合約先行與六角分層規則不變。

## 合約先行

沒有新的 DTO、command、error code 或 ts-rest 路徑。這是發佈與 CLI 打包。Envelope 與 `@ysk-kit/contracts` 維持現狀。

| 項目 | 名稱／路徑 | 備註 |
|---|---|---|
| DTO | 沒有 | 只改打包 |
| Command | 沒有 | 只改打包 |
| Error codes | 重用既有，除非新 code 有理由 | 不新增 |
| Paths | 沒有 | 沒有 HTTP 變更 |

## 資料模型／Prisma 與遷移

沒有。沒有 Prisma model、欄位或遷移。不需要 `pnpm db:migrate`。

## 模組切片與分層

沒有。不改 `apps/api/src/modules/*`。Domain 與 application 仍然不引入 Express、Fastify、Prisma、React、BullMQ。相對路徑改寫只發生在既有的 `packages/*/src` 與 `tooling/{create-ysk-app,ysk-cli}/src`。

## SDK／web-sdk／客戶端表面

沒有新的 SDK resource、hook 或畫面。`packages/sdk` 與 `packages/web-sdk` 只在自己的相對 import 加上 `.js`，讓發佈後的 `dist/` 可被 Node ESM 載入。客戶端仍然只經 `@ysk-kit/sdk` 呼叫 API。沒有 raw `fetch`。客戶端沒有 Prisma。

## Jobs／mail／realtime／notifications

沒有。沒有隊列名稱、郵件模板、socket 事件或站內通知。

## 安全與私隱

發佈仍然只使用 OIDC Trusted Publishing。Release 不可設定靜態 npm 憑證，也不可給 `setup-node` 設 `registry-url` 或 `scope`。Tag 與 Release 使用既有 `contents: write` 的 `GITHUB_TOKEN`。沒有新密鑰、OTP 日誌或個人資料。

## 測試計劃

風險順序：已發佈 tarball 不能 import（使用者無法開倉）；CLI bin 不能啟動；Release 發佈了卻沒有 `vX.Y.Z`，create-app 不能下載 kit；鎖步版本不一致。

- given 公開套件原始碼有相對 import，when 掃描，then 路徑以 `.js`／`.json`／`.mjs` 結尾。
- given CLI `src/index.ts`，when 讀取，then 第一行是 `#!/usr/bin/env node`。
- given `pnpm build:packages` 然後 `pnpm pack`，when 在乾淨暫存目錄安裝那些 tarball，then 全部 26 個 `node -e "import('@ysk-kit/<pkg>')"` 成功，`create-ysk-app --help` 與 `ysk-kit --help`／`yskk --help` 印出用法，而且倉內 `node dist/index.js <dest> --yes` 能對 living kit 開倉。
- given 成功發佈且沒有待處理 changeset，when 執行 `tag-and-release.mjs`，then 在 `GITHUB_SHA` 建立 annotated `vX.Y.Z` 與 GitHub Release，說明取自該版本的 `CHANGELOG.md` 章節；若仍有待處理 changeset，則不打 tag（版本 PR 路徑）。
- given 待處理 changeset 集合，when 跑 `sync-kit-version.test.ts`，then 全部 26 個公開名稱以同一種 bump 出現。

- [x] Memory-repo 服務案例 — 不適用（沒有 HTTP 模組）
- [x] Envelope／error code 案例 — 不適用
- [x] 資源有擁有者時，授權／租戶／另一作者案例 — 不適用
- [x] 若改了 UI，hooks 只經 SDK — UI 套件只改 import 路徑
- [x] 僅在改了登入、shell 或使用者可見路徑時才加 Playwright／ui-review — 沒有 UI 流程變更

夾具：`publicPackages()` 的公開套件清單；給 `changelogSection` 用的假變更紀錄標題；給 `tagPlan` 用的 SHA 相等。不涵蓋：真正發佈到 npm、移動 `v1.2.1` tag、啟動 Redis／Stripe。

## 驗證命令

| 命令 | 預期結果 |
|---|---|
| `pnpm layers` | 退出碼 0；客戶端不碰 Express／Prisma／jobs／mail／push／AWS SDK |
| `pnpm typecheck` | 退出碼 0；公開套件使用 NodeNext |
| `pnpm test` | 退出碼 0，包括路徑、shebang、工作流程、鎖步測試 |
| `pnpm gen:openapi` | `docs/openapi.yaml` 與 ts-rest 合約相符（不變） |
| `pnpm ysk-kit check agent` | 印出 `ysk-kit check agent: ok` |
| `pnpm ysk-kit plan --check docs/plans/2026-10-06-published-esm-bins.zh.md` | 印出 `ysk-kit plan --check: ok` |
| `pnpm lint` | 退出碼 0 |
| `node .github/pack-and-run.mjs` | 打包 26 個、每個都能 import、CLI `--help` 可用、倉內 create 可用 |

可選：`pnpm e2e` 不變（沒有改登入／shell）。Grok Build：`grok inspect`。

### 人手檢查

沒有 UI、HTTP 或授權改動，省略 UI／envelope／角色流程。確認文件寫的是 `npm create @ysk-kit/app`，沒有指引讀者安裝無 scope 的 `create-ysk-app` 套件。

- [x] UI 流程：沒有
- [x] Envelope 形狀 `{ ok: true, data }`／`{ ok: false, error }`：不變
- [x] 授權角色：不變

## 文件／變更紀錄／changeset

- [x] `docs/cli/create-ysk-app.md`（及中文）、getting-started、README 指令、CLI HELP：`npm create @ysk-kit/app` 與 `pnpm create @ysk-kit/app`；npm 上沒有無 scope 的 `create-ysk-app`
- [x] `CHANGELOG.md`／`CHANGELOG.zh.md` 的 v1.2.2 修正 + 內部／CI；README 最近三個版本改為 1.2.2、1.2.1、1.2.0（1.1.3 已在完整變更紀錄）
- [x] Patch changeset 列出全部 26 個公開 `@ysk-kit` 套件
- [x] `docs/cli/workspace-scripts.md`（及中文）與 `docs/guides/testing.md`（及中文）：`pack-and-run` job；Release 在發佈後打 tag

## 風險與回滾

- 套件改用 NodeNext 時，若相對 import 指向目錄卻沒有 `/index.js`，typecheck 會失敗 — 改寫腳本必須分辨檔案與目錄；閘是 `pnpm typecheck`。
- 在乾淨目錄安裝 argon2／OpenTelemetry／AWS SDK 可能慢或需要編譯器 — timeout 20 分鐘；明確安裝 peer：`react`、`react-dom`、`@tanstack/react-query`、`pino`。
- Tag 步驟不可在 Changesets 版本 PR 路徑執行（該 commit 仍有待處理 changeset 檔）— `pendingChangesetFiles().length > 0` 時跳過 tag。
- 移動既有 tag 會破壞 create-app 完整性 — 若 `vX.Y.Z` 已指向另一個 SHA，就失敗。
- 回滾：還原 PR。沒有遷移。不要 unpublish npm 版本。

## 任務清單

1. [x] 合約
   - **檔案：** 沒有
   - **介面／合約／資料：** 沒有
   - **風險：** 沒有
   - **回滾：** 不適用
   - **驗收：** DTO + `OkSchema`／`ErrSchema` 存在；沒有 TypeScript `enum` — 沒有新合約；沒有新增 `enum`
2. [x] 骨架
   - **檔案：** 沒有（不適用 `ysk-kit add module`）
   - **介面／合約／資料：** 沒有
   - **風險：** 沒有
   - **回滾：** 不適用
   - **驗收：** 適用時使用 `ysk-kit add module`／`add <capability>` — 本次不適用
3. [x] Application 規則
   - **檔案：** 公開 `packages/*/src`、`tooling/create-ysk-app/src`、`tooling/ysk-cli/src`、那些 `tsconfig.json`、CLI `package.json` 的 `build`
   - **介面／合約／資料：** 相對路徑以 `.js` 結尾；CLI `index.ts` 有 shebang；`tsc` 之後 `chmod +x dist/index.js`
   - **風險：** 漏改目錄 import
   - **回滾：** 還原路徑 commit
   - **驗收：** 記憶體 port 測試通過；`tsc` 輸出可用 `node` 載入
4. [x] 客戶端
   - **檔案：** apps 維持 bundler tsconfig；沒有改畫面
   - **介面／合約／資料：** 沒有
   - **風險：** dest 複製套件的 `.js` 路徑
   - **回滾：** 還原
   - **驗收：** 只用 SDK／web-sdk — 仍然成立
5. [x] 驗證
   - **檔案：** `.github/pack-and-run.mjs`、`.github/tag-and-release.mjs`、`ci.yml`、`release.yml`、`ci-workflows.test.ts`、`published-esm.test.ts`
   - **介面／合約／資料：** CI job `pack-and-run`；發佈後 tag + Release + tarball 驗證
   - **風險：** Changesets 的 `published` 輸出仍是 false — 不要用它做條件
   - **回滾：** 還原工作流程檔
   - **驗收：** 上表驗證命令全綠
6. [x] 文件
   - **檔案：** README 配對、CHANGELOG 配對、create-ysk-app 手冊、workspace-scripts、測試指引、changeset
   - **介面／合約／資料：** 沒有
   - **風險：** 手冊仍寫無 scope 的 create 指令
   - **回滾：** 還原文件
   - **驗收：** 中英配對深度一致

## 未決問題

- 沒有。使用者已選定 NodeNext 或打包、pack-and-run、發佈後打 tag、鎖步 26、一個 PR、不合併。
