---
name: test-plan
description: >
  為 YSK Kit 改動寫出按風險排序的測試計劃（given/when/then、夾具、明確不涵蓋），
  並對應合約、記憶體 port、API、SDK、客戶端與 Playwright 各層。
  使用者問如何測試、要覆蓋哪些案例，或在寫測試／發佈前要 QA 清單時使用。
---

# Skill：計劃測試

Language: [English](test-plan.md) · 中文

把一次改動寫成短而排序的測試計劃，再交給 [write-tests](write-tests.zh.md)。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。概念：[測試指南](../guides/testing.zh.md)。

## 觸發

- 使用者問如何測試、要覆蓋哪些案例，或要 QA 清單。
- 功能計劃的「測試計劃」一節仍空白或空泛。
- 範圍包括授權、租戶隔離、金錢、webhook、密鑰或併發。

可略過（除非被要求）：只改錯字或只改註解。

## 輸入

| 輸入 | 必要 | 備註 |
|---|---|---|
| 改了甚麼 | 是 | 一句。重述改動，不要照抄工單 |
| 表面 | 是 | contracts／application／HTTP／SDK／web／admin／mobile／desktop |
| Flavor／capability | 知道就填 | `thin` 沒有 llm／billing／orgs／push |

若缺少驗收條件，問一次，然後寫計劃。

## 程序

1. 用一句重述改動。
2. **最危險的行為排最前**：資料遺失、認證／授權、金錢、併發、租戶／組織隔離、密鑰（OTP、Stripe `sk_`、webhook 簽名）、冪等、速率限制。
3. 把每項風險對應到下表的 YSK Kit 層。較低層能令案例失敗時，不要升到 E2E。
4. 用 `given / when / then` 列出具體案例。先寫快樂路徑，再寫邊界與失敗。每個案例寫明層與檔案。
5. 註明 setup、夾具、factory。預設夾具：`createMemoryInput()` 加模組的記憶體 repository。
6. **明確寫出不涵蓋的範圍**，讓計劃短到可以立刻執行。

不要啟動 Redis、Stripe、Twilio、FCM、Jaeger 或 Grafana。計劃未寫好之前不要寫測試（除非使用者豁免計劃）。

## 分層對應

| 層 | 測甚麼 | 位置 | 做法 |
|---|---|---|---|
| 合約 | Zod DTO、error code、ts-rest 路徑、Prisma enum 漂移 | `packages/contracts/src/*.test.ts`、`@ysk-kit/db-prisma` | 合法通過／不合法拒絕；不走 HTTP |
| Domain／用例 | 業務規則、租戶、授權 | `apps/api/src/modules/<name>/application/`，測試放在記憶體 adapter 旁（`*.app.test.ts` 或 `*.test.ts`） | 記憶體 repository。沒有 Prisma、Express、Redis |
| API（envelope） | 狀態碼、`{ ok, data }`／`{ ok, error }`、code | `apps/api/src/*.test.ts`，經 `createApp(createMemoryInput())` 與 SuperTest | 打 ts-rest 路徑。斷言 `res.body.ok` 與 `error.code` |
| SDK | 解開 envelope、token、可選資源 | `packages/sdk/src/*.test.ts` | 注入 `fetchImpl`。不要打真實 API |
| 客戶端 | 表單、空白／錯誤／載入、`Can` | `apps/web|admin/src/**/*.test.tsx`、`packages/ui/src/ui.test.tsx` | Testing Library：role、label、`userEvent` |
| E2E | 單元測試看不見的登入／shell 路徑 | `apps/web/e2e/*.spec.ts` | Playwright Chromium。需要已遷移資料庫與種子。連接埠 3001／5173 |
| Mobile／desktop | Token store、adapter | `apps/mobile/src/**/*.test.ts`、`apps/desktop/src/**/*.test.ts` | 記憶體 token store。CI 沒有 Expo／Electron driver |

用 trophy，不要堆 E2E：大多數案例放在用例 + API envelope。E2E 保持一條薄 smoke。

## 輸出格式

**必須**使用以下標題，不要刪。計劃要短到一個工作階段內可執行。

```md
## Change

一句。

## Risks

1. 由高至低（資料遺失／授權／金錢／併發／租戶／密鑰）。

## Layer map

| Risk | Layer | File |
|---|---|---|
| … | application（記憶體 repo） | `apps/api/src/modules/<name>/infra/<name>.app.test.ts` |

## Cases

1. **<短名稱>** — layer: <層>
   given … / when … / then …
2. **<短名稱>** — layer: <層>
   given … / when … / then …

## Fixtures

- `createMemoryInput()`／`createMemory<Name>Repository()`
- 固定 id、假時鐘（`vi.useFakeTimers`）、注入的 `fetchImpl`
- 案例需要的使用者、組織或 API key

## Out of scope

- 故意不測的項目（真實 Stripe、其他 flavor、視覺打磨，…）
```

先寫快樂路徑。然後邊界（空清單、另一租戶、不合法 DTO、過期 token）。然後失敗（`UNAUTHENTICATED`、`FORBIDDEN`、`VALIDATION_FAILED`、`CONFLICT`、`RATE_LIMITED`、`NOT_FOUND`）。

## 例子（只示範形狀）

改動：「使用者可以建立一則 note。」風險 1：另一作者不可看見（租戶）。案例：given 作者 A 已建立一列／when 作者 B 列出／then `items` 為空 — layer: application（記憶體 repo）。夾具：`createMemoryNoteRepository()`。不涵蓋：Playwright、真實 MySQL。

## 完成條件

- [ ] 風險已排序；改動會碰到時，授權／租戶／envelope 錯誤都有出現
- [ ] 每個案例都是 `given / when / then`，並寫明層與檔案
- [ ] 夾具是記憶體（或注入的假物件）
- [ ] 不涵蓋範圍已寫明
- [ ] 案例實作接 [write-tests](write-tests.zh.md)

## 參考

- Cloudflare Agents `test-plan` skill（重述、風險排序、given/when/then、夾具、不涵蓋、固定標題）
- Cloudflare sandbox-sdk testing skill（單元對 E2E、精確命令）
- Testing trophy（偏整合；E2E 保持薄）
