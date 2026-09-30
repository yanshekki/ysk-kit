# 課程報名

Language: [English](tutorial.md) · 中文

精簡 SaaS 產品，用來發布課程並按名額報名。兩個六角形模組，沒有額外能力。

以下截圖為 1280×800，對已套用的目的地擷取（API **13001**、web **15173**）。living kit 的 3001／5173 保持空閒。

## 1. 完成後你會得到甚麼

完成之後：

- 一個**新產品目錄**（不是本 kit），來自 `--preset thin`：身分、檔案、通知、工作、郵件、API 金鑰、加密與即時通訊。
- 模組 `course`，路徑 `GET/POST /v1/course`。
- 模組 `enrollment`，路徑 `GET/POST /v1/enrollment`。報名必須指向作者擁有的課程，且該課仍有空位。
- 網頁 `/course` 與 `/enrollment`（導航文字 **Course** 與 **Enrollment**）。
- 種子帳戶 `admin@ysk.hk`／`ysk-admin-dev` 與 `user@ysk.hk`／`ysk-user-dev`。管理員有一堂已滿的課；使用者列表由空白開始。
- 記憶體 port 測試：重複電郵、額滿、課程不存在。

![登入](screenshots/01-login.png)

**預期效果：** Sign in 表單，欄位 Email 與 Password。標題 **Sign in**。

## 2. 誰適用、預計時間

語言學校、工作坊，以及「具名學位加開課日」的產品。第一次約 **20–30 分鐘**（開倉 + overlay + seed）。只閱讀本頁也可以看清欄位與 envelope。

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
| Admin 應用 | 關閉 | 本例是教師的 Web 介面。 |
| 流動應用 | 關閉 | 外勤工單是較後的實例。 |

行業報名**不會**掛進 living kit 的 API。overlay 只複製到**目的地**。

## 5. 開倉命令

在 kit 工作副本執行：

```bash
pnpm --filter @ysk/examples start apply course-enrollment --dest ~/Projects/my-courses --yes
```

`--yes` 會傳給 `create-ysk-app`，agent 與 CI 不會等待 TTY。預設目的地（已 gitignore）是 `examples/.runs/course-enrollment`。覆蓋上一次結果：

```bash
pnpm --filter @ysk/examples start apply course-enrollment --yes --force
```

人手等價步驟（sqlite）：`create-ysk-app` thin saas sqlite `--no-admin --no-mobile --yes`，然後 `ysk add module course --prisma --web`、`ysk add module enrollment --prisma --web`，複製此 overlay，替換 Prisma 模型 `Course` 與 `Enrollment`，`prisma db push`，seed。

## 6. 模組與能力，以及這個順序的原因

`spec.json` 先 `course` 再 `enrollment`。**能力清單是空的。** 先加父模組，子模組的 Prisma 片段才能寫 `course Course @relation(...)`。

`examples/course-enrollment/patches.json` 會改 memory 測試組裝，讓兩個服務共用同一個記憶體課程倉庫（HTTP 測試先建課程再建報名）。子模組後加，因此產生器寫出的 `enrollmentService` 行會在 `userService` 之後、`courseService` **之上**。該修補把這兩行包進 IIFE，共用 `courseRepo`。

## 7. 資料模型

**Course**（名額是正整數，不是 TypeScript `enum`）：

| 欄位 | 類型 | 規則 |
|---|---|---|
| `id` | UUID | 自動產生 |
| `title` | 字串，1–80 | 必填 |
| `quota` | 整數 `> 0` | `z.number().int().positive()` |
| `startsOn` | ISO 日期 | `z.iso.date()`（`YYYY-MM-DD`） |
| `authorId` | UUID | 列的擁有者（已登入使用者） |
| `createdAt`／`updatedAt` | datetime | Prisma |

**Enrollment：**`courseId`、`studentName`（1–80）、`email`。Prisma `@@unique([courseId, email])`。

誰可讀寫：已登入使用者只列出**自己的**列。報名要求與課程同一個 `authorId`。

## 8. 業務規則

報名規則全部寫在 `apps/api/src/modules/enrollment/application/enrollment-service.ts`。`createEnrollmentService` 只接受**一個**倉庫參數。

1. `POST /v1/course` 的名額為 `0`（或任何非正整數）→ `VALIDATION_FAILED`（HTTP 422，Zod `positive()`）。
2. 報名的 `courseId` 不存在或不屬作者 → `NOT_FOUND`（HTTP 404）。
3. 同一 `courseId` + `email` → `CONFLICT`（HTTP 409）。
4. `countForCourse(courseId) >= quota` → `CONFLICT`（HTTP 409）。
5. 沒有 session → `UNAUTHENTICATED`（HTTP 401）。

子倉庫提供 `getCourse(id) → { id, authorId, quota } | null`、`countForCourse(courseId)`、`findByCourseEmail(courseId, email)`。Prisma 報名適配器會查 `prisma.course`。

## 9. overlay 與產生器預設的對照

| 路徑 | 產生器 | Overlay |
|---|---|---|
| `packages/contracts/src/dto/course.ts` | `title`、`body` | `title`、`quota`、`startsOn` |
| `packages/contracts/src/dto/enrollment.ts` | `title`、`body` | `courseId`、`studentName`、`email` |
| `application/enrollment-service.ts` | 直通 | 課程不存在／重複電郵／額滿 |
| `infra/*-enrollment-repository.ts` | title／body 列 | `getCourse`／`countForCourse`／`findByCourseEmail` |
| `modules/course/prisma/course.prisma` | title／body | 課程 model + `enrollments` 關聯 |
| `modules/enrollment/prisma/enrollment.prisma` | title／body | 報名 model + `@@unique([courseId, email])` |
| `apps/web/.../course-page.tsx` | title／body 表單 | Title、Quota、Starts on、EmptyState **No courses** |
| `apps/web/.../enrollment-page.tsx` | title／body 表單 | Course 選單、Student name、Email |
| `apps/api/src/infra/seed.ts` | 兩個使用者 | 兩個使用者 + 一堂已滿的 admin 課程 |

`app.ts` 與 `router.tsx` 維持 CLI 修補結果。

## 10. seed 資料

`pnpm db:seed` 會 upsert：

| 電郵 | 密碼 | 角色 | 課程 |
|---|---|---|---|
| `admin@ysk.hk` | `ysk-admin-dev` | ADMIN | Admin briefing，名額 `1`，另有一筆報名（`Lee Ka Ming`／`lee@ysk.hk`），因此該課已滿 |
| `user@ysk.hk` | `ysk-user-dev` | USER | 沒有 |

空白列表的截圖以 **user@ysk.hk** 登入，因此即使 seed 之後表格仍是空的。

## 11. 啟動與登入

```bash
cd ~/Projects/my-courses   # 或 examples/.runs/course-enrollment
pnpm dev
```

| 介面 | 網址 |
|---|---|
| API | http://localhost:3001 |
| Web | http://localhost:5173 |
| Scalar | http://localhost:3001/docs |

開啟 http://localhost:5173/login。

**預期效果：** 標題 **Sign in**、欄位 Email 與 Password、按鈕 **Sign in**。

以 `user@ysk.hk`／`ysk-user-dev` 登入。登入頁會導向 `/users`。在導航開啟 **Course**（路徑 `/course`）。

## 12. UI 逐步

### 空白列表

![空白課程](screenshots/02-empty.png)

**預期效果：** 標題 **Courses**、建立表單，以及 EmptyState 標題 **No courses**。

### 非法名額

Title 填 `Cantonese A1`，Quota 填 `0`，Starts on 填未來日期。按 **Create**。

![校驗錯誤](screenshots/03-invalid.png)

**預期效果：** 錯誤橫額（role `alert`）顯示 Zod 正整數訊息（`Too small: expected number to be >0`）。表格仍是空的。

### 已建立的列

Quota 改為 `8`。按 **Create**。

![已建立課程](screenshots/04-created.png)

**預期效果：** 表格出現 **Cantonese A1**，名額 `8`。EmptyState 消失。

開啟 **Enrollment**，Course 選 **Cantonese A1**，Student name 填 `Chan Tai Man`，Email 填 `chan@ysk.hk`，Create。

![報名](screenshots/06-enrollment.png)

**預期效果：** 表格出現 `chan@ysk.hk`。

## 13. HTTP 逐步

所有 JSON 路由使用 `{ ok: true, data }`／`{ ok: false, error }`。先註冊或登入；送出 `Authorization: Bearer <accessToken>` 與 `x-ysk-platform: web`。

### 成功 — `POST /v1/course`

```bash
curl -sS http://localhost:3001/v1/course \
  -H 'content-type: application/json' \
  -H 'x-ysk-platform: web' \
  -H "authorization: Bearer $TOKEN" \
  -d '{"title":"Cantonese A1","quota":8,"startsOn":"2035-03-01"}'
```

**預期效果**（id 與時間戳會變；見 `expected/create-ok.json`）：

```json
{
  "ok": true,
  "data": {
    "title": "Cantonese A1",
    "quota": 8,
    "startsOn": "2035-03-01"
  }
}
```

HTTP 狀態 **201**。

### 非法名額

使用 `"quota":0`。

**預期效果**（`expected/create-invalid.json`）：HTTP **422**

```json
{ "ok": false, "error": { "code": "VALIDATION_FAILED" } }
```

### 重複電郵

同一課程再報名一次 `chan@ysk.hk`。

**預期效果**（`expected/duplicate.json`）：HTTP **409**

```json
{ "ok": false, "error": { "code": "CONFLICT" } }
```

報名人數已達 `quota` 時，回傳同一個 `CONFLICT` envelope（`expected/enrollment-full.json`）。

### 課程不存在

`POST /v1/enrollment` 使用不明的 `courseId`。

**預期效果**（`expected/enrollment-missing.json`）：HTTP **404**

```json
{ "ok": false, "error": { "code": "NOT_FOUND" } }
```

### 沒有 session

省略 Authorization 標頭。

**預期效果**（`expected/unauthenticated.json`）：HTTP **401**

```json
{ "ok": false, "error": { "code": "UNAUTHENTICATED" } }
```

## 14. Scalar `/docs`

開啟 http://localhost:3001/docs（使用 `capture` 時為埠 13001）。

![Scalar 文件](screenshots/05-docs.png)

**預期效果：** Scalar API 參考 HTML。`GET /openapi.json` 列出 `/v1/course` 與 `/v1/enrollment`。執行 `pnpm gen:openapi` 之後，目的地的 `docs/openapi.yaml` 含有相同路徑。

## 15. 驗證命令

在目的地內：

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk check agent
```

**預期效果：** 全部綠色。課程測試涵蓋名額 `0`、重複電郵、額滿、課程不存在，以及上面的 HTTP envelope。`ysk check agent` 報告 `ysk check agent: ok`（沒有 TypeScript `enum`、web 沒有 Prisma、沒有 raw `fetch`）。

套用器除非傳 `--skip-verify`，否則已經跑這條門檻。

## 16. 本例不做甚麼

- 把 `course` 或 `enrollment` 掛進 living kit
- 候補名單、收費或出席
- `ysk add team` 或 billing（會員訂閱實例稍後提供）
- 真實 Stripe、Twilio、FCM、Redis、Jaeger、Grafana
- CI 視覺截圖比對（PNG 是文件；CI 以 sqlite 套用並跑測試）

## 17. 下一例

報價（`invoice-quotes`）是[實例索引](../README.zh.md)的下一個系統。
