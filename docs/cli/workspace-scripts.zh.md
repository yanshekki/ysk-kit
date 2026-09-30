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
| `pnpm release:publish` | 編譯然後 `changeset publish` | 把 `@ysk-kit/*` 發佈到 npmjs |

應用層：

| Script | 用途 |
|---|---|
| `pnpm --filter @ysk-kit/api start` | 編譯後的 API（`dist/main.js`） |
| `pnpm --filter @ysk-kit/desktop start` | Electron（script 名是 `start`，不是 `dev`） |
| `pnpm --filter @ysk-kit/mobile start` | Expo |
| `pnpm --filter @ysk-kit/web exec playwright install chromium` | 本機 Playwright 瀏覽器 |

`.github/workflows/ci.yml` 的 CI job：`check`（lint、layers、typecheck、test）、`thin-smoke`（sqlite saas，不含 admin/mobile）、`example-smoke`（matrix：把目錄裡每一個 slug 套用到 sqlite）、`e2e`（MySQL 8.4 + Chromium）。
