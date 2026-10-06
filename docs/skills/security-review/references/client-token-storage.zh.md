# 客戶端 token 儲存

Language: [English](client-token-storage.md) · 中文

上層：[安全審查](../../security-review.zh.md)。桌面細節：[desktop-electron](../../desktop-electron.zh.md)。

Token 是工作階段密鑰。XSS、備份或被入侵的 renderer 都不應得到可重用的明文 refresh token。

## Web／admin

`apps/web/src/adapters/token-store.ts` 與 `apps/admin/src/adapters/token-store.ts` 使用 `createWebStorageTokenStore`（`packages/sdk/src/token-store.ts`）→ `localStorage`。任何 XSS 都能讀 `ysk.access`／`ysk.refresh`。

產品若能改 store，正確模式：

- 若 flavor 能由 API 持有 cookie 工作階段，優先用 httpOnly、`Secure`、`SameSite` cookie。
- 若繼續用 Web Storage，把 XSS 當成完整帳戶淪陷：收緊 CSP、不要對不可信 HTML 用 `dangerouslySetInnerHTML`、HTTP 只經 SDK。
- `memoryTokenStore()` 適合測試與短暫工作階段，不適合「記住我」。

## Mobile

`apps/mobile/src/adapters/token-store.ts` 使用 `expo-secure-store`。維持這樣。不要把 token 複製到 `AsyncStorage` 或寫進日誌。

## Desktop

`apps/desktop/src/main/index.ts` 使用 Electron `safeStorage`。當 `safeStorage.isEncryptionAvailable()` 為 false，**不要**寫 UTF-8 明文（起步程式目前會寫）。拒絕持久化（只留記憶體），或顯示明確警告並略過磁碟。IPC 必須驗證 `event.senderFrame`。完整清單：[desktop-electron](../../desktop-electron.zh.md)。

## SDK 合約

`@ysk-kit/sdk` 的 `TokenStore` 是唯一持久化接縫。客戶端不要在 SDK 以外自組 `Authorization` header 去 fetch kit 路徑。
