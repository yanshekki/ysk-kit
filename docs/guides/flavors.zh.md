# Flavors

Language: [English](flavors.md) · 中文

`--flavor` 決定 `create-ysk-app` 複製哪些 app。其後 `--preset` 再剝走可選能力。`--no-admin` / `--no-mobile` 只在該 flavor 仍然包含那些 app 時生效。

| Flavor | api | web | admin | mobile | desktop | worker | `--preset` | `--no-admin` | `--no-mobile` | `--db` |
|---|---|---|---|---|---|---|---|---|---|---|
| `saas` | 有 | 有 | 有 | 有 | 無 | 有 | 套用 | 生效 | 生效 | 套用 |
| `desktop` | 有 | 無 | 無 | 無 | 有 | 有 | 套用 | 忽略 | 忽略 | 套用 |
| `gateway` | 有 | 無 | 必定 | 無 | 無 | 有 | 套用 | 忽略 | 忽略 | 套用 |
| `php-bridge` | 無 | 無 | 無 | 無 | 無 | 無 | 忽略 | 忽略 | 忽略 | 忽略 |
| `trading` | 有 | 有 | 無 | 無 | 無 | 有 | 套用 | 忽略 | 忽略 | 套用 |
| `static-web3` | 無 | 有 | 無 | 無 | 無 | 無 | 忽略 | 忽略 | 忽略 | 忽略 |

## 各 flavor 的用途

**saas** — 多端產品：公開 web、營運 admin、可選 Expo 應用、一套 API。

**desktop** — Electron 經 `@ysk-kit/sdk` 呼叫同一套 API（`platform: desktop`）。Prisma 留在 API 行程，包括本機 SQLite。

**gateway** — 機器客戶端與營運主控台。以 `POST /v1/me/api-keys` 產生金鑰，其後 `Authorization: Bearer ysk_live_…`。寫出 `GATEWAY.md`。

**php-bridge** — 不複製本 monorepo。輸出 OpenAPI 以及明白 envelope 的 TypeScript 與 PHP 客戶端。請指向一套現有的 Kit API。其餘路徑用通用 `request()`。

**trading** — API + web + 既有 BullMQ worker。行情與交易所連接器寫在產品內。寫出 `TRADING.md`。

**static-web3** — 只有 Vite web 與 `@ysk-kit/*` 客戶端程式庫。沒有 Prisma，沒有 `DATABASE_URL`。若介面需要後端，將 `API_PUBLIC_URL` 指向遠端 API。錢包程式庫寫在產品內。寫出 `WEB3.md`。

CLI 旗標：[create-ysk-app](../cli/create-ysk-app.zh.md)。
