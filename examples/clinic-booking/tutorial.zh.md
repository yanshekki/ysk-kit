# 診所／顧問預約

Language: [English](tutorial.md) · 中文

一個 thin SaaS 產品，用來預約診所或顧問時段。這是第一個已完成的實例：一個模組、不加額外能力、CI 用 sqlite；若本機已有 Compose，可改用 MySQL。

以下截圖為 1280×800，對已套用的目的地擷取（API **13001**、web **15173**）。living kit 的 3001／5173 保持空閒。

## 1. 完成後你會得到甚麼

完成之後：

- 一個**新產品目錄**（不是本 kit），來自 `--preset thin`：身分、檔案、通知、工作、郵件、API 金鑰、加密與即時通訊。
- Hexagonal 模組 `appointment`，路徑 `GET/POST /v1/appointment`，另有取消與完成。
- Web 頁 `/appointment`：列表、建立表單，以及 `SCHEDULED` 列上的 Cancel／Complete。
- 種子帳戶 `admin@ysk.hk`／`ysk-admin-dev` 與 `user@ysk.hk`／`ysk-user-dev`。兩條未來預約只屬於 **admin**。
- 記憶體 port 測試：過去時間、重疊時段、取消規則。

![登入](screenshots/01-login.png)

**預期效果：** Sign in 表單，欄位 Email 與 Password。標題 **Sign in**。

## 2. 誰適用、預計時間

顧問、診所，以及「每個已登入使用者一張時段日曆」的產品。第一次約 **15–25 分鐘**（開倉 + overlay + seed）。只閱讀本頁也可以看清欄位與 envelope。

## 3. 前置

- **Node 24** 與 **pnpm 12**
- 本 kit 的工作副本（套用器在此）
- 可選：若改用 `--db mysql`，需要 Docker MySQL 8.4

SQLite 不需要 Compose。套用命令依 `spec.json` 預設 sqlite。

## 4. 為甚麼這個 flavor、preset 與資料庫

| 選擇 | 值 | 原因 |
|---|---|---|
| Flavor | `saas` | Web + API。Gateway／php-bridge／trading／static-web3 已有 flavor 手冊。 |
| Preset | `thin` | 十五分鐘路徑。沒有 llm、billing、organizations 或 push 裝置。 |
| 資料庫 | CI 與 `spec.json` 用 sqlite | 不需要 Docker。接近生產的本機工作可傳 `--db mysql`。 |
| Admin 應用 | 關閉 | 本例是執業者的 Web 介面。 |
| 流動應用 | 關閉 | 外勤工單是較後的實例。 |

行業預約**不會**掛進 living kit 的 API。overlay 只複製到**目的地**。

## 5. 開倉命令

在 kit 工作副本執行：

```bash
pnpm --filter @ysk/examples start apply clinic-booking --dest ~/Projects/my-clinic --yes
```

`--yes` 會傳給 `create-ysk-app`，agent 與 CI 不會等待 TTY。預設目的地（已 gitignore）是 `examples/.runs/clinic-booking`。覆蓋上一次結果：

```bash
pnpm --filter @ysk/examples start apply clinic-booking --yes --force
```

人手等價步驟（MySQL）：

```bash
pnpm --filter @ysk/create-app start my-clinic --preset thin --flavor saas --db mysql --no-admin --no-mobile --yes
cd my-clinic
pnpm install
cp .env.example .env
docker compose up -d mysql
pnpm db:generate && pnpm db:migrate && pnpm db:seed
pnpm ysk add module appointment --prisma --web
# 然後把 examples/clinic-booking/overlay/ 覆寫進此樹
# 用 overlay 片段取代 apps/api/prisma/schema.prisma 內的 model Appointment
pnpm db:generate && pnpm db:migrate && pnpm db:seed
pnpm gen:openapi
pnpm dev
```

SQLite 略過 Compose，並用 `prisma db push` 代替 `migrate dev`（migrate 會進入互動模式）。

## 6. 模組與能力，以及這個順序的原因

`spec.json` 只列一個模組：`appointment`，並帶 `--prisma --web`。**能力清單是空的。** 較後的實例若需要組織與收費，會先 `team` 再 `billing`。

`ysk add module` 寫出 hexagonal 切片，並修補 Express、Fastify、composition、SDK、web-sdk 與 web 路由（`/appointment`）。產生器仍使用 `title`／`body`。overlay 隨後把那些檔換成診所欄位。

## 7. 資料模型

Prisma model `Appointment`（狀態是 `String`，不是 TypeScript `enum`）：

| 欄位 | 類型 | 規則 |
|---|---|---|
| `id` | UUID | 自動產生 |
| `patientName` | 字串，1–80 | 必填 |
| `phone` | `+852` 加八位數字 | `HkPhoneSchema` |
| `startsAt` | ISO datetime | 建立時必須 ≥ 現在 |
| `durationMin` | 整數 15–180 | 預設 30 |
| `status` | `SCHEDULED` \| `CANCELLED` \| `DONE` | `@ysk/contracts` 內 `as const` + Zod |
| `authorId` | UUID | 列的擁有者（已登入使用者） |
| `createdAt`／`updatedAt` | datetime | Prisma |

誰可讀寫：已登入使用者只列出**自己的**列。取消與完成要求同一個 `authorId`。本例沒有職員角色。

## 8. 業務規則

全部寫在 `apps/api/src/modules/appointment/application/appointment-service.ts`。

1. `startsAt` 早於 `now` → `VALIDATION_FAILED`（HTTP 422）。
2. 新的 `SCHEDULED` 列，其半開區間 `[startsAt, startsAt + durationMin)` 與**同一**作者另一條 `SCHEDULED` 重疊 → `CONFLICT`（HTTP 409）。緊接的時段（下一條剛好在上一條結束時開始）允許。
3. 作者可取消自己的 `SCHEDULED` 列 → `CANCELLED`。
4. 作者可完成自己的 `SCHEDULED` 列 → `DONE`。
5. `CANCELLED` 與 `DONE` 不可再改 → `CONFLICT`。
6. 不明 id 或別人的列 → `NOT_FOUND`（HTTP 404）。
7. 沒有 session → `UNAUTHENTICATED`（HTTP 401）。

服務接受可選的 `now` 函數，測試可凍結時鐘。composition 省略它，使用 `new Date()`。

## 9. overlay 與產生器預設的對照

| 路徑 | 產生器 | Overlay |
|---|---|---|
| `packages/contracts/src/dto/appointment.ts` | `title`、`body` | `patientName`、`phone`、`startsAt`、`durationMin`、`status` |
| `packages/contracts/src/api/appointment.ts` | list + create | list、create、cancel、complete |
| `application/appointment-service.ts` | 直通 | 過去時間／重疊／取消／完成 |
| `infra/*-appointment-repository.ts` | title／body 列 | 診所欄位 + `getById`／`updateStatus`／`listScheduledForAuthor` |
| `infra/appointment-router.ts` | list + create | 四個 handler |
| `infra/appointment.test.ts` | 建立／列表 | 規則 + HTTP envelope |
| `modules/appointment/prisma/appointment.prisma` | title／body | 診所 model（並**取代** `schema.prisma` 內的 model；merge 不會更新已存在的 model） |
| `packages/sdk`／`web-sdk` | list／create | 加上 cancel／complete |
| `apps/web/.../appointment-page.tsx` | title／body 表單 | 診所表單、EmptyState、Cancel |
| `apps/api/src/infra/seed.ts` | 兩個使用者 | 兩個使用者 + 兩條 admin 預約 |

## 10. seed 資料

`pnpm db:seed` 會 upsert：

| 電郵 | 密碼 | 角色 | 預約 |
|---|---|---|---|
| `admin@ysk.hk` | `ysk-admin-dev` | ADMIN | Wong Mei Ling（+24 小時，30 分鐘）、Lee Ka Ming（+48 小時，45 分鐘），均為 `SCHEDULED` |
| `user@ysk.hk` | `ysk-user-dev` | USER | 沒有 |

空白列表的截圖以 **user@ysk.hk** 登入，因此即使 seed 之後表格仍是空的。

## 11. 啟動與登入

```bash
cd ~/Projects/my-clinic   # 或 examples/.runs/clinic-booking
pnpm dev
```

| 介面 | 網址 |
|---|---|
| API | http://localhost:3001 |
| Web | http://localhost:5173 |
| Scalar | http://localhost:3001/docs |

開啟 http://localhost:5173/login。

**預期效果：** 標題 **Sign in**、欄位 Email 與 Password、按鈕 **Sign in**。

以 `user@ysk.hk`／`ysk-user-dev` 登入。登入頁會導向 `/users`。在導航開啟 **Appointment**（路徑 `/appointment`）。

## 12. UI 逐步

### 空白列表

![空白預約](screenshots/02-empty.png)

**預期效果：** 標題 **Appointments**、建立表單，以及 EmptyState 標題 **No appointments**，說明 “Create a booking to populate this table.”

### 非法電話

保留未來的 **Starts at**。Patient name 填 `Chan Tai Man`，Phone 填 `123`，Duration 填 `30`。按 **Create**。

![校驗錯誤](screenshots/03-invalid.png)

**預期效果：** 錯誤橫額（role `alert`）顯示 **Expected +852 and 8 digits**。表格仍是空的。

### 已建立的列

Phone 改為 `+85291234567`。按 **Create**。

![已建立預約](screenshots/04-created.png)

**預期效果：** 表格出現 **Chan Tai Man**，電話 `+85291234567`，狀態 `SCHEDULED`，按鈕 **Cancel** 與 **Complete**。EmptyState 消失。表單的姓名已清空。

在該列按 Cancel，狀態變成 `CANCELLED`，按鈕隱藏。完成一條 `SCHEDULED` 列會變成 `DONE`。第二條預約若與尚餘的 `SCHEDULED` 時間重疊，會顯示 “That slot overlaps an existing appointment”。

## 13. HTTP 逐步

所有 JSON 路由使用 `{ ok: true, data }`／`{ ok: false, error }`。先註冊或登入；送出 `Authorization: Bearer <accessToken>` 與 `x-ysk-platform: web`。

### 成功 — `POST /v1/appointment`

```bash
curl -sS http://localhost:3001/v1/appointment \
  -H 'content-type: application/json' \
  -H 'x-ysk-platform: web' \
  -H "authorization: Bearer $TOKEN" \
  -d '{"patientName":"Chan Tai Man","phone":"+85291234567","startsAt":"2035-03-01T02:00:00.000Z","durationMin":30}'
```

**預期效果**（id 與時間戳會變；見 `expected/create-ok.json`）：

```json
{
  "ok": true,
  "data": {
    "patientName": "Chan Tai Man",
    "phone": "+85291234567",
    "durationMin": 30,
    "status": "SCHEDULED"
  }
}
```

HTTP 狀態 **201**。

### 過去時間

使用 `"startsAt":"2020-01-01T02:00:00.000Z"`。

**預期效果**（`expected/create-past.json`）：HTTP **422**

```json
{ "ok": false, "error": { "code": "VALIDATION_FAILED" } }
```

### 重疊

先建立 02:00 的時段，再 POST 另一條 02:15、時長 30。

**預期效果**（`expected/overlap.json`）：HTTP **409**

```json
{ "ok": false, "error": { "code": "CONFLICT" } }
```

### 沒有 session

省略 Authorization 標頭。

**預期效果**（`expected/unauthenticated.json`）：HTTP **401**

```json
{ "ok": false, "error": { "code": "UNAUTHENTICATED" } }
```

取消：`POST /v1/appointment/:id/cancel`，本文 `{}`。完成：`POST /v1/appointment/:id/complete`。

## 14. Scalar `/docs`

開啟 http://localhost:3001/docs（使用 `capture` 時為埠 13001）。

![Scalar 文件](screenshots/05-docs.png)

**預期效果：** Scalar API 參考 HTML。`GET /openapi.json` 列出 `/v1/appointment`、`/v1/appointment/{id}/cancel` 與 `/v1/appointment/{id}/complete`。執行 `pnpm gen:openapi` 之後，目的地的 `docs/openapi.yaml` 含有相同路徑。

## 15. 驗證命令

在目的地內：

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk check agent
```

**預期效果：** 全部綠色。預約測試涵蓋過去時間、重疊、緊接時段、取消／完成，以及上面四個 HTTP envelope。`ysk check agent` 報告 `ysk check agent: ok`（沒有 TypeScript `enum`、web 沒有 Prisma、沒有 raw `fetch`）。

套用器除非傳 `--skip-verify`，否則已經跑這條門檻。

## 16. 本例不做甚麼

- 把 `appointment` 掛進 living kit
- 職員／多執業者日曆、Google Calendar、SMS 提醒
- `ysk add team` 或 billing（見[會員訂閱](../membership-club/tutorial.zh.md)）
- 真實 Stripe、Twilio、FCM、Redis、Jaeger、Grafana
- CI 視覺截圖比對（PNG 會提交；CI 以 sqlite 套用並跑測試）

## 17. 下一例

CRM 客戶與跟進（`crm-contacts`）是下一個系統：[教程](../crm-contacts/tutorial.zh.md)。完整目錄見[實例索引](../README.zh.md)。
