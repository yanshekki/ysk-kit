# 工作區 script

Language: [English](workspace-scripts.md) · 中文

根 `package.json` 的 script。需要 Node 24 與 pnpm 12（`packageManager` 為 `pnpm@12.8.1`）。

| Script | 命令 | 用途 |
|---|---|---|
| `pnpm dev` | `turbo dev` | API + web + admin（以及其他 `dev` 任務） |
| `pnpm build` | `turbo build` | 建置所有定義了 `build` 的套件與應用 |
| `pnpm typecheck` | `turbo typecheck` | 整個工作區的 TypeScript |
| `pnpm test` | `turbo test` | Vitest（記憶體 port；沒有真實 Redis/Stripe/Twilio/FCM） |
| `pnpm lint` | `biome check .` | Lint |
| `pnpm format` | `biome check --write .` | 格式化 |
| `pnpm layers` | `depcruise apps packages --config .dependency-cruiser.cjs` | Hexagonal import 圖 |
| `pnpm db:generate` | Prisma client generate | 寫出 `apps/api/src/generated/prisma` |
| `pnpm db:migrate` | Prisma migrate | 開發遷移 |
| `pnpm db:seed` | `apps/api/src/infra/seed.ts` | Upsert admin + user（生產環境需要 `ALLOW_SEED=1`） |
| `pnpm db:studio` | Prisma Studio | 檢視資料庫 |
| `pnpm e2e` | `@ysk-kit/web` 的 Playwright | 一條 Chromium smoke；需要 API 3001 與 web 5173 |
| `pnpm worker` | API worker 入口 | BullMQ（或記憶體）消費者 |
| `pnpm ysk-kit` / `pnpm yskk` | `@ysk-kit/cli start` | 產生器 |
| `pnpm gen:openapi` | `ysk-kit generate openapi` | 寫出 `docs/openapi.yaml` |
| `pnpm gen:module` | `ysk-kit add module` | 與 `pnpm ysk-kit add module` 相同（仍須提供名稱） |
| `pnpm pm2:start` | `pm2 start ecosystem.config.cjs` | 生產 API + worker |
| `pnpm changeset` | Changesets | 為可發布套件版本 |
| `pnpm build:packages` | 篩選 `packages/**` 與 `tooling/**` | 為程式庫輸出 `dist/` |
| `pnpm release:publish` | 編譯然後 `NPM_CONFIG_PROVENANCE=true pnpm changeset publish` | 把 `@ysk-kit/*` 連同 provenance 發佈到 npmjs |

應用層：

| Script | 用途 |
|---|---|
| `pnpm --filter @ysk-kit/api start` | 編譯後的 API（`dist/main.js`） |
| `pnpm --filter @ysk-kit/desktop start` | Electron（script 名是 `start`，不是 `dev`） |
| `pnpm --filter @ysk-kit/mobile start` | Expo |
| `pnpm --filter @ysk-kit/web exec playwright install chromium` | 本機 Playwright 瀏覽器 |

`.github/workflows/ci.yml` 的 CI job：`check`（lint、layers、typecheck、test）、`thin-smoke`（sqlite saas，不含 admin/mobile）、`flavor-smoke`（matrix：每個 flavor × `thin`／`full`，sqlite，然後 install／typecheck／test／build）、`example-smoke`（matrix：把目錄裡每一個 slug 套用到 sqlite）、`e2e`（MySQL 8.4 + Chromium）。`flavor-smoke` 快取 pnpm store 與 Electron 下載。`php-bridge` 與 `static-web3` 忽略 `--preset`；matrix 仍然產生兩種 preset，以確認旗標可被接受。

Release（`.github/workflows/release.yml`）在 push 到 `main` 且 `vars.NPM_PUBLISH` 為 `true` 時運行。只有每個 public `name@version` 已在 npmjs、而且沒有待處理的 changeset 檔時，才跳過 Changesets action（`.github/unpublished-packages.mjs`）。已發佈版本仍是 1.0.2 時，待處理的 changeset 仍然會打開版本 PR。版本指令是 `pnpm changeset version && node .github/sync-kit-version.mjs`。後一步把 `@ysk-kit/create-app` 的版本寫入私有的根 `package.json`，這就是 `create-ysk-app` 在 `vX.Y.Z` tarball 裡核對的版本。`create-github-releases` 設為 `false`，因此 action 不會為每個套件各開一個 GitHub Release。產品發佈維持單一 tag `vX.Y.Z`，與 v1.0.0、v1.0.1 相同。

### npm provenance 與 Trusted Publishing

`pnpm release:publish` 在 `changeset publish` 之前設定 `NPM_CONFIG_PROVENANCE=true`。npm 把這個變數當成 `npm publish --provenance`。`@changesets/cli` 3.0.3 不接受 `--provenance` 參數；傳入會令發佈失敗。工作流程仍然把 `secrets.NPM_TOKEN` 傳入 `NODE_AUTH_TOKEN`，因此現有的 token 發佈路徑保留。release job 的權限是 `contents: write`、`pull-requests: write`（Changesets 版本 PR 與 tag）與 `id-token: write`（GitHub OIDC）。工作流程預設是 `contents: read`。

Provenance 需要公開倉與公開套件。GitHub 用 OIDC token 簽署證明。在啟用 Trusted Publishing 之前，npm token 仍然負責上傳認證。

在 npmjs.com 為每個公開的 `@ysk-kit/*` 套件開啟（`packages/` 與 `tooling/` 底下、`private` 不是 true 的套件）：

1. 打開套件 → **Settings** → **Trusted Publisher** → **GitHub Actions**。
2. Organization 或 user：`yanshekki`。Repository：`ysk-kit`。Workflow 檔名：`release.yml`（必須完全一致，包括 `.yml`）。
3. 除非工作流程之後設定 `environment:`，否則環境留空。名稱區分大小寫，必須相符。
4. 使用 GitHub 託管的 runner（此工作流程用 `ubuntu-latest`）。自託管 runner 不能鑄造 npm 的 OIDC token。
5. 本倉已使用 Node 24，其 npm 可以交換 OIDC token（npm 11.5.1 或更新）。

Trusted Publisher 成功發佈一次之後，從 release job 移除 `NODE_AUTH_TOKEN`／`secrets.NPM_TOKEN`。該變數存在時，npm 用 token 認證，不會走 trusted-publisher 交換。兩種模式的 provenance 都使用 `id-token: write`。不要設定 `NPM_CONFIG_PROVENANCE=false`。

2026 年 5 月 20 日之後在 npmjs 建立的設定，必須明確允許 `npm publish` 動作。
