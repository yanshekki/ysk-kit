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

## 客戶端語言選擇

預設堆疊是 TypeScript。換成另一種客戶端語言是 **flavor（或將來的 flavor）加 OpenAPI codegen**，不是第二套 domain。法律：[ADR 0002](../adr/0002-polyglot-clients.zh.md)。Kit 的 TypeScript 應用仍然呼叫 `@ysk-kit/sdk`；它們不會因此改用 raw `fetch`。

| 需求 | 選擇 | 不要 |
|---|---|---|
| 與本 monorepo 鎖步、團隊同一語言 | **Expo**（流動應用）與 **Electron**（桌面）——現行 `saas`／`desktop` flavor | 「以防萬一」再維一套原生 UI |
| PHP（或其他 HTTP 客戶端）對接現有 Kit API | **今天用 `php-bridge`**：OpenAPI + 明白 envelope 的產生客戶端 | 把 `apps/api` 或 Prisma 抄進 PHP |
| 要像素級原生 iOS／Android，或團隊已是 Dart／Kotlin | 將來可選 `mobile-flutter` **或** `mobile-kmp`——有產品付費時擇一 | 同一產品無業務理由同時維 Flutter、KMP 與 Expo |
| 更小的桌面安裝包／系統 WebView | 將來可選 `desktop-tauri`（仍消費 OpenAPI；不取代 Electron 作為 kit 預設） | 兩個桌面預設（Electron + Tauri） |
| CPU 熱路徑的密碼學、編解碼或簽章 | **Rust sidecar**，放在 TS port 背後（規則仍由 `application/` 擁有）。C++ 只用來包既有函式庫 | 把會籍、帳單或租戶規則寫進 Rust／C++ |
| ML 推論 | Python 行程當**內部 sidecar**；產品 API 仍是 Node | 把 FastAPI 當兄弟公開 API |
| 合作方／機器流量 | REST envelope + API key（`gateway`） | 公開 gRPC |

`create-ysk-app` 尚未產生 Tauri、Flutter 或 KMP。那些 flavor 出現之前，產生 OpenAPI 客戶端並指向 `API_PUBLIC_URL`。不要用另一種語言另造一套 `application/`。

CLI 旗標：[create-ysk-app](../cli/create-ysk-app.zh.md)。
