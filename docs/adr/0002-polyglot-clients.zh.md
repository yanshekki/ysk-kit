# ADR 0002：多語言客戶端只停在 OpenAPI 邊界

Language: [English](0002-polyglot-clients.md) · 中文

- 狀態：accepted
- 日期：2026-10-13

## 背景

YSK Kit 現行堆疊是 TypeScript：`@ysk-kit/contracts` → hexagonal `apps/api`（預設 Express，`HTTP_ADAPTER` 可轉 Fastify）→ `@ysk-kit/sdk`／`@ysk-kit/web-sdk` → Vite web／admin、Expo 流動應用、Electron 桌面。硬規則把 Prisma 留在 API infra、JSON 維持 `{ ok, data }`／`{ ok, error }`、kit 客戶端只走 SDK。`pnpm layers`、`ysk-kit check agent` 與 `ysk-kit doctor` 守住這張圖。

產品有時要原生 UI（Swift、Kotlin、Flutter、Tauri）或非 TypeScript worker（Rust 密碼學、Python ML）。既有 `php-bridge` flavor 已輸出 OpenAPI 以及明白 envelope 的 TypeScript 與 PHP 客戶端，並不複製 API。風險是第二套 domain：把同一套租戶、帳單或會籍規則再用 Python、Rust 或 C++ 寫一次。

本決定記錄多語言邊界。它不加入 Tauri、Flutter、Kotlin Multiplatform、額外 `gen:client` 語言，也不加第二個 HTTP 伺服器。

## 選項

### 1. 永遠只有 TypeScript 客戶端

Expo 與 Electron 仍是唯一客戶端故事。非 TS 呼叫者自己對 OpenAPI 發 raw HTTP，kit 不提供協助。

- 維護成本最低。Skills、zinc token 與 CI 維持一種語言。
- 擋住已在出 PHP、Swift 或 Kotlin、只需要明白 envelope 的客戶端的團隊。
- 忽略已經可行的 `php-bridge` 模式。

### 2. 用另一種語言做兄弟 domain

在 `apps/api` 旁邊再立 FastAPI、Axum 或 C++ 服務，重寫產品規則。

- 外表像「多語言 monorepo」。
- 授權、租戶與 envelope 處理會漂移。`pnpm layers` 看不見第二棵樹。
- 違背合約先行：`@ysk-kit/contracts` 不再是唯一來源。

### 3. 以 OpenAPI + envelope 為唯一邊界（選用）

預設堆疊維持 TypeScript。可選的非 TS 客戶端是 flavor 或 codegen，消費 `docs/openapi.yaml` 並解開 envelope。Rust worker（或窄的 C++ addon）在 composition 背後實作 port；它們不擁有會籍或帳單規則。Python 是 ML sidecar，不是產品 API。

## 決定

**由 `@ysk-kit/contracts` 產生的 OpenAPI，加上 JSON envelope，是唯一的多語言 HTTP 邊界。**

- 預設產品堆疊維持 TypeScript：Node 26 API、Vite web／admin、Expo、Electron。
- Kit 的 TypeScript 客戶端仍然只用 `@ysk-kit/sdk`／`@ysk-kit/web-sdk`。硬規則 4、5、6、9、10 不放寬。`pnpm layers`、`check agent` 與 `doctor` 仍然必要。
- 不要把 domain 或業務規則複製進 Python、Rust 或 C++。那些語言可以在 port 背後包 adapter（密碼學、編解碼、ML 推論），由 `application/` 呼叫。
- 可選的非 TS HTTP 客戶端跟隨 `php-bridge`：輸出 OpenAPI + 明白 envelope 的產生客戶端。不要複製 Prisma、jobs 或 `application/`。
- Rust 只做 worker 或 crypto adapter，放在 port 背後（HTTP，或僅內網 gRPC）。它不是第二個公開 API。
- 暫緩把 FastAPI（或 Axum）當主 API。暫緩 Tauri、Flutter 與 Kotlin Multiplatform flavor，直到有真實產品提出。
- 公開、webhook、流動應用與合作方流量維持 REST + envelope。不要為「多語言」加公開 gRPC API。

### 分階段路線（本次只寫文件；運行時稍後）

| 階段 | 工作 | 不在本次改動 |
|---|---|---|
| 0 — 文件 | 本 ADR、flavors 語言選擇表、架構指針 | 運行時 |
| 1 — codegen | 額外 OpenAPI 客戶端目標（例如 Python + Swift 或 Kotlin）、golden envelope 夾具 | 第二個 API 伺服器 |
| 2 — 可選 flavor | 有客戶付費時才做 `desktop-tauri`，以及 Flutter 或 KMP 擇一 | 同時維兩套原生 UI |
| 3 — 只在有證據時 | 把 FastAPI 當兄弟主 API；把 hexagonal domain 搬去 Rust；C++ 當預設路徑 | 幾乎永不 |

## 後果

- Agent 用 [flavors](../guides/flavors.zh.md) 揀語言（今天是 `php-bridge`；將來才有其他客戶端 flavor），而不是 fork `application/`。
- 產生出來的 PHP、Swift 或 Dart 客戶端若跳過 envelope unwrap，與 TypeScript `fetch('/v1/…')` 同屬錯誤。
- 加入 Tauri、Flutter、KMP 或 `gen:client --lang` 需要獨立計劃、（如有）合約與驗證。本 ADR 不授權那些樹。
- Express 與 Fastify 仍然是 HTTP 伺服器。Hono、Nest、Next 與 Drizzle 仍非預設（ts-rest 釘選見 [ADR 0001](0001-ts-rest.zh.md)）。
