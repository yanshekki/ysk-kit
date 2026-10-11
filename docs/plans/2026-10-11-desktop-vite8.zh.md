# 計劃：桌面 Vite 8.3.2 + electron-vite 6 beta（v1.3.0）

Language: 英文配對 `2026-10-11-desktop-vite8.md` · 中文 `2026-10-11-desktop-vite8.zh.md`

| | |
|---|---|
| **Slug** | `desktop-vite8` |
| **日期** | 2026-10-11 |
| **狀態** | accepted |
| **正規檔** | `docs/plans/2026-10-11-desktop-vite8.md` |
| **工作階段指針** | `/plan.md`（已 gitignore） |

法律：[AGENTS.zh.md](../../AGENTS.zh.md)。程序：[plan-feature](../skills/plan-feature.zh.md)。檢查：`pnpm ysk-kit plan --check docs/plans/2026-10-11-desktop-vite8.zh.md`。

## 目標與使用者問題

`apps/web` 與 `apps/admin` 已在 Vite 8.3.2。`apps/desktop` 仍是 Vite 7.3.6 + `electron-vite@5.0.0`，peer 範圍是 `vite: ^5 || ^6 || ^7`。Dependabot [#36](https://github.com/yanshekki/ysk-kit/pull/36) 只把 `vite` 升到 8.3.2，留下 `electron-vite@5`，peer 無效。不能原樣合併該 PR。

結果：從最新 `origin/main` 開一條 PR，把桌面升到 Vite 8.3.2 配相容的 `electron-vite` 6.0.0-beta.8，盡量維持現有 `electron.vite.config.ts` 形狀（Rolldown 若把 `electron` 打進 main 才加 externals），26 個公開套件鎖步 **minor** 預備 v1.3.0，滑動 README 三版本窗口，等 CI 26/26。本工作階段不 merge、不發佈。

## 範圍

- 包含：分支 `chore/desktop-vite8-2026-10-11`，以 `origin/main`（計劃時 `07423591`／tag `v1.2.4`）為底。
- 包含：`apps/desktop/package.json` `vite` `^7.3.6` → `^8.3.2`；`electron-vite` `5.0.0` → 精確 `6.0.0-beta.8`。
- 包含：`pnpm install` 直到 lockfile 一致；確認沒有無效的 `electron-vite` ↔ `vite` peer。
- 包含：若撞上 24 小時發佈年齡閘，把 `electron-vite@6.0.0-beta.8` 加進 `pnpm-workspace.yaml` `minimumReleaseAgeExclude`（發佈於 2026-10-10T18:26:44Z）。
- 包含：只有 `electron-vite build` 失敗才改 `electron.vite.config.ts`；Rolldown 若打包 `electron` 則 externalize。
- 包含：一份 changeset，26 個公開 `@ysk-kit/*` 全部 **minor**。
- 包含：README 窗口 v1.3.0／v1.2.4／v1.2.3；CHANGELOG 前置 v1.3.0；architecture／product-plan／history 堆疊行。
- 包含：PR 標題 `chore(deps): desktop Vite 8.3.2 + electron-vite 6 beta (v1.3.0 prep)`；在 #36 留言請關閉（已被取代）。
- 包含：CI 26/26 全綠後停止，通知 YSK Kit 總管。不要 merge。不要發佈。

## 非目標

- 不含：Expo 58（#35）、`@types/node` 26／engines Node 26（#38）。
- 不含：合併本 PR、合併 #36、Changesets version、OIDC 發佈。
- 不含：AGENTS.md／skills／Cursor cloud agents。
- 不含：把桌面 `@vitejs/plugin-react` 5.2.0 升到 6.1.1（5.2.0 已 peer Vite 8）。
- 不含：Electron 44、vitest 5、Tailwind 4、root engines、`@types/node`。
- 不含：重寫 desktop main／preload／renderer（除非只需改 config）。
- 不含：用原生 Vite 8 多 config 取代 electron-vite。
- 不含：改 README 版本表或 package.json 版本（維持 1.2.4 直到 version PR）。
- 不含：HTTP／Prisma／SDK／envelope／行業 domain。

## 假設

- 實作必須從 `origin/main` 開支，不可從 `changeset-release/main` 開始。
- 沒有 pnpm `catalog:` vite 釘選。排除清單加 web／admin specifier 才是 Vite 8.3.2 來源。
- `electron-vite@6.0.0-beta.8` peer Vite 6–8，engines `^20.19 || >=22.12`。kit Node 24 沒問題。可選 `@swc/core` 不用。
- kit config 沒有要遷移的 `esbuild`／`optimizeDeps.esbuildOptions`。
- `@tailwindcss/vite@4.3.3` peer Vite 5–8。
- 桌面單元測試不啟動 Electron。
- flavor-smoke `desktop` thin／full 會跑 `pnpm build` → `electron-vite build`。
- README 版本格維持 1.2.4 直到 Changesets version PR。
- 本工作階段不可 merge。

## 受影響的 flavor／preset／capability

| 軸 | 值 | 備註 |
|---|---|---|
| Flavor | kit 本身 + desktop | 活倉 `apps/desktop`；`create-ysk-app --flavor desktop` 會複製該樹 |
| Preset | thin／full | dest 含桌面時兩者都會複製 |
| Capabilities | 沒有 | 不還原 llm／team／billing／push |

## 現況與重用

| 路徑 | 符號 | 重用為 |
|---|---|---|
| `origin/main` @ `07423591` | v1.2.4 | 分支底 |
| `apps/desktop/package.json` | `vite ^7.3.6`、`electron-vite 5.0.0` | 只改 specifier |
| `apps/desktop/electron.vite.config.ts` | `defineConfig({ main, preload, renderer })` | 維持形狀 |
| `apps/web/package.json` | `vite ^8.3.2` | 對齊桌面 vite specifier |
| `pnpm-workspace.yaml` | `minimumReleaseAgeExclude` 含 `vite@8.3.2` | 24 小時閘觸發時加 electron-vite beta |
| `apps/desktop/src/main/index.ts` | IPC `ysk:token:*`、`safeStorage` | 不改 |
| `.github/scripts/flavor-smoke.sh` | `pnpm build` | 桌面 CI 證據 |
| `tooling/ysk-cli/src/sync-kit-version.test.ts` | 鎖步 26 | changeset 必須列出每個公開套件同一 bump |
| `README.md` 變更紀錄 | v1.2.4／v1.2.3／v1.2.2 | 加 v1.3.0，拿掉 v1.2.2 |
| Dependabot #36 | 只升 vite | 取代，不要合併 |

**26 個公開套件**（全部 `1.2.4`）：`@ysk-kit/api-express`、`api-fastify`、`api-http`、`apikey`、`application`、`auth`、`cli`、`config`、`contracts`、`create-app`、`crypto`、`db-prisma`、`domain-kernel`、`i18n`、`jobs`、`llm`、`logger`、`mail`、`observability`、`push`、`realtime`、`sdk`、`storage`、`ui`、`ui-logic`、`web-sdk`。`@ysk-kit/desktop` 是 private `0.1.0`，不在這 26 個之內。

## 考慮過的方案

| 方案 | 複雜度 | 分層 | 遷移 | 客戶端 | 備註 |
|---|---|---|---|---|---|
| A. 新分支：Vite 8.3.2 + electron-vite 6.0.0-beta.8 | 低至中 | desktop package.json、lockfile、必要時 config、文件、changeset | 無 Prisma | 桌面 dest + flavor-smoke | peer 有效；刻意接受 beta |
| B. 原樣合併 Dependabot #36 | 低 | 只改 desktop vite | 無 | 桌面 | 無效：electron-vite 5 peer 不含 Vite 8 |
| C. 等 electron-vite 6 穩定（`latest` 仍是 5.0.0） | 現時無 | — | — | 桌面留 Vite 7 | 延後與 web／admin 對齊 |
| D. 丟掉 electron-vite，改用原生 Vite 8 多 config | 高 | 重寫 scripts／config | 新的建置圖 | 桌面 | 超出範圍 |

**選定：** A。  
**原因：** 使用者要求正確的 Vite 8 升級。6.0.0-beta.8 是目前唯一 peer Vite 8 的已發佈線。回滾是釘回 vite 7 + electron-vite 5。

## 合約先行

沒有 HTTP DTO、error code 或 ts-rest 路徑改動。

| 項目 | 名稱／路徑 | 備註 |
|---|---|---|
| DTO | 沒有 | 只改桌面 bundler |
| Command | 沒有 | |
| Error codes | 重用既有 | 不新增 |
| 路徑 | 沒有 | envelope 不變 |

## 資料模型／Prisma 與遷移

沒有。Prisma 維持 7.10.0。不改 schema，不跑 `pnpm db:migrate`。

## 模組切片與分層

不改 `apps/api/src/modules/*`。domain 與 application 不碰 Express、Fastify、Prisma、React、BullMQ。桌面 renderer 仍只經 `@ysk-kit/sdk` 呼叫 API。

## SDK／web-sdk／客戶端表面

沒有新的 SDK resource 或 web-sdk hook。桌面畫面不變。不要 raw `fetch`。客戶端不要 Prisma。

## Jobs／mail／realtime／notifications

沒有。

## 安全與私隱

不改授權、webhook 或密鑰日誌。維持 [desktop-electron](../skills/desktop-electron.zh.md) 基線：`contextIsolation`、`sandbox`、CSP、導航預設拒絕、IPC `senderFrame`、`safeStorage` 無明文後備。不要把 `webSecurity` 設成 `false`。若 Rolldown 把 `electron` 打進 main，改為 externalize。

## 測試計劃

按風險排序。沿用現有桌面單元測試。CI 不要啟動 Redis、Stripe、Twilio、FCM、Jaeger、Grafana 或有畫面的 Electron。

1. **建置圖（最高）。** given Vite 8 + electron-vite 6 beta，when `pnpm --filter @ysk-kit/desktop build`，then 出現 `out/main/index.js`、`out/preload/index.mjs`、`out/renderer/`；main 不含打包進去的 Electron runtime。
2. **Peer 有效。** given lockfile，when `pnpm install` 完成，then 沒有 Vite 8 的 `electron-vite` peer 警告。
3. **既有單元測試。** given 現有 security／secret-store／token-store 測試，when `pnpm --filter @ysk-kit/desktop test`，then 仍然通過。
4. **Typecheck。** given `apps/desktop/tsconfig.json` `types: ["node", "vite/client"]`，when 桌面 typecheck，then Vite 8 client types 可解析。
5. **Flavor smoke。** given `create-ysk-app --flavor desktop` thin 與 full，when CI `flavor-smoke` 跑 `pnpm build`，then electron-vite build 退出碼 0。
6. **鎖步。** given 新 changeset，when `sync-kit-version.test.ts` 跑，then 26 個公開名稱都是 `minor`。

- [x] Memory-repo 服務案例 — 不適用（沒有 API 模組）
- [x] Envelope／error code 案例 — 不適用
- [x] 授權／租戶／另一作者 — 不適用
- [x] 若改了 UI，hooks 只經 SDK — 畫面不變
- [x] Playwright／ui-review — 沒有改登入／shell 外觀

## 驗證命令

| 命令 | 預期結果 |
|---|---|
| `pnpm install` | lockfile 一致；沒有無效的 electron-vite ↔ vite peer |
| `pnpm lint` | 退出碼 0 |
| `pnpm typecheck` | 退出碼 0 |
| `pnpm test` | 退出碼 0 |
| `pnpm layers` | 退出碼 0；客戶端不碰 Express／Prisma／jobs／mail／push／AWS SDK |
| `pnpm ysk-kit check agent` | 印出 `ysk-kit check agent: ok` |
| `pnpm --filter @ysk-kit/desktop typecheck` | 退出碼 0 |
| `pnpm --filter @ysk-kit/desktop test` | 既有測試通過 |
| `pnpm --filter @ysk-kit/desktop build` | electron-vite build 寫出 `out/`；不可默默退回 Vite 7 |
| `pnpm ysk-kit plan --check docs/plans/2026-10-11-desktop-vite8.zh.md` | 印出 `ysk-kit plan --check: ok` |
| GitHub CI | 26 個 job 全綠，包括 flavor-smoke desktop thin／full |

`pnpm gen:openapi` 不變（沒有改合約）。

### 人手檢查

- [ ] UI 流程：桌面 `build` 產物存在；renderer plugin 沒改則不必有畫面 smoke
- [ ] Envelope 形狀 `{ ok: true, data }`／`{ ok: false, error }` — 不變
- [ ] 授權角色：不變
- [ ] `pnpm why vite` 在 `apps/desktop` 顯示 8.3.x
- [ ] 在 Dependabot #36 留言請關閉（已被取代）

## 文件／變更紀錄／changeset

- [x] 不改 `docs/skills/`
- [ ] `CHANGELOG.md`／`CHANGELOG.zh.md` 與 README 最近三個版本窗口
- [ ] 26 個公開套件的 minor changeset
- [ ] `docs/architecture.md` + `.zh.md`、`docs/product-plan.md` + `.zh.md`、`docs/history.md` + `.zh.md`

v1.3.0 說明：桌面 Vite 7.3.6 → 8.3.2，electron-vite 5.0.0 → 6.0.0-beta.8（beta；peer Vite 6–8）。web／admin 已在 Vite 8.3.2。取代 Dependabot #36。

## 風險與回滾

| 風險 | 緩解 | 回滾 |
|---|---|---|
| electron-vite 6 是 beta；`latest` 仍是 5.0.0 | 精確釘 `6.0.0-beta.8`；PR 正文寫明 | 還原；釘回 `vite ^7.3.6` + `electron-vite 5.0.0` |
| Rolldown 把 `electron` 打進 main | externalize；檢查 `out/main` | 同樣還原 |
| `pnpm install` 拒絕 beta.8（未滿 24 小時） | 把 `electron-vite@6.0.0-beta.8` 加進 `minimumReleaseAgeExclude` | 只有排除被拒才改用 beta.7 |
| flavor-smoke desktop 逾時 | 既有 Electron cache key 已 hash `apps/desktop/package.json` | 重跑；不要跳過矩陣 |
| plugin-react 5 對 Oxc | 5.2.0 已 peer Vite 8；維持 | 建置失敗才升 6.1.1 |
| 鎖步測試失敗 | 一份 changeset 列出全部 26 個 `minor` | 修正 changeset；不要拆 bump |

## 任務清單

1. [ ] 從最新 main 開支
   - **檔案：** 只動 git（`chore/desktop-vite8-2026-10-11`）
   - **介面／合約／資料：** 沒有
   - **風險：** 從 `changeset-release/main` 開支會混入 version PR 殘渣
   - **回滾：** 刪分支
   - **驗收：** `HEAD` 等於當前 `origin/main`
2. [ ] 升級桌面 Vite + electron-vite
   - **檔案：** `apps/desktop/package.json`、`pnpm-lock.yaml`、可能 `pnpm-workspace.yaml`
   - **介面／合約／資料：** 沒有
   - **風險：** peer 不符；24 小時發佈年齡閘
   - **回滾：** 還原 specifier 與 lockfile
   - **驗收：** `vite ^8.3.2`、`electron-vite 6.0.0-beta.8`；沒有無效 peer
3. [ ] 建置失敗才改 config
   - **檔案：** `apps/desktop/electron.vite.config.ts`
   - **介面／合約／資料：** 沒有
   - **風險：** 過度改 config
   - **回滾：** 還原現有物件
   - **驗收：** `pnpm --filter @ysk-kit/desktop build` 寫出 `out/`
4. [ ] changeset minor ×26
   - **檔案：** `.changeset/*.md`
   - **介面／合約／資料：** 鎖步 minor 朝 1.3.0
   - **風險：** 漏一個公開套件會令 `sync-kit-version.test.ts` 失敗
   - **回滾：** 刪 changeset
   - **驗收：** 26 個名稱都是 `minor`
5. [ ] README 窗口 + CHANGELOG + 堆疊文件
   - **檔案：** README、CHANGELOG、architecture、product-plan、history（中英）、本計劃配對
   - **介面／合約／資料：** 沒有
   - **風險：** 在 version PR 之前把版本表改成 1.3.0
   - **回滾：** 還原文件
   - **驗收：** README 最近三個是 v1.3.0／v1.2.4／v1.2.3；版本表仍是 1.2.4
6. [ ] 驗證
   - **檔案：** 無額外
   - **介面／合約／資料：** 沒有
   - **風險：** 沒跑 `desktop build` 就聲稱全綠
   - **回滾：** 不適用
   - **驗收：** 驗證表全綠；不可退回 Vite 7
7. [ ] 開 PR、取代 #36、等 26/26、停止
   - **檔案：** 只在 GitHub PR
   - **介面／合約／資料：** 沒有
   - **風險：** 本工作階段 merge（禁止）
   - **回滾：** 放棄則關 PR
   - **驗收：** 26/26 全綠後通知總管 — 不要 merge、不要發佈

## 未決問題

- 沒有阻擋實作的問題。若安裝時出現更新的 `6.0.0-beta.*`，採用並記錄精確版本。
- 若 `electron-vite build` 需要的不只是 externals（bytecode、SWC、Oxc），停下來擴充本計劃，不要另發明一套 bundler。
