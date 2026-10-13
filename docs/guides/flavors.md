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

## Client language choice

The default stack is TypeScript. A different client language is a **flavor (or future flavor) plus OpenAPI codegen**, not a second domain. Law: [ADR 0002](../adr/0002-polyglot-clients.md). Kit TypeScript apps still call `@ysk-kit/sdk`; they do not gain raw `fetch`.

| Need | Choose | Do not |
|---|---|---|
| Ship with this monorepo, one team language | **Expo** (mobile) and **Electron** (desktop) — the living `saas` / `desktop` flavors | A second native UI “just in case” |
| PHP (or another HTTP client) against an existing Kit API | **`php-bridge` today**: OpenAPI + envelope-aware generated clients | Copy `apps/api` or Prisma into PHP |
| Pixel-native iOS/Android chrome, or a Dart/Kotlin team already in place | Optional future `mobile-flutter` **or** `mobile-kmp` — pick one when a product pays for it | Flutter and KMP and Expo in the same product without a business reason |
| Smaller desktop binary / OS webview | Optional future `desktop-tauri` (still consumes OpenAPI; does not replace Electron as the kit default) | Two desktop defaults (Electron + Tauri) |
| CPU-hot crypto, codecs, or signing | **Rust sidecar** behind a TS port (`application/` still owns rules). C++ only to wrap an existing lib | Membership, billing, or tenancy rules in Rust/C++ |
| ML infer | Python process as an **internal sidecar**; Node remains the product API | FastAPI as a sibling public API |
| Partner / machine traffic | REST envelope + API keys (`gateway`) | Public gRPC |

`create-ysk-app` does not yet scaffold Tauri, Flutter, or KMP. Until those flavors exist, generate an OpenAPI client and point it at `API_PUBLIC_URL`. Do not invent a parallel `application/` in another language. Copy-paste PHP walkthrough: [PHP OpenAPI client](../recipes/php-openapi-client.md).

CLI flags: [create-ysk-app](../cli/create-ysk-app.md).
