# 計劃：重新檢查穩定版本（v1.6.1）

Language: 英文配對 `2026-10-15-stable-versions.md` · 中文 `2026-10-15-stable-versions.zh.md`

| | |
|---|---|
| **Slug** | `stable-versions` |
| **日期** | 2026-10-15 |
| **狀態** | accepted |
| **正規檔** | `docs/plans/2026-10-15-stable-versions.md` |
| **工作階段指針** | `/plan.md`（已 gitignore） |

法律：[AGENTS.zh.md](../../AGENTS.zh.md)。程序：[plan-feature](../skills/plan-feature.zh.md)。檢查：`pnpm ysk-kit plan --check docs/plans/2026-10-15-stable-versions.zh.md`。

### 背景

使用者要求重新檢查所有軟件是否穩定版（`npm dist-tag latest`／Docker 穩定 tag／Node LTS 若那是套件政策）。npm 查詢日期 2026-10-15。

`origin/main` 是套件 **v1.6.0**。預發佈釘選是 v1.3.0／v1.4.0／v1.5.0 刻意送出：

| 釘選 | 送出 | npm 2026-10-15 |
|---|---|---|
| `electron-vite@6.0.0-beta.8` | v1.3.0 | **`latest=6.0.0`**（2026-10-14T16:05Z 發佈） |
| `react-native@0.88.0-rc.4` | v1.4.0 | **`latest=0.88.0`**（2026-10-15T14:08Z 發佈）。Expo 58.0.10 `bundledNativeModules.json` 仍列 `0.88.0-rc.4` |
| `expo@^58.0.7` | v1.4.0 來自 `next` | `next=58.0.10`，**`latest` 仍是 57.0.30** |
| Node 26 Current | v1.5.0 | Node **26.12.0** 仍是 `lts=false`。LTS 是 Node 24.22.0 Krypton |
| `@ts-rest/core@3.53.0-rc.1` | ADR 0001 | `latest=3.52.1`，`rc=3.53.0-rc.1`（沒有更新的 release） |
| Prisma 7.10.0 | 暫緩 | CLI `latest=8.0.0-rc.23`；`@prisma/client` `latest=7.10.0` |
| TypeScript 6.0.3 | 暫緩 | `latest=7.0.2` |

本 PR 開出後，在 Dependabot PR 留言取代：#53（setup-node 7.1.0）、#54（react-query）、#55（s3-presigner）、#56／#62（bull-board）、#57（happy-dom 21）、#58／#61（playwright）、#59／#60／#63（OTEL——`@opentelemetry/resources@2.12.0` 現已存在）。

## 目標與使用者問題

v1.3.0 用 electron-vite **beta** 送出桌面 Vite 8。v1.4.0 用 React Native **RC** 送出 Expo 58。頻道已變：electron-vite 6.0.0 是 npm `latest`，React Native 0.88.0 是 npm `latest`。樹內 `package.json`、`pnpm-workspace.yaml` 與架構文件仍寫預發佈釘選，目的地產品會複製 beta／RC。

結果：一條 PR 把那些釘選升到現時穩定 tarball，一併收取 Dependabot 已開的同主版 `latest` 補丁，記錄所有仍是預發佈的暫緩，26 個公開套件鎖步 **patch** 預備 v1.6.1，然後等 CI。本工作階段不 merge、不發佈。

## 範圍

- 包含：從現時 `origin/main` 開分支 `cursor/stable-versions-0908`。
- 包含：`apps/desktop/package.json` `electron-vite` 精確 `6.0.0-beta.8` → 精確 **`6.0.0`**。`electron` `^44.5.1` → `^44.7.2`。`vite` `^8.3.2` → `^8.3.4`。`@vitejs/plugin-react` `^5.2.0` → `^6.1.2`（web／admin 已在 6.x；5.2.0 只因 electron-vite 5 的 peer 是 Vite 5–7 才暫緩）。
- 包含：`apps/mobile/package.json` `expo` `^58.0.7` → `^58.0.10`（`next`）。`react-native` `0.88.0-rc.4` → 精確 **`0.88.0`**。工作區 `react`／`react-dom` override 維持 **19.3.0**（Expo 58.0.10 `bundledNativeModules` 仍釘 `19.3.0`；不要漂到 React 19.3.1）。`expo-secure-store ~58.0.2` 與 `expo-status-bar ~58.0.3` 維持，除非 `expo install --fix` 在 58.x 內改動。在 `pnpm-workspace.yaml` override Expo CLI 殘留的 `@react-native/*` `0.88.0-rc.4` 傳遞依賴到 **`0.88.0`**，鎖檔不要同時留 RC 與穩定 `react-native`。
- 包含：同主版 `latest` specifier 與鎖檔刷新：
  - 根：`packageManager` `pnpm@12.9.0` → **`pnpm@12.11.2`**（`latest`；不取 `next-12` 12.14.0）。`turbo` `^2.11.7` → `^2.11.8`。`vitest`／`@vitest/coverage-v8` `^5.0.3` → `^5.0.5`。`dependency-cruiser` `^18.5.0` → `^18.6.0`。`happy-dom` `^20.14.5` → `^21.0.1`。`@vitejs/plugin-react` `^6.1.1` → `^6.1.2`。`@testing-library/user-event` `^14.6.7` → `^14.6.8`。
  - Web／admin／desktop／ui／web-sdk：Vite `^8.3.4`、TanStack Query `^5.104.3`、TanStack Router `^1.170.44`、`@types/react` `^19.3.0`、`@types/react-dom` `^19.3.0`、Playwright `^1.64.1`。
  - API／套件：Express `^5.3.0`、Fastify `^5.12.7`、`@fastify/cors` `^11.3.1`、Zod `^4.6.7`、BullMQ `^6.3.15` 加工作區 override、nodemailer `^10.1.1`、AWS SDK S3 客戶端 `^3.1152.0`、`@bull-board/*` `9.10.4`、mysql2 override `3.24.6`。
  - 觀測（成組；`resources@2.12.0` 現已存在）：exporters／instrumentation `0.222.0` → **`0.223.0`**；`resources`／`sdk-metrics`／`sdk-trace-base`／`sdk-trace-node` `2.11.0` → **`2.12.0`**。維持 `@opentelemetry/api` `^1.9.1` 與 `semantic-conventions` `1.43.0`。
- 包含：GitHub Actions `actions/setup-node` `v7.0.0`（`82076278…`）→ **`v7.1.0`** commit `949feb2413d6458794dcd2491c4babbbce0c15c1`（`ci.yml` 與 `release.yml`）。`pnpm/action-setup` `version:` **12.11.2**。
- 包含：Compose：`jaegertracing/jaeger:2.21.0` → **`2.22.0`**。`grafana/grafana:13.2.3` → **`13.2.4`**。Redis `8.10.2-alpine`、MySQL `8.4`、Prometheus `v3.15.0` 維持（已是現時穩定 tag）。
- 包含：`pnpm-workspace.yaml` `minimumReleaseAgeExclude`：刪 `electron-vite@6.0.0-beta.8` 與 `react-native@0.88.0-rc.4`。加入 `react-native@0.88.0`（今日發佈）。只有 24 小時閘觸發才加 `electron-vite@6.0.0`。其他 exclude 行改成這次 install 實際解析的版本，或刪掉已超過 24 小時、不再需要的行。
- 包含：一份 changeset，全部 26 個公開 `@ysk-kit/*` 套件，同一 **patch**（v1.6.1 預備）。
- 包含：README 三版本窗口前置 v1.6.1／保留 v1.6.0／v1.5.2；v1.5.1 已在完整變更紀錄。Version 欄維持 **1.6.0** 直至 Changesets version PR。
- 包含：`CHANGELOG.md`／`.zh.md` 前置 `## v1.6.1`。架構／產品方向／歷史／CLI `packageManager` 字串。ADR 0001「截至」日期 → 2026-10-15（ts-rest 仍無更新 release）。
- 包含：把此計劃配對提交。PR 標題 `chore(deps): graduate electron-vite 6 + RN 0.88 stable (v1.6.1 prep)`。PR 開出後在 Dependabot PR 留言取代。
- 包含：CI 綠燈後**停止**。不要 merge。不要發佈。

## 非目標

- 不含：TypeScript **7.0.2**。架構仍等 dependency-cruiser 支援該 compiler API。維持 6.0.3。
- 不含：Prisma **8**（`prisma` CLI `latest` 是 `8.0.0-rc.23`；`@prisma/client` `latest` 仍是 7.10.0）。CLI＋client＋adapters 維持 **7.10.0**。
- 不含：`@ts-rest/core`（ADR 0001 精確 `3.53.0-rc.1`）。不要改成 `^`，也不回退到 3.52.1。
- 不含：Fastify **6.0.0-alpha.5**。維持 Fastify 5.12.7。
- 不含：把 Expo 58 回退到 SDK 57（`latest`）。維持 SDK 58 `next`，直至 Expo 把 `latest` 翻過去。
- 不含：把套件運行時從 Node 26 Current 改回 Node 24 LTS。v1.5.0 已選 Current；截至 2026-10-14 Node 26 仍是 `lts=false`。
- 不含：React 19.3.1（Expo 58 bundled natives 釘 19.3.0）。Electron 45 beta。pnpm `next-12` 12.14.0。
- 不含：HTTP／Prisma schema／SDK／envelope／行業領域。沒有新的 envelope 例外。
- 不含：合併本 PR、Changesets version，或 OIDC 發佈。
- 不含：AGENTS.md／技能包裝（程序沒有改）。

## 假設

- 本工作階段 2026-10-15 查到的 npm dist-tag 與 Node `index.json` 是「穩定」的來源。
- Expo 58.0.10 的 `bundledNativeModules.json` 仍列 `react-native: 0.88.0-rc.4`。覆寫成 `0.88.0` 是同一條 0.88 線從 RC 畢業；套件沒有 expo-router，也沒有已提交的 `ios/`／`android/`。若 `pnpm --filter @ysk-kit/mobile typecheck` 失敗，只把 RN 釘選還原成 `0.88.0-rc.4` 並記錄暫緩。
- `electron-vite@6.0.0` 的 peer 是 Vite `^6 || ^7 || ^8`，engines 是 `^20.19 || >=22.12`。套件 Node 26 + Vite 8.3.4 有效。維持 `defineConfig({ main, preload, renderer })` 形狀。
- `@opentelemetry/resources@2.12.0` 存在（v1.2.2 暫緩是當時缺 packument）。成組升級；不要單獨 caret-float sdk-metrics。
- happy-dom 21 是主版。web／admin／ui／web-sdk 的 Testing Library + Vitest 不啟動 Redis。若那些測試失敗，只把 happy-dom 還原成 20.14.5。
- README Version 欄維持 1.6.0 直至 `changeset version`。
- 本工作階段不得 merge。

## 受影響的 flavor／preset／capability

| 軸 | 值 | 備註 |
|---|---|---|
| Flavor | 套件本身 + 每個 dest | `create-ysk-app` 複製 `package.json`、鎖檔、Compose、CI 釘選 |
| Preset | thin／full | 兩者繼承同一工具鏈 |
| Capabilities | 不還原 | 只改依賴版本；llm／team／billing／push 樹不變 |

## 現況與重用

| 路徑 | 符號 | 重用為 |
|---|---|---|
| `origin/main` @ v1.6.0 | 套件 | 分支基底 |
| `apps/desktop/package.json` | `electron-vite 6.0.0-beta.8` | 精確升到 `6.0.0` |
| `apps/desktop/electron.vite.config.ts` | `defineConfig({ main, preload, renderer })` | 維持形狀 |
| `apps/mobile/package.json` | `expo ^58.0.7`、`react-native 0.88.0-rc.4` | Expo 58.0.10 + RN 0.88.0 |
| `pnpm-workspace.yaml` | overrides + `minimumReleaseAgeExclude` | React 19.3.0 維持；BullMQ／mysql2／exclude 刷新 |
| `packages/observability/package.json` | OTEL 精確釘選 | 成組 2.12.0／0.223.0 |
| `packages/contracts/src/ts-rest-pin.test.ts` | `3.53.0-rc.1` | 不變 |
| `docs/adr/0001-ts-rest.md` | 留在 RC | 只刷新「截至」日期 |
| `docs/architecture.md` | 堆疊表 | 已畢業的項目刪「beta」／「RC」用詞 |
| `.github/workflows/ci.yml` | Node 26、pnpm 12.9.0、setup-node v7.0.0 | pnpm 12.11.2、setup-node v7.1.0 |
| `.changeset` 鎖步測試 | 26 個公開名稱 | 一份 patch changeset 列出每個公開套件 |
| Dependabot #53–#63 | 拆開的 bumps | 取代；不要原樣合併 |

**26 個公開套件**（全部 `1.6.0`）：`@ysk-kit/api-express`、`api-fastify`、`api-http`、`apikey`、`application`、`auth`、`cli`、`config`、`contracts`、`create-app`、`crypto`、`db-prisma`、`domain-kernel`、`i18n`、`jobs`、`llm`、`logger`、`mail`、`observability`、`push`、`realtime`、`sdk`、`storage`、`ui`、`ui-logic`、`web-sdk`。

## 考慮過的方案

| 方案 | 複雜度 | 層 | 遷移 | 客戶端 | 備註 |
|---|---|---|---|---|---|
| A. 把已變成 `latest` 的預發佈畢業，外加同主版 `latest` 補丁 | 中 | 鎖檔、CI、Compose、文件 | 無 | 桌面 + 流動 dest 複製新釘選 | 對應「重新檢查穩定版」 |
| B. 只寫審計表、不 bump | 低 | 文件 | 無 | 樹仍留 beta／RC | 使用者要檢查的是軟件，不只是表格 |
| C. 所有預發佈回退到 `latest`（Expo 57、electron-vite 5、Node 24 LTS、ts-rest 3.52.1） | 高 | mobile、desktop、engines | 仍在 Node 26 的 dest 會令 doctor 失敗 | 推翻 v1.3–v1.5 已接受的決定 | 拒絕 |
| D. 連 TypeScript 7 與 Prisma 8 RC 一併取 | 高 | 編譯器 + ORM | schema／cruiser 未知 | 所有套件 | Prisma 8 仍是 RC；TS 7 仍暫緩 |

**選：** A。  
**原因：** electron-vite 6 與 RN 0.88 現已是 npm `latest`。Expo 58 留在 `next`（不回退）。仍是預發佈的暫緩（ts-rest RC、Prisma 8、TS 7、Fastify 6 alpha、Node 26 Current、Expo `latest` 57）維持並寫明。

## 合約先行

沒有 DTO、command、錯誤碼或 ts-rest 路徑變更。Envelope 維持 `{ ok, data }`／`{ ok, error }`。`@ts-rest/core` 維持精確 `3.53.0-rc.1`。

| 項目 | 名稱／路徑 | 備註 |
|---|---|---|
| DTO | 無 | — |
| Command | 無 | — |
| 錯誤碼 | 重用現有 | 沒有新碼 |
| 路徑 | 無 | OpenAPI YAML 必須不變（`git diff --exit-code docs/openapi.yaml`） |

## 資料模型／Prisma 與遷移

沒有 schema 變更。Prisma CLI、client 與 adapters 維持 **7.10.0**。不要跑 `pnpm db:migrate`。不要取 `prisma@latest`（該 dist-tag 是 8.0.0-rc.23）。

## 模組切片與分層

除 `package.json` 的版本 specifier 外，不改 application／domain／infra 原始碼。Domain 與 application 仍然不引入 Express、Fastify、Prisma、React、BullMQ。`pnpm layers` 必須維持綠燈。

## SDK／web-sdk／客戶端表面

沒有新 SDK resource 或畫面。Web／admin 維持 `@ysk-kit/web-sdk`。桌面維持 Electron + Vite 8，electron-vite **6.0.0**。流動應用維持 Expo 58 + RN **0.88.0**。沒有 raw `fetch`。客戶端沒有 Prisma。

## Jobs／mail／realtime／notifications

無。BullMQ override 6.3.11 → 6.3.15（同主版）。nodemailer 10.0.14 → 10.1.1。Socket.IO 維持 4.8.4（`latest`）。

## 安全與私隱

- 供應鏈：取 `latest` 穩定 tarball；除已送出的 Expo 58 與 ts-rest ADR 釘選外，不取 `next`／`beta`／`rc`。
- `pnpm audit --audit-level=low` 必須維持綠燈。mysql2 override 3.24.6 是現時已修補線；不要刪 uuid／node-forge／braces 的 GHSA 忽略（仍無修補）。
- OTEL 成組升級，避免 sdk-metrics 解析到缺失的 `resources` packument（v1.2.2 的失敗模式）。
- 日誌不含秘密。沒有 webhook 或 JWT 變更。桌面 CSP／`safeStorage` 不變。

## 測試計劃

按風險排序。只用記憶體 port。不要啟動 Redis、Stripe、Twilio、FCM、Jaeger 或 Grafana。

1. **桌面建置圖（最高）。** given electron-vite 6.0.0 + Vite 8.3.4，when `pnpm --filter @ysk-kit/desktop build`，then 出現 `out/main/index.js`、`out/preload/index.mjs`、`out/renderer/`；main 不含打包進去的 Electron runtime。
2. **流動應用 typecheck。** given RN 0.88.0 + expo 58.0.10，when `pnpm --filter @ysk-kit/mobile typecheck`，then 退出碼 0。若紅燈，只還原 RN 釘選。
3. **OTEL 引入圖。** given 成組 2.12.0／0.223.0，when `pnpm --filter @ysk-kit/observability typecheck test`，then 退出碼 0，沒有缺失 `@opentelemetry/resources@2.12.0`。
4. **happy-dom 21。** given web／admin／ui／web-sdk Testing Library 測試，when `pnpm test` 跑那些 filter，then 既有 DOM 測試通過。若紅燈，只還原 happy-dom。
5. **鎖步 changeset。** given `.changeset/*.md`，when `sync-kit-version.test.ts` 跑，then 26 個公開名稱都以同一 bump（`patch`）出現。
6. **ts-rest 釘選。** given ADR 0001，when `packages/contracts/src/ts-rest-pin.test.ts` 跑，then 仍斷言 `3.53.0-rc.1`。
7. **分層／OpenAPI。** given 沒有合約變更，when `pnpm layers` 與 `pnpm gen:openapi`，then layers 綠燈，且 `docs/openapi.yaml` 相對 HEAD 位元組不變。

範圍外：對實況 API 跑 Playwright e2e（沒有登入／殼變更）。在單元測試啟動 Compose Jaeger／Grafana。Expo Go 商店建置煙霧測試。

- [x] 記憶體 repo 服務案例 — 既有套件；沒有新資源
- [x] Envelope／錯誤碼案例 — 不變
- [x] 授權／租戶 — 不變
- [x] 客戶端 hooks 只經 SDK — 沒有 UI 原始碼變更
- [x] Playwright／ui-review — 不需要（沒有登入／殼／路徑變更）；Playwright **套件**仍升到 1.64.1

## 驗證命令

| 指令 | 預期結果 |
|---|---|
| `pnpm ysk-kit plan --check docs/plans/2026-10-15-stable-versions.md` | `ysk-kit plan --check: ok` |
| `pnpm ysk-kit plan --check docs/plans/2026-10-15-stable-versions.zh.md` | `ysk-kit plan --check: ok` |
| `pnpm layers` | `no dependency violations found` |
| `pnpm typecheck` | turbo 任務成功 |
| `pnpm test` | Vitest 檔案通過 |
| `pnpm gen:openapi` | 寫入 `docs/openapi.yaml`；`git diff --exit-code docs/openapi.yaml` |
| `pnpm ysk-kit check agent` | `ysk-kit check agent: ok` |
| `pnpm lint` | biome check 通過 |
| `pnpm --filter @ysk-kit/desktop build` | electron-vite 產出 `out/main`、`out/preload`、`out/renderer` |
| `pnpm --filter @ysk-kit/mobile typecheck` | 退出碼 0 |

### 人手檢查

無。沒有 UI、HTTP 或授權行為變更；只改版本。

## 文件／變更紀錄／changeset

- [x] 沒有技能程序變更
- [ ] `CHANGELOG.md`／`CHANGELOG.zh.md` 前置 v1.6.1；README 窗口 v1.6.1／v1.6.0／v1.5.2
- [ ] 架構 + 產品方向 + 歷史 + CLI `pnpm@12.11.2` 字串（英 + 中）
- [ ] ADR 0001「截至」日期 2026-10-15
- [ ] Changeset：全部 26 個公開套件 `patch`

## 風險與回滾

| 風險 | 緩解 | 回滾 |
|---|---|---|
| Expo 58.0.10 拒絕 RN 0.88.0 | 先 typecheck mobile；RN 0.88.0 是 RC 畢業 | 再釘 `react-native@0.88.0-rc.4` 並記錄 |
| electron-vite 6.0.0 相對 beta.8 的建置圖變更 | 跑 desktop `build`；維持 config 形狀 | 還原 `6.0.0-beta.8` |
| OTEL 2.12.0 缺兄弟 packument | 成組升級；typecheck observability | 還原 2.11.0／0.222.0 |
| happy-dom 21 弄壞 Testing Library | 跑 `pnpm test`；只還原該 specifier | `^20.14.5` |
| pnpm 12.11.2 install／CI 漂移 | CI `version: 12.11.2` 對齊 `packageManager` | 還原 12.9.0 |
| 24 小時發佈年齡閘 | `minimumReleaseAgeExclude` 加 `react-native@0.88.0` | 只有排除被拒才等 24 小時 |

整條 PR 回滾：還原 merge commit。沒有資料庫遷移。

## 任務清單

1. [ ] 計劃檔
   - **檔案：** `docs/plans/2026-10-15-stable-versions.md` + `.zh.md`
   - **介面／合約／資料：** 無
   - **風險：** 標題不完整會令 `plan --check` 失敗
   - **回滾：** 刪配對
   - **驗收：** 兩份檔 `pnpm ysk-kit plan --check` 通過
2. [ ] 預發佈畢業
   - **檔案：** `apps/desktop/package.json`、`apps/mobile/package.json`、`pnpm-workspace.yaml`
   - **介面／合約／資料：** 無
   - **風險：** Expo peer／electron-vite config
   - **回滾：** 還原 beta.8／rc.4
   - **驗收：** electron-vite `6.0.0`；react-native `0.88.0`；expo `^58.0.10`；React override 仍是 19.3.0
3. [ ] 同主版 latest 補丁 + CI + Compose
   - **檔案：** 工作區 `package.json`、`.github/workflows/ci.yml`、`release.yml`、`docker-compose.yml`
   - **介面／合約／資料：** 無
   - **風險：** 鎖檔／審計
   - **回滾：** 還原 specifier
   - **驗收：** `pnpm install` 鎖檔一致；`pnpm audit --audit-level=low` 本地綠燈或已記錄
4. [ ] 客戶端／應用
   - **檔案：** 只改 web、admin、desktop、mobile specifier
   - **介面／合約／資料：** 無
   - **風險：** Vite／Testing Library
   - **回滾：** 還原 specifier
   - **驗收：** 只用 SDK／web-sdk；沒有新的 fetch／Prisma
5. [ ] 驗證
   - **檔案：** 沒有新檔
   - **介面／合約／資料：** 無
   - **風險：** typecheck／test 紅燈
   - **回滾：** 還原出問題的 bump
   - **驗收：** 驗證表綠燈；OpenAPI YAML 不變
6. [ ] 文件 + changeset
   - **檔案：** CHANGELOG 配對、README 窗口、架構、產品方向、歷史、CLI 文件、ADR 0001 日期、`.changeset/stable-versions-2026-10-15.md`
   - **介面／合約／資料：** 無
   - **風險：** 英／中漂移；changeset 漏公開套件
   - **回滾：** 還原文件
   - **驗收：** 英 + 中對齊；changeset 以 `patch` 列出全部 26 個

## 未決問題

- 沒有阻擋項。Expo 58 仍在 npm `next` 是已記錄的暫緩，不是未決問題。若 mobile typecheck 因 RN 0.88.0 失敗，回滾已在上方寫明，不必先問使用者。
