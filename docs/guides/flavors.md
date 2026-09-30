# Flavors

Language: [中文](flavors.zh.md) · English

`--flavor` selects which apps `create-ysk-app` copies. `--preset` then thins optional capabilities. `--no-admin` / `--no-mobile` only apply when the flavor still includes those apps.

| Flavor | api | web | admin | mobile | desktop | worker | `--preset` | `--no-admin` | `--no-mobile` | `--db` |
|---|---|---|---|---|---|---|---|---|---|---|
| `saas` | yes | yes | yes | yes | no | yes | applied | honoured | honoured | applied |
| `desktop` | yes | no | no | no | yes | yes | applied | ignored | ignored | applied |
| `gateway` | yes | no | always | no | no | yes | applied | ignored | ignored | applied |
| `php-bridge` | no | no | no | no | no | no | ignored | ignored | ignored | ignored |
| `trading` | yes | yes | no | no | no | yes | applied | ignored | ignored | applied |
| `static-web3` | no | yes | no | no | no | no | ignored | ignored | ignored | ignored |

## What each flavor is for

**saas** — multi-surface product: public web, operator admin, optional Expo app, one API.

**desktop** — Electron talks to the same API through `@ysk-kit/sdk` (`platform: desktop`). Prisma stays in the API process, including localhost SQLite.

**gateway** — machine clients and an operator console. Mint keys with `POST /v1/me/api-keys`, then `Authorization: Bearer ysk_live_…`. Writes `GATEWAY.md`.

**php-bridge** — does not copy this monorepo. Emits OpenAPI plus envelope-aware TypeScript and PHP clients. Point them at an existing Kit API. Remaining paths use generic `request()`.

**trading** — API + web + the existing BullMQ worker. Market data and exchange connectors stay in the product. Writes `TRADING.md`.

**static-web3** — Vite web and `@ysk-kit/*` client libraries only. No Prisma, no `DATABASE_URL`. Point `API_PUBLIC_URL` at a remote API if the UI needs one. Wallet libraries belong in the product. Writes `WEB3.md`.

CLI flags: [create-ysk-app](../cli/create-ysk-app.md).
