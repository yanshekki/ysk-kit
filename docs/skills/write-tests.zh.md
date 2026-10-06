---
name: write-tests
description: >
  在 YSK Kit 寫專業測試：按層用 trophy、記憶體 port、given/when/then、
  可重現夾具、envelope 與授權案例、精確的 Vitest／Playwright 命令。
  加測試、修 bug，或完成 test-plan 之後使用。
---

# Skill：寫測試

Language: [English](write-tests.md) · 中文

把 [test-plan](test-plan.zh.md) 的案例寫成測試。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。概念：[測試指南](../guides/testing.zh.md)。驗證：[verify-change](verify-change.zh.md)。

## 觸發

- 實作會改變行為的功能或修復。
- 測試計劃已存在（或改動小到不用計劃），必須補測試。
- 本倉出現 flake、缺少回歸測試，或 CI 測試失敗。

## 輸入

| 輸入 | 必要 | 備註 |
|---|---|---|
| 測試計劃 | 協議要求時必須 | 案例已排序 |
| 層／檔案 | 是 | 不要另開一棵測試樹 |

## Trophy（測試放哪裏）

能令行為失敗的最低層優先。不要在 Playwright 重複同一條斷言。

| 層 | 檔案 | 執行 |
|---|---|---|
| 合約 | `packages/contracts/src/*.test.ts` | `pnpm --filter @ysk-kit/contracts test` |
| Enum 漂移 | `packages/db-prisma` | `pnpm --filter @ysk-kit/db-prisma test` |
| 用例 | `apps/api/src/modules/<name>/infra/<name>.app.test.ts`（產生器：`service.test.ts.tmpl`） | `pnpm --filter @ysk-kit/api exec vitest run <file>` |
| HTTP envelope | `apps/api/src/app.test.ts`、`platform.app.test.ts`、模組 `*.app.test.ts` | SuperTest + `createApp(createMemoryInput())` |
| 套件單元 | `packages/<pkg>/src/*.test.ts` | `pnpm --filter @ysk-kit/<pkg> test` |
| SDK | `packages/sdk/src/*.test.ts` | 注入 `fetchImpl` |
| UI 邏輯 | `packages/ui-logic/src/*.test.ts` | 沒有 DOM |
| UI 元件 | `packages/ui/src/ui.test.tsx` | Testing Library + happy-dom |
| 客戶端頁 | `apps/web/src/**/*.test.tsx`（admin 相同） | Testing Library + `userEvent` |
| Mobile／desktop adapter | `apps/mobile/src/**/*.test.ts`、`apps/desktop/src/**/*.test.ts` | 記憶體 token store |
| E2E | `apps/web/e2e/*.spec.ts` | `pnpm e2e`（Playwright Chromium） |

`ysk-kit add module` 已寫出記憶體 repo 測試（建立 + 按 `authorId` 列出）以及未認證 HTTP 案例。**延伸該檔**，不要另 mkdir 一套。

## 命名與形狀

- 檔名：`*.test.ts`／`*.test.tsx`。Playwright：`apps/web/e2e` 下 `*.spec.ts`。
- `describe` 寫單元（`api auth`、`LoginPage`、`@ysk-kit/ui`）。`it` 寫可觀察結果（`returns UNAUTHENTICATED without a session`）。
- 每個測試用 **given / when / then**（與 AAA 相同）。一條 `it` 只測一個行為。
- 用使用者的方式查 UI：`getByRole`、`getByLabelText`。不要用 class 或 test id，除非真的沒有可及名稱。

```ts
it('returns UNAUTHENTICATED without a session', async () => {
  const mem = createMemoryInput();
  const app = createApp(mem.input);
  const res = await request(app).post('/v1/notes').send({ title: 'Hello', body: 'World' });
  expect(res.status).toBe(401);
  expect(res.body).toMatchObject({ ok: false, error: { code: 'UNAUTHENTICATED' } });
});
```

## 可重現

- 注入時鐘（`vi.useFakeTimers` 或 `now` port）。不要用 `sleep`／`setTimeout`「等 app」。
- 固定識別碼。given 資料用固定 UUID（`11111111-1111-1111-1111-111111111111`）。
- 沒有網絡。SDK、Stripe、Twilio 用 `fetchImpl`。未設 `REDIS_URL` 時用記憶體隊列。
- 斷言不要依賴 `Math.random()`。若程式需要熵，把它注入。
- SuperTest 與 Vitest 在行程內跑。單元測試不要用 `tsx` 啟動 API。

## 夾具、factory、假物件

- 預設組合：`createMemoryInput()`（與生產相同的 service，記憶體 port）。
- 模組 factory：產生器的 `createMemory<Name>Repository()`。
- 用 Zod schema 建立合法 command（`CreateUserCommandSchema.parse({ … })`），不合法案例再改副本。
- **優先用我們擁有的 port 的記憶體假物件**，少用 `vi.mock`。不要 mock `@ysk-kit/contracts`、不要從客戶端 mock Prisma、也不要在 web／admin／mobile／desktop mock `fetch`（那些 app 必須用 SDK；需要 HTTP 的測試走 SuperTest 或 `HttpClient` 的 `fetchImpl`）。
- 不要 mock 你不擁有的東西（Stripe HTTP、Twilio）。在 port 後面包一層，再假那個 port — 見 `stripe-billing.test.ts`（`fetchImpl` + HMAC）。

## Envelope、授權、租戶、密鑰

每條新 JSON 路由測試都要覆蓋：

| 案例 | Then |
|---|---|
| 快樂路徑 | `res.body.ok === true` 以及 `data` 形狀 |
| 沒有認證 | `401` `{ ok: false, error: { code: 'UNAUTHENTICATED' } }` |
| 角色不對 | `403` `FORBIDDEN` |
| 另一租戶／另一 `authorId` | 空頁或 `NOT_FOUND`，不可洩漏 |
| 不合法 body | `422` `VALIDATION_FAILED` |
| 重複 | 規則存在時 `409` `CONFLICT` |
| 速率限制 | 該路由有限制時 `429` `RATE_LIMITED`（`createMemoryRateLimit`） |

Webhook 簽名：對原始 body 做 HMAC（`createHmac`），拒絕壞簽名。冪等：重放同一事件，斷言只有一次副作用。不要把 OTP、Stripe `sk_` 或 webhook 密鑰寫進日誌或斷言。

## Snapshot

- Envelope 用 `toMatchObject`／明確欄位。
- 不要 snapshot 整棵 React 樹或整份 SuperTest body。
- OpenAPI 輸出屬 `pnpm gen:openapi`，不是 snapshot 檔。

## Flake

- Flake 就是失敗的測試。修競賽（假時鐘、Testing Library finder、Playwright web-first 斷言）。不要靠提高 Playwright `retries` 遮蓋（CI 已是 `retries: 1`）。
- `apps/web/playwright.config.ts` 是 `fullyParallel: false`、`workers: 1` — E2E 保持串行。
- 永不 `waitForTimeout`。用 `expect(locator).toBeVisible()`。

## Coverage

`pnpm test:coverage` 是**訊號**（`apps/*/src` 與 `packages/*/src` 設定 95%）。CI `check` 跑 `pnpm test`，不以 coverage 為閘。不要為了百分比而加測試。不要為了補缺口而 import Prisma、Redis 或 Stripe。

## 修 bug

**先寫會失敗的回歸測試**。確認它對該案例失敗，再修。保留該測試。

## 命令

```bash
# 整個工作區 Vitest
pnpm test

# 一個套件
pnpm --filter @ysk-kit/api test
pnpm --filter @ysk-kit/web test
pnpm --filter @ysk-kit/contracts test
pnpm --filter @ysk-kit/ui test

# 一個檔／一個名稱（Vitest）
pnpm --filter @ysk-kit/api exec vitest run src/app.test.ts
pnpm --filter @ysk-kit/api exec vitest run src/app.test.ts -t 'registers'
pnpm --filter @ysk-kit/web exec vitest run src/features/auth/login-page.test.tsx

# Playwright（需要 build、空閒 3001／5173、已遷移資料庫、種子）
pnpm --filter @ysk-kit/web exec playwright install chromium
pnpm --filter @ysk-kit/web build
pnpm e2e
pnpm --filter @ysk-kit/web exec playwright test e2e/users.smoke.spec.ts

# 改動之後
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

## Playwright、axe、視覺

本倉只帶 **一條 Chromium smoke**（`apps/web/e2e/users.smoke.spec.ts`）：種子 admin 登入並看見使用者表。只在單元測試看不見的使用者路徑（登入 shell、router）才延伸 E2E。用 `getByLabel`／`getByRole`，不用 CSS。

| 工具 | 本倉有嗎 | 規則 |
|---|---|---|
| Playwright | 有，只 Chromium | 改了登入／shell 時可選 `pnpm e2e` |
| `@axe-core/playwright` | **沒有** — 不要加 | 可選本機稽核；除非使用者要求，否則不要加依賴 |
| 視覺回歸（Percy、Chromatic、CI 截圖 diff） | **沒有** | 可選：本機 `await expect(page).toHaveScreenshot()`，375／768／1280。除非被要求，否則不要用它閘 CI |
| 屬性測試（`fast-check`） | **沒有** | 解析器可用表格案例。不要加依賴 |

UI 可及性跟 [ui-review](ui-review.zh.md)。Testing Library 查詢在缺少 label 時應該失敗。

## 完成條件（測試）

- [ ] 測試計劃的案例已出現在對應層
- [ ] 只用記憶體 port（沒有 Redis／Stripe／Twilio／FCM／Jaeger／Grafana）
- [ ] HTTP 測試斷言 envelope 的 `ok`／`error.code`
- [ ] 資源有擁有者時，有另一租戶／未認證案例
- [ ] 可重現（假時鐘、無 sleep、無真實網絡）
- [ ] 修 bug 時先寫回歸測試
- [ ] `pnpm test` 綠色；改了登入／shell 且連接埠空閒時 `pnpm e2e` 通過

## 參考

- Cloudflare sandbox-sdk testing skill（單元對 E2E、過濾單一檔／`-t`）
- Cloudflare Agents `test-plan`（given／when／then）
- Testing trophy；Testing Library guiding principles（用 role／label 查詢）
- Playwright 最佳做法（web-first 斷言，不用 `waitForTimeout`）
- 「不要 mock 你不擁有的東西」
