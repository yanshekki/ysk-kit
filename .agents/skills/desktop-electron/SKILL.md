---
name: desktop-electron
description: >
  Harden the YSK Kit Electron desktop app: contextIsolation, sandbox, CSP,
  navigation and new-window restrictions, IPC sender validation, safeStorage
  with no plaintext fallback, auto-update signing.
  Use when changing apps/desktop/src/main or preload, adding an IPC channel,
  opening external URLs, filesystem access, auto-update, or packaging.
  中文：Electron 安全、CSP、IPC、safeStorage、自動更新。
  Do not use for renderer-only UI or web/admin token storage with no main-process change.
---

Read `docs/skills/desktop-electron.md`. Law: `AGENTS.md`.

1. Keep contextIsolation, nodeIntegration false, sandbox, webSecurity, session CSP.
2. Deny unexpected navigation / window.open. Validate IPC `senderFrame`.
3. `safeStorage` only; memory if unavailable. No plaintext token file.
Gotcha: do not `openExternal` a renderer string without an allowlist.
Verify: `pnpm --filter @ysk-kit/desktop test`
Full steps: `docs/skills/desktop-electron.md`.
