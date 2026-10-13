# PHP OpenAPI 客戶端

Language: [English](php-openapi-client.md) · 中文

用 PHP（或其他 HTTP 客戶端）經 **OpenAPI + JSON envelope** 呼叫既有 Kit API。不要複製 `apps/api`、Prisma 或 `application/`。決定：[ADR 0002](../adr/0002-polyglot-clients.zh.md)。Flavor 表：[客戶端語言選擇](../guides/flavors.zh.md#客戶端語言選擇)。Envelope：[envelope 指南](../guides/envelope.zh.md)。

Kit 的 TypeScript 應用仍然使用 `@ysk-kit/sdk`。本操作手冊給指向 `API_PUBLIC_URL` 的**非 TypeScript 呼叫端**。

## 你要產生甚麼

在 kit 工作副本（或任何已運行 API 的產品）執行：

```bash
# 1. 目錄——在這裏發現路徑，不要猜
pnpm gen:openapi
# 寫出 docs/openapi.yaml（運行中的 API 也提供 GET /openapi.json）

# 2. PHP + TypeScript、明白 envelope 的客戶端。沒有 Node 應用，沒有 Prisma。
pnpm --filter @ysk-kit/create-app start my-php-client --flavor php-bridge --yes
```

`php-bridge` 忽略 `--preset` 與 `--db`。它寫出：

| 路徑 | 角色 |
|---|---|
| `docs/openapi.yaml`（開倉時從 kit 複製） | 機器目錄。路由改動後，從**運行中的 API**（`GET /openapi.json`）更新 |
| `php/src/YskClient.php` | 明白 envelope 的 PHP 客戶端（`health`、`login`、通用 `request`） |
| `ts/src/client.ts` | TypeScript 同一套 unwrap（`unwrapEnvelope`） |
| 雙語 README | 如何把 `baseUrl` 指向 API |

型別化 kit 客戶端（`@ysk-kit/sdk`／`@ysk-kit/web-sdk`）留在 TypeScript 產品。PHP 不 import 它們。

## 你不可複製甚麼

| 不要 | 原因 |
|---|---|
| 把 `apps/api/src/modules/*/application/` 抄進 PHP | 規則會漂移；`pnpm layers` 看不見第二套 domain |
| 複製 Prisma schema／`@prisma/client`／`generated/prisma` | 資料庫是 API 背後的 adapter |
| 對 kit 路徑用 `file_get_contents`／Guzzle **卻不解開** `{ ok, data }`／`{ ok, error }` | 與 TypeScript `fetch('/v1/…')` 同一種錯誤 |
| 在 PHP 重寫租戶、帳單或會籍規則 | 那些留在 Node 的 `application/` |
| 另加 FastAPI、Axum、Tauri 或 Flutter「好讓 PHP 有兄弟」 | 按 ADR 0002 暫緩 |

## 把客戶端指向 API

先運行 living kit（或已產生產品），讓 `http://localhost:3001` 提供 JSON。然後：

```php
<?php
require __DIR__ . '/src/YskClient.php';

$client = new Ysk\YskClient('http://localhost:3001');
$tokens = $client->login('admin@ysk.hk', 'ysk-admin-dev');
$authed = new Ysk\YskClient(
    'http://localhost:3001',
    $tokens->accessToken ?? $tokens['accessToken'],
);

$me = $authed->request('GET', '/v1/me');
```

`YskClient::request` 已經會：

1. 送出 `Accept: application/json` 與 `x-ysk-platform`。
2. 有 token 時加上 `Authorization: Bearer …`。
3. `ok === true` 時回傳 `data`。
4. `ok === false` 時拋出帶 `error.code` 的 `YskApiError`。

不要把結果再包一層 envelope。不要把密碼、OTP 或 access token 寫進日誌。

## 發現其餘目錄

脚手架上的具名 helper 只覆蓋 `GET /health` 與 `POST /v1/auth/login`。其餘路徑在你讀過 OpenAPI 之後，用通用 `request()`：

```bash
curl -s http://localhost:3001/openapi.json | jq '.paths | keys'
```

例子（除四項已記錄的例外，仍是 envelope JSON）：

```php
$page = $authed->request('GET', '/v1/notifications?limit=20');
$created = $authed->request('POST', '/v1/files', [
    'fileName' => 'report.pdf',
    'contentType' => 'application/pdf',
    'byteSize' => 1024,
]);
```

SSE（`POST /v1/llm/stream`）、發票 PDF 302、`GET /docs` 與 `GET /openapi.json` 是僅有的 envelope 例外。PHP 呼叫端若需要 SSE，那是新的傳輸方式，不是另開一套 API 的理由。

## OpenAPI 指針（下一步產生甚麼）

要加具名方法時，從 `docs/openapi.yaml`（或 `GET /openapi.json`）產生。unwrap 只留一處（`YskClient::request`／`unwrapEnvelope`）。日後其他語言走同一邊界——那是 codegen，不是第二套 hexagonal 樹。

機器鍵仍然是 `error.code`（`UNAUTHENTICATED`、`FORBIDDEN`、`NOT_FOUND`……），不是翻譯過的 `message`。

## 驗證

```bash
pnpm gen:openapi
curl -s http://localhost:3001/health
# PHP：登入再 GET /v1/me——預期已 unwrap 的 data，或帶 code 的 YskApiError
```

Kit TypeScript 驗證不變：`pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent`。
