# Capabilities

Language: [中文](capabilities.zh.md) · English

A **capability** is a catalogued platform feature. `ysk-kit add <name>` merges it into a product. A **module** is a business HTTP slice (`ysk-kit add module`). Do not confuse the two.

## Thin vs this repository

| Present after `--preset thin` | Stripped by thin (restore with `ysk-kit add`) |
|---|---|
| Identity (register, login, OTP, refresh, users) | `llm` |
| Files / storage | `team` (organizations) |
| Notifications | `billing` (needs `team` first) |
| Jobs + mail | `push` (devices) |
| API keys + crypto | |
| Realtime (Socket.IO) | |

This repository keeps the full set. `ysk-kit add` on a tree that already contains the skip token is a no-op.

## Catalogue

See the table in [ysk-kit CLI](../cli/ysk-kit.md). Sixteen names: `auth`, `rbac`, `audit-log`, `storage`, `i18n`, `jobs`, `mail`, `notifications`, `llm`, `websocket`, `push`, `mobile`, `team`, `apikey`, `crypto`, `billing`. Alias `org` → `team`.

Source trees are copied only for `llm`, `team`, `billing`, and `push`, from `tooling/ysk-cli/templates/capabilities/<name>/`, and only when `app.ts` / `composition.ts` do not already contain the skip token.

`team` restores web `/orgs` and, when the product has `apps/mobile`, Expo organisation list, detail, and accept-invite screens. `--preset thin` strips those screens.

`billing` requires `model Organization` in Prisma. Order: `ysk-kit add team` then `ysk-kit add billing`.

Flavor is not a capability. There is no `ysk-kit add trading` or `ysk-kit add web3`.

Recipe: [add-capability](../recipes/add-capability.md).
