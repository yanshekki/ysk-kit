---
name: desktop-electron
description: >
  加固 YSK Kit Electron 桌面應用：contextIsolation、sandbox、CSP、導航與新視窗限制、IPC sender 驗證、safeStorage 且不要明文後備、自動更新簽名。
  改 apps/desktop/src/main 或 preload、新 IPC channel、開外部 URL、檔案系統、自動更新或打包時使用。
  中文：Electron 安全、CSP、IPC、safeStorage、自動更新。
  不要用於只改 renderer 的 UI，或沒有改 main process 的 web／admin token 儲存。
---

# Skill：desktop Electron

Language: [English](desktop-electron.md) · 中文

Electron 的威脅模型與瀏覽器不同：renderer XSS 可以升級成偷 token 或本機動作。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。Token 脈絡：[安全審查](security-review.zh.md)／[客戶端 token 儲存](security-review/references/client-token-storage.zh.md)。Renderer 仍然只經 `@ysk-kit/sdk` 呼叫 API。

## 觸發

- 改 `apps/desktop/src/main/**` 或 `preload/**`。
- 新 IPC channel、`shell.openExternal`、檔案系統、自動更新、打包、fuses。

不要用於只改 renderer 畫面（排版、文案、zinc token），或沒有改 main process 的 web／admin `localStorage`。

## 輸入

| 輸入 | 必要 | 備註 |
|---|---|---|
| 表面 | 是 | IPC／導航／儲存／更新／視窗 |
| Dev vs 生產載入 | 是 | `ELECTRON_RENDERER_URL` vs 打包後的 `loadFile` |

## 基線（每次審查）

`apps/desktop/src/main/index.ts` 已設 `contextIsolation: true` 與 `nodeIntegration: false`。維持它們。另外必須：

| 設定 | 要求 |
|---|---|
| `sandbox: true` | 在 `webPreferences` 明確寫出 |
| `webSecurity` | 不要設 `false` |
| CSP | `apps/desktop/src/renderer/index.html` 的 `<meta>` **或** `session.webRequest.onHeadersReceived` — 起步程式兩者都沒有 |
| 導航 | `will-navigate` + `setWindowOpenHandler` |
| IPC | 驗證 `event.senderFrame` |
| Token | `safeStorage`，不要明文後備 |

## 步驟

1. **WebPreferences。** `contextIsolation: true`、`nodeIntegration: false`、`sandbox: true`。Preload 是唯一橋樑（`apps/desktop/src/preload/index.ts`）。
2. **CSP。** default-src self；script-src self；connect-src API 公開 URL；生產不要 `unsafe-eval`。對應 Electron security checklist 第 1、7 項。
3. **導航。** `win.webContents.on('will-navigate', ...)`：用 `new URL()` 解析，比較 **origin**（不要 `startsWith`）。其他一律拒絕。`setWindowOpenHandler`：預設 `{ action: 'deny' }`。允許清單內的 `https:` URL 可在檢查 protocol + host 之後 `shell.openExternal`。永遠不要對未解析的 `openExternal(userString)` 放行。
4. **IPC。** Channel 名稱 `ysk:<area>:<verb>`（現有：`ysk:token:*`）。在 `ipcMain.handle` 裡把 `event.senderFrame?.url` 對上 dev renderer URL 或 custom protocol。參數用 Zod 驗。Preload 只暴露**窄**物件；不要把 `IpcRendererEvent` 傳給 renderer；不要 `exposeInMainWorld('api', { on: ipcRenderer.on })`。
5. **載入 URL。** 生產優先用 custom protocol（`protocol.handle`），代替 `file://` + `loadFile`。起步程式對打包應用用 `loadFile` — 視為熱點；新視窗不要擴大 `file://` 存取。
6. **Token。** `safeStorage.encryptString`／`decryptString`。若 `safeStorage.isEncryptionAvailable()` 為 false：token 只留記憶體，或拒絕持久化並顯示明確警告。**不要 UTF-8 檔案後備**（起步程式目前會寫明文）。Linux `basic_text` backend 較弱 — 寫進文件；若使用者選擇啟用，仍比裸 UTF-8 好。
7. **Fuses／自動更新。** 打包時關閉 `runAsNode` 與 `nodeCliInspect`（`@electron/fuses`）。自動更新產物必須簽名；不要下載並執行未簽名 zip。本 kit 尚未內建 updater — 要加就先寫計劃，不要默默 import `autoUpdater`。
8. 硬規則：renderer 不要 import Prisma、observability、Express，也不要 raw `fetch` kit 路徑。
9. [驗證改動](verify-change.zh.md)。

## Kit 起步熱點

描述正確模式；實作可能由另一個變更完成。

| Checklist（Electron security tutorial） | 起步程式 |
|---|---|
| 7 CSP | 沒有 |
| 13／14 導航與開新視窗 | 沒有 |
| 17 IPC sender | `ipcMain.handle` 忽略 `event` |
| 18 避免 `file://` | `loadFile` |
| 19 fuses | 未套用 |
| `safeStorage` 失敗 | 明文寫入 |

## 驗證

```bash
pnpm --filter @ysk-kit/desktop typecheck
pnpm --filter @ysk-kit/desktop test
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

預期：`ysk-kit check agent: ok`。

```bash
rg -n "nodeIntegration:\\s*true|webSecurity:\\s*false|contextIsolation:\\s*false|openExternal\\(" apps/desktop/src
```

預期沒有 `nodeIntegration: true`／`webSecurity: false`／`contextIsolation: false`。任何 `openExternal` 都必須有你指得到的允許清單。

可選：`pnpm --filter @ysk-kit/desktop start` — DevTools 不應出現你剛引入的 Electron security warning。

- [ ] Isolation + sandbox + CSP
- [ ] 導航與 `setWindowOpenHandler` 預設拒絕
- [ ] IPC sender + Zod
- [ ] 沒有明文 token 後備
- [ ] Renderer 只經 `@ysk-kit/sdk`

## 輸出格式

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

## 完成條件

基線旗標成立、IPC 已驗證來源、token 從不未加密落盤、導航預設拒絕、改了程式時五條驗證命令全綠。

## 反模式

| 症狀 | 改為 |
|---|---|
| `exposeInMainWorld('api', ipcRenderer)` | 窄的 `yskDesktop` 物件 |
| `url.startsWith('https://example.com')` | `new URL` + 比較 origin |
| 為了 Vite 關掉 `webSecurity` | 為 dev URL 修好 CORS／CSP |
| 「只在 Linux」明文 token | 只留記憶體，或明確警告 |
| `shell.openExternal(href from renderer)` | 允許清單 hosts + 只准 `https:` |

## 升級／詢問

加入自動更新、新的特權 IPC channel、關掉 isolation／sandbox，或放寬 `openExternal` 之前，先問。

## 來源

- Electron security tutorial（20 項 checklist） — <https://www.electronjs.org/docs/latest/tutorial/security>
- Context isolation／process sandboxing — Electron 文件
- `safeStorage` — <https://www.electronjs.org/docs/latest/api/safe-storage>
- `@electron/fuses` — <https://github.com/electron/fuses>
