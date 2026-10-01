# ADR 0001：ts-rest 釘選與退出

Language: [English](0001-ts-rest.md) · 中文

- 狀態：accepted
- 日期：2026-10-01

## 背景

`@ysk-kit/contracts` 依賴 `@ts-rest/core`，版本精確為 `3.53.0-rc.1`（`packages/contracts/package.json`）。該版本於 2025 年 6 月 2 日發佈。最新穩定版 `3.52.1` 於 2025 年 3 月 4 日發佈。`ts-rest/ts-rest` 的 GitHub release 清單仍止於 `v3.53.0-rc.1`（2025 年 6 月 2 日）。截至 2026 年 10 月 1 日，沒有更新的 release。

[ts-rest/ts-rest#859](https://github.com/ts-rest/ts-rest/issues/859)（2025 年 11 月 20 日開啟，仍然開放，最後留言 2026 年 9 月 16 日）詢問專案是否仍有人維護。維護者沒有在該 issue 回覆。留言者表示在 GitHub 與 Discord 都沒有收到回覆，並描述已改用 oRPC、Hono 配 Zod OpenAPI 插件，或 Fastify 加 Zod type provider。

本倉對這個套件的運行時使用面很窄：

- 每個 contract 檔呼叫 `@ts-rest/core` 的 `initContract()`，組成普通物件：`{ method, path, body?, query?, pathParams?, responses, summary? }`。
- `@ysk-kit/api-http` 攤平這個形狀，再掛到 Express 與 Fastify。這些 adapter 沒有 import `@ts-rest/express` 或 `@ts-rest/fastify`。
- OpenAPI 由 `packages/api-http/src/openapi.ts` 的 `z.toJSONSchema` 產生。Kit 不依賴 `@ts-rest/open-api`。
- `@ysk-kit/sdk` 是手寫 resource。Kit 不呼叫 ts-rest 的 `initClient`。

`initContract` 是唯一的 import。HTTP 堆疊已經把 router 當成結構型別（`packages/api-http/src/flatten.ts` 的 `ContractRoute`）。

AGENTS.md 以 Express 5 為預設 HTTP 伺服器，Fastify 5 為第二個 adapter。Hono、Nest、Next 不是預設。本倉的 Zod 是 4。

## 選項

### 1. 維持釘選

留在 `3.53.0-rc.1`，依賴寫成精確版本（沒有 `^`）。

- 現有程式可以運行，我們呼叫的表面自釘選以來保持穩定。
- 一個沒有人維護的 release candidate 不會收到安全或 Zod 4 修正。今天的影響範圍是 contract builder，不是 HTTP 伺服器。
- 之後的 `pnpm update` 不可以意外把範圍放寬。

### 2. Fork 或 vendor

把 `@ts-rest/core` 複製進本倉，或發佈一個 fork。

- Fork 讓我們有地方修補這個 release candidate。
- 發佈的套件大約 518 kB。我們只呼叫一個函數。把整個 tarball vendor 進來，等於擁有我們沒有執行的程式。
- 發佈 fork 需要一個 npm 套件和一位維護者。這是擁有者的行動，不是隨手可換的改動。
- 現在做會改寫 lockfile 與每一個 `initContract` import，運行時收益很少。

### 3. 遷移到 oRPC

oRPC 是 contract-first，支援 OpenAPI，2026 年仍有 release。離開 ts-rest 的人把它視為最接近的替代。

- 它會換掉 router 物件、兩個 adapter 的假設、`ysk-kit add module` 模板、已完成實例的 overlay，以及手寫 SDK。
- 這是 `@ysk-kit/contracts` 與每個已產生產品的 major。
- oRPC 客戶端的呼叫形狀與 `@ysk-kit/sdk` resource 不同。我們要麼採用該客戶端，要麼保留手寫 SDK、只把 oRPC 當另一個物件 builder，那是用更高成本重複選項 4 的較小改動。

### 4. 遷移到 zod-openapi 或 Hono 風格的 router

`@hono/zod-openapi`（以及 Fastify 的 Zod type provider）仍有人維護，並從 Zod 產生 OpenAPI。想要 REST 而不是 RPC 客戶端的前 ts-rest 用戶，常落在 Hono。

- 把 Hono 做成 HTTP 伺服器，與 [架構](../architecture.zh.md) 的 Express／Fastify 決定相違。
- 只把 Hono router 用作規格產生器，同時仍由 Express 提供流量，會多出第二套 contract 方言。
- 本 kit 已經用 Zod 4 的 `z.toJSONSchema` 把 schema 轉成 OpenAPI。缺少的是那個小 router 物件，我們可以自己擁有。

## 決定

短期：維持 `@ts-rest/core@3.53.0-rc.1`。

- 依賴保持精確。`packages/contracts/src/ts-rest-pin.test.ts` 會在 `package.json` 或解析到的 tarball 離開該版本時失敗。
- 不要加入 `@ts-rest/express`、`@ts-rest/fastify`、`@ts-rest/open-api` 或 `initClient`。這些套件會加深對一個無人維護的樹的耦合。OpenAPI 留在 `@ysk-kit/api-http` 的 Zod 4。
- 這次改動不 fork、不 vendor。實際執行的表面是一個函數，而 fork 需要一個已發佈的套件。

v2 路徑：用倉內的 `defineContract` 取代 `initContract`，回傳 adapter 已經在走訪的同一種普通 router，然後刪除 `@ts-rest/core`。模板（`ysk-kit add module`、capability overlay、已完成實例）在同一個 major 一併切換。`@ysk-kit/sdk` 維持手寫 resource。

只有當該 major 同時想要產生出來的客戶端時，才重新評估 oRPC。在此之前，oRPC 與 Hono 不是這次遷移。

## 後果

- 有人提升或放寬 `@ts-rest/core` 而沒有同時修改本 ADR 與釘選測試時，CI 會失敗。
- 已產生的產品保留今天的 contract 檔。`ysk-kit doctor` 與 `flavor-smoke` 不需要新的 contract 程式庫。
- 仍然存在的供應鏈風險是這個已釘選的 tarball 本身。它在 npm 上不可變。被接受的風險是「上游沒有 bugfix」，v2 的倉內 builder 會移除這項風險。
- 這次遷移期間，Express 與 Fastify 仍然是 HTTP 伺服器。
