# 變更紀錄

Language: [English](CHANGELOG.md) · 中文

YSK Kit 的版本說明，由新到舊。[README.zh.md](README.zh.md) 只顯示最近三個版本。條目來自 GitHub 產品 release、tag、Changesets 產生的各套件變更紀錄，以及 git 歷史。

Changesets 仍然撰寫每個套件的變更紀錄。這些檔案保留：

| 套件 | 變更紀錄 |
|---|---|
| `@ysk-kit/api-express` | [packages/api-express/CHANGELOG.md](packages/api-express/CHANGELOG.md) |
| `@ysk-kit/api-fastify` | [packages/api-fastify/CHANGELOG.md](packages/api-fastify/CHANGELOG.md) |
| `@ysk-kit/api-http` | [packages/api-http/CHANGELOG.md](packages/api-http/CHANGELOG.md) |
| `@ysk-kit/apikey` | [packages/apikey/CHANGELOG.md](packages/apikey/CHANGELOG.md) |
| `@ysk-kit/application` | [packages/application/CHANGELOG.md](packages/application/CHANGELOG.md) |
| `@ysk-kit/auth` | [packages/auth/CHANGELOG.md](packages/auth/CHANGELOG.md) |
| `@ysk-kit/cli` | [tooling/ysk-cli/CHANGELOG.md](tooling/ysk-cli/CHANGELOG.md) |
| `@ysk-kit/config` | [packages/config/CHANGELOG.md](packages/config/CHANGELOG.md) |
| `@ysk-kit/contracts` | [packages/contracts/CHANGELOG.md](packages/contracts/CHANGELOG.md) |
| `@ysk-kit/create-app` | [tooling/create-ysk-app/CHANGELOG.md](tooling/create-ysk-app/CHANGELOG.md) |
| `@ysk-kit/crypto` | [packages/crypto/CHANGELOG.md](packages/crypto/CHANGELOG.md) |
| `@ysk-kit/db-prisma` | [packages/db-prisma/CHANGELOG.md](packages/db-prisma/CHANGELOG.md) |
| `@ysk-kit/domain-kernel` | [packages/domain-kernel/CHANGELOG.md](packages/domain-kernel/CHANGELOG.md) |
| `@ysk-kit/i18n` | [packages/i18n/CHANGELOG.md](packages/i18n/CHANGELOG.md) |
| `@ysk-kit/jobs` | [packages/jobs/CHANGELOG.md](packages/jobs/CHANGELOG.md) |
| `@ysk-kit/llm` | [packages/llm/CHANGELOG.md](packages/llm/CHANGELOG.md) |
| `@ysk-kit/logger` | [packages/logger/CHANGELOG.md](packages/logger/CHANGELOG.md) |
| `@ysk-kit/mail` | [packages/mail/CHANGELOG.md](packages/mail/CHANGELOG.md) |
| `@ysk-kit/observability` | [packages/observability/CHANGELOG.md](packages/observability/CHANGELOG.md) |
| `@ysk-kit/push` | [packages/push/CHANGELOG.md](packages/push/CHANGELOG.md) |
| `@ysk-kit/realtime` | [packages/realtime/CHANGELOG.md](packages/realtime/CHANGELOG.md) |
| `@ysk-kit/sdk` | [packages/sdk/CHANGELOG.md](packages/sdk/CHANGELOG.md) |
| `@ysk-kit/storage` | [packages/storage/CHANGELOG.md](packages/storage/CHANGELOG.md) |
| `@ysk-kit/ui` | [packages/ui/CHANGELOG.md](packages/ui/CHANGELOG.md) |
| `@ysk-kit/ui-logic` | [packages/ui-logic/CHANGELOG.md](packages/ui-logic/CHANGELOG.md) |
| `@ysk-kit/web-sdk` | [packages/web-sdk/CHANGELOG.md](packages/web-sdk/CHANGELOG.md) |

階段日記（Phase 1 至 Phase 53）仍在 [docs/history.zh.md](docs/history.zh.md)。

## v1.2.2

### 新功能

- Agent skills `security-review`、`db-migration`、`webhook-handling` 與 `desktop-electron`（英文 + 香港繁體中文），連同 `.agents`／`.claude` 包裝、範圍限定的 Cursor／Copilot 指針，以及 create-app／upgrade 模板。

### 改進

- `add-module`、`add-capability`、`verify-change` 與 `envelope-api` 指向新程序。計劃模板的資料模型與安全段標明 Prisma expand/contract、安全審查、webhook 與 Electron。

### 修正

- 已發佈的 `@ysk-kit/*` 程式庫輸出有效的 Node ESM：`dist/` 的相對路徑帶 `.js` 副檔名，因此 `node` 可以載入 tarball（`import('@ysk-kit/<pkg>')`）。公開套件從 `tsconfig.base.json` 繼承 `module`／`moduleResolution` `NodeNext`。
- `@ysk-kit/create-app` 與 `@ysk-kit/cli` 的 bin 以 `#!/usr/bin/env node` 開頭而且可執行，因此安裝後 `create-ysk-app`／`ysk-kit`／`yskk` 可以運行（先前會以 `import: not found` 與 `ERR_MODULE_NOT_FOUND` 失敗）。
- 從 npm 開倉使用 `npm create @ysk-kit/app` 或 `pnpm create @ysk-kit/app`。npm 上沒有無 scope 的 `create-ysk-app` 套件；發佈的套件是 `@ysk-kit/create-app`。
- `@ysk-kit/observability` 把 OpenTelemetry SDK 與 exporter 釘在 npm 上存在的版本（`resources`／`sdk-*` 2.11.0，exporters／instrumentation 0.222.0）。Caret 範圍會浮到 `sdk-metrics@2.12.0`，而該版本依賴尚未發佈的 `resources@2.12.0`。

### 內部／CI

- CI job `pack-and-run` 編譯後把 26 個公開套件 `pnpm pack`，在乾淨目錄安裝 tarball，import 每一個套件，執行 CLI `--help`，並用倉內 CLI 非互動建立 `php-bridge` dest。
- 當 `changesets/action` 回報 `hasChangesets`（打開或更新版本 PR）時，Release 跳過 tag 步驟。`.github/tag-and-release.mjs` 在 `GITHUB_SHA` 讀取版本、待處理 changeset 與 `CHANGELOG.md`。成功發佈後會在該 commit 建立 annotated `vX.Y.Z` tag，用該版本 `CHANGELOG.md` 章節開 GitHub Release，再安裝已發佈的 tarball 並執行 CLI bin 做驗證。發佈仍然只使用 OIDC Trusted Publishing。
- `thin-smoke`、`flavor-smoke`、create-app 與 upgrade 測試會斷言新的 skill 檔與 Cursor 規則。

## v1.2.1

### 新功能

- `pnpm ysk-kit plan --check <file>` 檢查計劃是否具備每個必要模板標題，必填章節若仍是佔位內容則失敗。
- Agent skills `test-plan`、`write-tests`、`ui-design` 與 `ui-review`（英文 + 香港書面語），連同 `.agents`／`.claude` 包裝與範圍限定的 Cursor／Copilot 指針，因此 `create-ysk-app` 與 `ysk-kit upgrade` 會把它們寫進已產生的產品。

### 改進

- 計劃協議保留 v1.2.0 的 kit 專用章節，並新增：先探索再計劃（合約之前的**現況與重用**）、範圍／非目標旁邊的**假設**、**考慮過的方案**（有真正替代時兩個做法）、任務步驟寫明檔案／介面／合約／資料／風險／回滾／驗收、驗證命令附預期結果與人手檢查清單，以及批准／禁止縮水閘。
- [docs/plans/README.zh.md](docs/plans/README.zh.md) 把各工具原生計劃模式（Grok Build、Cursor、Claude Code、Codex、OpenCode、Copilot）對照到本模板，並附可複製的 `/plan` 提示（中英）。獲准計劃仍是 `docs/plans/<date>-<slug>.md`，用 `pnpm ysk-kit plan <slug>` 建立。
- 計劃模板的「測試計劃」一節指向 `test-plan`（按風險排序的 given/when/then、夾具、不涵蓋範圍、分層對應）。
- 巢狀 `AGENTS.md` 把 API／contracts 指向測試 skills，把客戶端 app 指向 UI skills。
- 鎖步測試要求任何待處理 changeset 都以同一種 bump 列出全部 26 個公開 `@ysk-kit` 套件。

### 內部／CI

- `thin-smoke` 與 `flavor-smoke` 會斷言新的模板標題，以及測試／UI skill 檔與 Cursor 規則。產生出來的產品會收到升級後的 `_template.md` 配對。create-app 與 upgrade 測試會斷言同一批 skill 檔。

## v1.2.0

### 新功能

- `pnpm ysk-kit plan <slug>` 按共用模板把雙語功能計劃寫入 `docs/plans/<yyyy-mm-dd>-<slug>.md`（及 `.zh.md` 配對），並寫入已 gitignore 的根目錄 `plan.md` 指針。
- thin 與 full 工作區產品都會收到同一套 agent 指針：`.agents/skills/`、`.claude/skills/`、範圍限定的 `.cursor/rules/*.mdc`、`.github/copilot-instructions.md`、`.gemini/settings.json`、`GEMINI.md`，以及計劃模板。

### 改進

- `AGENTS.md`／`AGENTS.zh.md` 改為專業 agent 指引：定位、倉目錄地圖、十條硬規則連同原因、強制的理解 → 計劃 → 合約 → 骨架 → 實作 → 驗證 → 文件流程、完成定義、何時詢問、陷阱，以及程式工具表。程序仍在 `docs/skills/`。
- `pnpm ysk-kit check agent` 也會在指針不再提及 `AGENTS.md`、skill 副本漂移，或根目錄加巢狀 `AGENTS.md` 超過 24 KiB 時失敗。
- Skills（`docs/skills/` 與 `.agents/skills/`）新增 `plan-feature`，並採用觸發／輸入／步驟／驗證／完成條件。

### 安全

- pnpm override `source-map-js@1.2.2` 修復 [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q)／CVE-2026-93749（indexed source map 位移導致 event-loop DoS）。該套件經 PostCSS／Expo Metro 間接引入。

### 依賴升級

| 套件 | 由 | 至 |
|---|---|---|
| source-map-js（工作區 override） | 1.2.1 | 1.2.2 |

### 內部／CI

- `thin-smoke` 與 `flavor-smoke` 會斷言產生出來的指針套件。`php-bridge` 仍然略過工作區 agent 包裝。

## v1.1.3

### 改進

- 根目錄 `README.md` 與 `README.zh.md` 只列出最近三個版本。每個版本按適用的類別分組：新功能、改進、修正、安全、依賴升級、內部／CI。該節結尾連結到本檔。

### 內部／CI

- 本檔與 [CHANGELOG.md](CHANGELOG.md) 保留每一個版本，由新到舊，並使用同樣的類別。上表的各套件變更紀錄仍由 Changesets 撰寫。
- [貢獻指引](docs/contributing.zh.md) 與 [工作區指令](docs/cli/workspace-scripts.zh.md) 的發佈一節規定：每次發佈都把新版本加在 README 該節的頂部，並把三個版本中最舊的一個移入本檔。

## v1.1.2

[GitHub release](https://github.com/yanshekki/ysk-kit/releases/tag/v1.1.2)

### 安全

- npm 發佈只使用 Trusted Publishing。release 工作流程保留 `id-token: write` 與 provenance，不傳入靜態 npm 憑證。
- `actions/setup-node` 不接收 `registry-url` 或 `scope`，因此不會寫入會蓋過 OIDC 的 registry 認證行。
- `.github/publish-packages.mjs` 在 OIDC token 不存在時退出。

### 內部／CI

- 發佈後的 `npm view` 核對仍然保留。
- 產品發佈維持單一 annotated tag `vX.Y.Z`。

## v1.1.1

[GitHub release](https://github.com/yanshekki/ysk-kit/releases/tag/v1.1.1)

### 改進

- `ysk-kit doctor` 的 engines 修復提示改為引用產品自己的 `packageManager` 釘選。
- `pnpm version:packages` 把 `@ysk-kit/create-app` 的版本寫入根 `package.json`，以及 `README.md` 與 `README.zh.md` 的版本格。

### 安全

- overrides 維持 `deepmerge-ts` 8.0.2、`mariadb` 3.4.7（Prisma adapter 宣告 3.4.5）與 `mysql2` 3.24.5。
- 接受、而且沒有已修補的 npm 版本：uuid 7（經 Expo `xcode`，GHSA-w5hq-g745-h8pq）、node-forge 1.4.0（Expo CLI 程式碼簽署，GHSA-86w9-cpqp-85rv）、braces 3.0.3（Metro 檔案對應，GHSA-vfj7-8cjw-p6xm）。

### 依賴升級

- pnpm 12.9.0（12.9.0 的 `pnpm login` 在重新導向時不再轉送憑證；12.9.1 當時仍在 24 小時發佈年齡窗內）、Turborepo 2.11.7、pino 10.4.0、`@aws-sdk/client-s3` 與 `@aws-sdk/s3-request-presigner` 3.1146.0、`@tanstack/react-query` 5.104.1、supertest 7.3.1、`@types/node` 24.19.1。
- 暫緩：TypeScript 7.0.2、`@types/node` 26（engines 是 Node 24）、Prisma 8.0.0-rc.19、桌面 Vite 7.3.6 配 `@vitejs/plugin-react` 5（electron-vite 5 的 peer 是 Vite 5–7）、Expo 57.0.26／React Native 0.86.3／React 19.2.8（Expo SDK 58 對準的 React Native 0.88 仍是 release candidate）、`@ts-rest/core` 3.53.0-rc.1。
- `prom-client` 15.1.3 已標為棄用，改用 `@prometheus-io/client` 之前先維持 `/metrics` 的 registry。Compose 映像維持 MySQL 8.4、Redis 8.10.2、Jaeger 2.21.0、Prometheus v3.15.0、Grafana 13.2.3。Actions 維持當時的 commit SHA。

### 內部／CI

- release job 在 `npm view` 看不到每個已發佈版本時失敗。`pnpm release:publish` 自行執行 `pnpm publish --provenance`（commit `817e0f0`，在 v1.1.0 tag 之後、v1.1.1 之前）。

## v1.1.0

[GitHub release](https://github.com/yanshekki/ysk-kit/releases/tag/v1.1.0)

### 新功能

- `ysk-kit doctor`（`--json`）檢查 Node 與 pnpm 是否符合 `engines`、必要環境變數、不安全預設（`JWT_SECRET` 太短或是已知佔位值）、資料庫可達性與已套用的遷移、相對 `ysk-kit upgrade` 的護欄差異，以及 `ysk-kit check agent`。警告維持退出碼 0。有錯誤時退出 1。JSON 報告不包含密鑰值。

### 改進

- Thin 產品在 `ysk-kit add push` 之前以 stub 處理流動推送，該 stub 的測試與此相符。`static-web3` 略過 Prisma enum 比較，因為該 flavor 沒有 API。
- [ADR 0001](docs/adr/0001-ts-rest.zh.md) 把 `@ts-rest/core` 維持在 `3.53.0-rc.1`。contracts 測試會在釘選被改動時失敗。該 ADR 記錄的 v2 路徑是倉內的 `defineContract`，路由形狀維持相同的純物件。本 kit 不加入 `@ts-rest` 的伺服器或 OpenAPI 套件。
- 根 `package.json` 的版本與 `@ysk-kit/create-app` 相同。`create-ysk-app` 在 `vX.Y.Z` 壓縮檔內核對的就是這個版本。

### 安全

- 1.1.0 由 GitHub Actions OIDC 發佈。每個套件的 npm 元資料記錄 `_npmUser.name` 為 `GitHub Actions`、`_npmUser.trustedPublisher.id` 為 `github`，以及 `dist.attestations.provenance`（SLSA v1）。當時工作流程仍留有一個靜態 registry 憑證作為後備。pnpm 12 在 OIDC 交換成功時會蓋過該靜態憑證。

### 內部／CI

- CI job `flavor-smoke` 以 `thin` 與 `full` 產生每個 flavor（sqlite），並執行 install、typecheck、test 與 build。Flavor：saas、desktop、gateway、php-bridge、trading、static-web3。
- Changesets action 設定 `create-github-releases: false`。v1.1.0 的 GitHub Release 是產品 release，不是每個套件各一個。
- 仍有 changeset 檔時，release 工作流程會打開版本 PR。`pnpm version:packages` 把 `changeset version` 與根版本同步放在同一個 pnpm script。

## v1.0.2

[GitHub release](https://github.com/yanshekki/ysk-kit/releases/tag/v1.0.2)

### 改進

- `create-ysk-app` 把 git tag 解析成 commit，下載該 commit 的壓縮檔，並核對 `package.json` 的名稱與版本。
- 未設定 `REDIS_URL` 時，速率限制留在記憶體。設定之後，API 使用 Redis 固定窗口。
- 每個公開套件發佈 `license: MIT`、描述、`homepage` https://ysk.hk/products/ysk-kit、`repository.directory` 與 README。

### 修正

- README 的 License 與 Author 對齊 ysk-omni（commit `10e4782`）。

### 安全

- 生產環境的 `JWT_SECRET` 必須至少 32 個字元，而且不能是 `change-me-in-dev-only`。開發環境仍然接受範例密鑰。

| 組件 | 公告 | 嚴重程度 | 狀態 |
|---|---|---|---|
| mariadb | GHSA-cqhc-2h57-wpxf／CVE-2026-55215、GHSA-42r5-vhpq-m858、GHSA-g5xc-5w98-jfvm | HIGH 加兩項 moderate | 已修補。pnpm override `mariadb@3.4.7`（修補在 3.4.6）。`@prisma/adapter-mariadb` 原先釘在 3.4.5。 |
| mysql2 | GHSA-3f6p-5ww8-9rcr、GHSA-rgwj-5xj2-c3m3 | HIGH 加 moderate | 已修補。override `mysql2@3.24.5`。Prisma 原先釘在 3.15.3。 |
| deepmerge-ts | GHSA-ggr8-5vv4-36mx／CVE-2026-40345 | HIGH | 已修補。override `deepmerge-ts@8.0.2`。Prisma 原先釘在 7.1.5。 |
| uuid 7.0.3，經 Expo `xcode` | GHSA-w5hq-g745-h8pq／CVE-2026-41907 | moderate | 接受。修補是 uuid 11+，該版本只提供 ESM，會令 xcode 的 CommonJS `require()` 失效。記錄在 `auditConfig.ignoreGhsas`。 |
| Redis 8.10.2-alpine、Prometheus 3.15.0 | Trivy | — | 乾淨。 |
| Grafana 13.2.3、Jaeger 2.21.0、mysql:8.4、postgres:18-alpine | 映像內建插件、Alpine OpenSSL 或 `gosu` 的 CVE | HIGH／CRITICAL | 接受。官方映像。修補依賴上游重建。Postgres 19 當時仍是 beta。 |
| GitHub Actions | — | — | 釘在 commit SHA。CI 是 `contents: read`。release job 加上 contents write、pull-request write 與 `id-token: write`。npm 發佈設定 `NPM_CONFIG_PROVENANCE=true`。 |

### 依賴升級

| 套件 | 由 | 至 |
|---|---|---|
| Biome | 2.5.14 | 2.5.15 |
| Turborepo | 2.11.5 | 2.11.6 |
| dependency-cruiser | 18.4.0 | 18.5.0 |
| Vitest | 5.0.2 | 5.0.3 |
| Vite（web、admin） | 8.3.1 | 8.3.2 |
| React、react-dom | 19.2.3 | 19.2.8 |
| TanStack Router | 1.120.3 | 1.170.41 |
| Electron | 44.4.5 | 44.5.1 |
| Expo | 57.0.25 | 57.0.26 |
| BullMQ／Bull Board | 6.3.9／9.10.1 | 6.3.11／9.10.2 |
| pg | 8.16.3 | 8.23.1 |
| AWS S3 SDK | 3.1142.0 | 3.1144.0 |
| Redis 映像 | 8.10-alpine | 8.10.2-alpine |

該次 release 已經是當前版本的還有：nodemailer 10.0.13、socket.io 4.8.4、jose 6.2.12、Playwright 1.63.0、happy-dom 20.14.5、`@types/node` 24.19.0、`@types/supertest` 7.2.1。

暫緩：

| 項目 | 原因 |
|---|---|
| TypeScript 7.0.2 | dependency-cruiser 18.5 沒有 TypeScript 7 compiler API。維持 6.0.3。 |
| Prisma 8.0.0-rc.19 | Release candidate。`@prisma/client` 的 latest 當時仍是 7.10.0。 |
| 桌面 Vite 8 | electron-vite 5 的 peer 是 Vite 5–7。electron-vite 6（Vite 8）當時仍是 beta。桌面維持 Vite 7.3.6。 |
| React 19.3 | React Native 0.86.3 的 peer 是 `react` ^19.2.3。 |
| Expo 58／React Native 0.87 | 不是 Expo SDK 57 的一對。 |
| `@ts-rest/core` 3.52.1 | 本 kit 已經在 3.53.0-rc.1。`latest` 會是降級。 |
| MySQL `8.4` | LTS 浮動 tag。Innovation 9.x 不是本 kit 的預設。 |
| Postgres 18 | Postgres 19 當時仍是 beta。 |
| Node 24／pnpm 12.8.1 | 該次 release 已經是當前版本。 |

每個公開套件 1.0.2 的變更紀錄使用同一段依賴說明：Biome 2.5.15、Turborepo 2.11.6、Vitest 5.0.3、web／admin 的 Vite 8.3.2、React 19.2.8、Expo 57.0.26、Electron 44.5.1 的安全範圍，以及 `deepmerge-ts` 8.0.2、`mariadb` 3.4.7、`mysql2` 3.24.5 的 override。TypeScript 維持 6.0.3，Prisma 維持 7.10.0，桌面維持 Vite 7，`@ts-rest/core` 維持 3.53.0-rc.1。Turborepo `agentGuidance` 關閉，本倉 `AGENTS.md` 繼續做 agent 規範。

### 內部／CI

- 每個公開 `name@version` 已經在 registry 時，發佈略過 npm publish（commit `10e4782`）。
- `SECURITY.md`（英文與中文），以及 npm、GitHub Actions、Docker 的每週 Dependabot。
- CI 檢查內部 Markdown 連結。CI 執行 `pnpm audit --audit-level=low`。

## v1.0.1

[GitHub release](https://github.com/yanshekki/ysk-kit/releases/tag/v1.0.1)

### 改進

- 產生器 CLI 是 `ysk-kit`，短名 `yskk`。不再用 `ysk` 做產生器。`create-ysk-app` 不變。套件名稱維持 `@ysk-kit/*`。

### 修正

- CLI 改名之後，`example-smoke` 仍呼叫 `pnpm ysk`。改為呼叫 `ysk-kit`（commit `b44f84a`）。

## v1.0.0

[GitHub release](https://github.com/yanshekki/ysk-kit/releases/tag/v1.0.0)

### 新功能

- 首次公開發佈。工作區套件是 `@ysk-kit/*`。
- 合約先行的 SaaS kit（Express 5 + Fastify、Prisma、Vite web／admin、Expo、Electron）。
- 十六項 `ysk add` 能力與 `ysk add module`（`ysk` 命令在 v1.0.1 移除）。
- `examples/` 下十個已完成的範例。
- 公開程式庫在 npmjs org `ysk-kit`。從 registry 執行 `create-ysk-app` 會下載 `yanshekki/ysk-kit` 對應的 GitHub tag。
- GitHub 倉維持 `yanshekki/ysk-kit`。不使用 GitHub Packages。
