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

# Skill: desktop Electron

Language: [中文](desktop-electron.zh.md) · English

Electron’s threat model is not the browser’s: renderer XSS can become token theft or local actions. Law: [AGENTS.md](../../AGENTS.md). Token context: [security-review](security-review.md) / [client-token-storage](security-review/references/client-token-storage.md). Renderer still talks to the API only through `@ysk-kit/sdk`.

## Trigger

- Edits under `apps/desktop/src/main/**` or `preload/**`.
- New IPC channel, `shell.openExternal`, filesystem, auto-update, packaging, fuses.

Do not use for renderer-only screens (layout, copy, zinc tokens) or for web/admin `localStorage` with no main-process change.

## Inputs

| Input | Required | Notes |
|---|---|---|
| Surface | yes | IPC / navigation / storage / update / window |
| Dev vs production load | yes | `ELECTRON_RENDERER_URL` vs packaged `loadFile` |

## Baseline (every review)

`apps/desktop/src/main/index.ts` already sets `contextIsolation: true` and `nodeIntegration: false`. Keep them. Also require:

| Setting | Required |
|---|---|
| `sandbox: true` | Set explicitly on `webPreferences` |
| `webSecurity` | Do not set `false` |
| CSP | `<meta>` in `apps/desktop/src/renderer/index.html` **or** `session.webRequest.onHeadersReceived` — the starter has neither |
| Navigation | `will-navigate` + `setWindowOpenHandler` |
| IPC | Validate `event.senderFrame` |
| Tokens | `safeStorage` without plaintext fallback |

## Steps

1. **WebPreferences.** `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`. Preload is the only bridge (`apps/desktop/src/preload/index.ts`).
2. **CSP.** Default-src self; script-src self; connect-src API public URL; no `unsafe-eval` in production. Electron security checklist items 1 and 7.
3. **Navigation.** `win.webContents.on('will-navigate', ...)`: parse with `new URL()`, compare **origin** (not `startsWith`). Deny everything else. `setWindowOpenHandler`: default `{ action: 'deny' }`. Allowlisted `https:` URLs may `shell.openExternal` after checking protocol + host. Never `openExternal(userString)` without a parsed allowlist.
4. **IPC.** Channel names `ysk:<area>:<verb>` (existing: `ysk:token:*`). In `ipcMain.handle`, check `event.senderFrame?.url` against the dev renderer URL or the custom protocol. Validate payloads with Zod. Preload exposes a **narrow** object; do not pass `IpcRendererEvent` to the renderer; do not `exposeInMainWorld('api', { on: ipcRenderer.on })`.
5. **Load URL.** Prefer a custom protocol (`protocol.handle`) in production instead of `file://` + `loadFile`. The starter uses `loadFile` for the packaged app — treat that as a hotspot; new windows should not widen `file://` access.
6. **Tokens.** `safeStorage.encryptString` / `decryptString`. If `safeStorage.isEncryptionAvailable()` is false: keep tokens in memory or refuse persist with a visible warning. **No UTF-8 file fallback** (the starter currently writes plaintext). Linux `basic_text` backend is weaker — document it; still better than raw UTF-8 if the user opts in.
7. **Fuses / auto-update.** At package time disable `runAsNode` and `nodeCliInspect` (`@electron/fuses`). Auto-update artifacts must be signed; do not download and execute an unsigned zip. This kit does not ship an updater yet — adding one is a plan-first capability, not a silent `autoUpdater` import.
8. Hard rules: renderer imports neither Prisma, observability, Express, nor raw `fetch` to kit paths.
9. [verify-change](verify-change.md).

## Kit starter hotspots

Describe the pattern; a separate change may implement it.

| Checklist (Electron security tutorial) | Starter |
|---|---|
| 7 CSP | Missing |
| 13/14 navigation and window open | Missing |
| 17 IPC sender | `ipcMain.handle` ignores `event` |
| 18 avoid `file://` | `loadFile` |
| 19 fuses | Not applied |
| `safeStorage` failure | Plaintext write |

## Verification

```bash
pnpm --filter @ysk-kit/desktop typecheck
pnpm --filter @ysk-kit/desktop test
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

Expected: `ysk-kit check agent: ok`.

```bash
rg -n "nodeIntegration:\\s*true|webSecurity:\\s*false|contextIsolation:\\s*false|openExternal\\(" apps/desktop/src
```

Expect no `nodeIntegration: true` / `webSecurity: false` / `contextIsolation: false`. Any `openExternal` must sit behind an allowlist you can point to.

Optional: `pnpm --filter @ysk-kit/desktop start` — DevTools must not show Electron security warnings you just introduced.

- [ ] Isolation + sandbox + CSP
- [ ] Navigation and `setWindowOpenHandler` deny-by-default
- [ ] IPC sender + Zod
- [ ] No plaintext token fallback
- [ ] Renderer stays on `@ysk-kit/sdk`

## Output format

```md
## Desktop Electron — <scope>
webPreferences: contextIsolation / nodeIntegration / sandbox / webSecurity
CSP: <where or "missing">
Navigation: will-navigate / window-open
IPC channels: <name → sender check>
safeStorage: encrypt-only | refused persist
openExternal: <allowlist or none>
Fuses / updates: <n/a | signed>
```

## Done criteria

Baseline flags hold, IPC is authenticated, tokens never land unencrypted on disk, navigation is deny-by-default, five verify commands green when code changed.

## Anti-patterns

| Symptom | Do this instead |
|---|---|
| `exposeInMainWorld('api', ipcRenderer)` | Narrow `yskDesktop` object |
| `url.startsWith('https://example.com')` | `new URL` + origin compare |
| Disable `webSecurity` for Vite | Fix CORS / CSP for the dev URL |
| Plaintext token “just on Linux” | Memory-only or explicit warning |
| `shell.openExternal(href from renderer)` | Allowlist hosts + `https:` only |

## Escalate / ask

Ask before adding auto-update, a new privileged IPC channel, disabling isolation/sandbox, or widening `openExternal`.

## Sources

- Electron security tutorial (20 checklist items) — <https://www.electronjs.org/docs/latest/tutorial/security>
- Context isolation / process sandboxing — Electron docs
- `safeStorage` — <https://www.electronjs.org/docs/latest/api/safe-storage>
- `@electron/fuses` — <https://github.com/electron/fuses>
