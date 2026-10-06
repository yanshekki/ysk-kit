# Client token storage

Language: [中文](client-token-storage.zh.md) · English

Parent: [security-review](../../security-review.md). Desktop details: [desktop-electron](../../desktop-electron.md).

Tokens are session secrets. XSS, backup, or a compromised renderer must not yield a reusable refresh token in plaintext.

## Web / admin

`apps/web/src/adapters/token-store.ts` and `apps/admin/src/adapters/token-store.ts` use `createWebStorageTokenStore` (`packages/sdk/src/token-store.ts`) → `localStorage`. Any XSS can read `ysk.access` / `ysk.refresh`.

Required pattern for a product that can change the store:

- Prefer an httpOnly, `Secure`, `SameSite` cookie owned by the API if the flavor can host a cookie session.
- If Web Storage stays, treat XSS as full account takeover: tight CSP, no `dangerouslySetInnerHTML` with untrusted HTML, SDK-only HTTP.
- `memoryTokenStore()` is fine for tests and ephemeral sessions, not for “remember me”.

## Mobile

`apps/mobile/src/adapters/token-store.ts` uses `expo-secure-store`. Keep it. Do not copy tokens into `AsyncStorage` or log them.

## Desktop

`apps/desktop/src/main/index.ts` uses Electron `safeStorage`. When `safeStorage.isEncryptionAvailable()` is false, **do not** write UTF-8 plaintext (the starter currently does). Refuse persist (memory only) or show an explicit warning and skip disk. IPC must validate `event.senderFrame`. Full checklist: [desktop-electron](../../desktop-electron.md).

## SDK contract

`TokenStore` in `@ysk-kit/sdk` is the only persistence seam. Clients never fetch kit paths with a raw `Authorization` header they built outside the SDK.
