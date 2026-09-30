# `create-ysk-app`

Language: [English](create-ysk-app.md) · 中文

從本 kit 產生一個產品。套件：`@ysk/create-app`。

```text
pnpm --filter @ysk/create-app start <name> [options]
pnpm create @ysk/app <name> [options]
```

在非 TTY 缺少 `<name>` 會列印 `--help` 並以狀態 1 結束。未知 `--flavor` 丟出 `not in this phase`。

## 互動

在 TTY 下，未傳的選項會被提問（名稱、flavor、preset、資料庫、admin、mobile）。空輸入保留預設。命令列已有的旗標不會再問。

`--yes` / `-y` 略過提問，使用預設值加上已傳的旗標。CI 與 pipe 是非 TTY，永不提問。

`php-bridge` 與 `static-web3` 不問 preset 或資料庫。只有 `saas` 會問 admin 與 mobile。

## 選項

| 旗標 | 值 | 預設 | 說明 |
|---|---|---|---|
| `--preset` | `thin` \| `full` | `thin` | thin 複製後剝走 llm、billing、organizations、devices。full 保留完整示範。`php-bridge` 與 `static-web3` 忽略此旗標。 |
| `--db` | `mysql` \| `postgresql` \| `sqlite` | `mysql` | 改寫 Prisma `provider`、`create-prisma.ts` 的 driver adapter、`DATABASE_URL` 與 Compose。SQLite 會去掉 `@db.*` 原生型別。 |
| `--flavor` | `saas` \| `desktop` \| `gateway` \| `php-bridge` \| `trading` \| `static-web3` | `saas` | 決定複製哪些 app。 |
| `--no-admin` | 旗標 | 包含 admin | 略過 `apps/admin`。flavor 本身已不含 admin 時忽略。gateway 一律包含 admin。 |
| `--no-mobile` | 旗標 | 包含 mobile | 略過 `apps/mobile`。flavor 本身已不含 mobile 時忽略。 |
| `--yes` / `-y` | 旗標 | 關閉 | 不提問。使用預設值與其他已傳旗標。 |

複製會略過 `node_modules`、`dist`、`.git`、`.turbo`、`coverage`、`.expo`、`.DS_Store`、`generated`、kit 根目錄的 `examples/` 教程、`.runs`、`.cursor`、`.grok`、編輯器目錄，以及 `.env.example` 以外的任何 `.env*` 檔。`tooling/examples` 與 `tooling/create-ysk-app` 會保留。複製之後，略過的 app（mobile、admin 等）會從 dest `pnpm-lock.yaml` 的 importers 刪走，令 `pnpm install` 在 frozen lockfile 下能跑。工作區 flavor 再從 `tooling/ysk-cli/templates/agent/` 寫入 Cursor／Grok skill 包裝。複製後的 `.gitignore` 會忽略 `.env` 與 `.env.*`（保留 `.env.example`）、sqlite `*.db`（包括 `apps/api/dev.db`）、`.cursor/`、`.grok/`、已產生的 Prisma、`node_modules`、編譯產物、Playwright 報告與 `.runs/`。

## Flavor

| Flavor | Apps | 附加檔 | Preset |
|---|---|---|---|
| `saas` | api、web、admin、mobile（旗標可去掉 admin/mobile） | — | 套用 |
| `desktop` | api、desktop | — | 套用 |
| `gateway` | api、admin | `GATEWAY.md` + `.zh.md` | 套用 |
| `php-bridge` | 沒有（OpenAPI + `ts/` + `php/` 客戶端） | 雙語 README | 忽略 |
| `trading` | api、web | `TRADING.md` + `.zh.md` | 套用 |
| `static-web3` | web | `WEB3.md` + `.zh.md` | 忽略 |

詳情：[flavors 指南](../guides/flavors.zh.md)。

## Thin preset

複製之後，thin 會移除 llm、billing、organizations 與 device（push）模組、Prisma model、路由與 web 畫面。身分、檔案、通知、工作、郵件、API 金鑰、加密與即時通訊保留。還原：

```bash
pnpm ysk add llm
pnpm ysk add team
pnpm ysk add billing    # 在 team 之後
pnpm ysk add push
```

複製過來的 `docs/openapi.yaml` 仍描述完整 kit，直到你在產品內執行 `pnpm gen:openapi`。

## 產生之後

CLI 會列印下一步。典型 Node flavor：

```bash
cd <name>
pnpm install
cp .env.example .env
docker compose up -d mysql    # sqlite 可略過
pnpm db:generate && pnpm db:migrate && pnpm db:seed
pnpm ysk add module <kebab> --prisma --web
pnpm gen:openapi
pnpm dev
```

產生出來的產品獲得 `.ysk-kit.json`、`README.md` 與 `README.zh.md`。種子帳戶：`admin@ysk.hk` / `ysk-admin-dev`。以 `pnpm ysk upgrade` 更新 kit 護欄（[指南](../guides/upgrade.zh.md)）。
