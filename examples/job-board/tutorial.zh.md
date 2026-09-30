# 招聘板

Language: [English](tutorial.md) · 中文

精簡 SaaS 產品，用來張貼職位並收集申請。兩個六角形模組，沒有額外能力。

以下截圖為 1280×800，對已套用的目的地擷取（API **13001**，web **15173**）。

## 1. 完成後你會得到甚麼

- 新產品目錄，含 `--preset thin` 的身份、檔案、通知、工作、郵件、API 金鑰、加密與即時通道。
- 模組 `job`：`GET/POST /v1/job` 及 `POST /v1/job/:id/publish`。
- 模組 `application`：`GET/POST /v1/application`。向未發布職位申請，或同一電郵再申請，都是 `CONFLICT`。
- 網頁 `/job` 與 `/application`（導航文字 **Job** 與 **Application**）。新職位由 **Unpublished** 開始；每列有 **Publish**。
- Seed 帳戶 `admin@ysk.hk`／`ysk-admin-dev` 與 `user@ysk.hk`／`ysk-user-dev`。管理員有一則已發布職位；使用者列表由空白開始。

![登入](screenshots/01-login.png)

**預期效果：**登入表單。標題 **Sign in**。

## 2. 誰適用、預計時間

招聘團隊，以及任何「職缺加求職信」。第一次約 **20–30 分鐘**。

## 3. 前置

- **Node 24** 與 **pnpm 12**
- 此 kit 的 checkout
- 可選：若改 `--db mysql`，需要 Docker MySQL 8.4

## 4. 為甚麼這個 flavor／preset／資料庫

| 選擇 | 值 | 原因 |
|---|---|---|
| Flavor | `saas` | Web + API |
| Preset | `thin` | 十五分鐘路徑。沒有 llm、billing、組織或 push |
| 資料庫 | `spec.json` 為 sqlite | 不需 Docker。Compose 可傳 `--db mysql` |
| Admin／mobile | 關閉 | 桌面 web 已足夠 |

行業職位**不會**掛在 living kit API。

## 5. 開倉命令

```bash
pnpm --filter @ysk-kit/examples start apply job-board --dest ~/Projects/my-jobs --yes
```

預設目的地（已 gitignore）：`examples/.runs/job-board`。覆蓋上一次結果請加 `--force`。

手動（sqlite）：`create-ysk-app` thin saas sqlite `--no-admin --no-mobile --yes`，然後 `ysk add module job --prisma --web`、`ysk add module application --prisma --web`，複製此 overlay，替換 Prisma 模型 `Job` 與 `Application`，`prisma db push`，seed。

## 6. 加哪些 module／capability，為甚麼這個順序

`spec.json` 先 `job` 再 `application`。能力清單空白。先加父模組，子模組的 Prisma 片段才能寫 `job Job @relation(...)`。

`examples/job-board/patches.json` 會改 memory 測試組裝，讓兩個服務共用同一個記憶體職位倉庫（產生器把 `applicationService` 插在 `jobService` 之上；patch 用 `jobRepo` 包起來）。

## 7. 資料模型

**Job**（`published` 是 Prisma `Boolean`，不是 TypeScript `enum`）：

| 欄位 | 類型 | 規則 |
|---|---|---|
| `title` | 1–80 | 必填 |
| `department` | 1–80 | 必填 |
| `published` | boolean | 建立時為 `false` |

**Application：**`jobId`、`applicantName`、`email`、`cover`（1–500）。唯一約束 `[jobId, email]`。

誰可讀寫：已登入使用者列出**自己的**列。發布要求同一個 `authorId`。

## 8. 業務規則

1. 空白標題 → `VALIDATION_FAILED`（HTTP 422）。
2. `POST /v1/job/:id/publish`：作者擁有且未發布 → `published: true`。已經發布 → `CONFLICT`（HTTP 409）。不明 id 或別人的列 → `NOT_FOUND`（HTTP 404）。
3. 向未發布職位申請 → `CONFLICT`。
4. 同一 `jobId` + `email` 再來一次 → `CONFLICT`。
5. 職位不存在 → `NOT_FOUND`。
6. 沒有工作階段 → `UNAUTHENTICATED`（HTTP 401）。

子倉庫方法：`getJob` → `{ id, authorId, published } | null`，`findByJobEmail`。

## 9. overlay 把哪些檔換成填好的版本

產生器仍用 `title`／`body`。overlay 覆寫 DTO、合約、服務、倉庫、HTTP 測試、Prisma 片段、SDK、web-sdk、兩個頁面與 seed。`app.ts` 與 `router.tsx` 維持 CLI 修補結果。`patches.json` 讓 memory harness 共用 `jobRepo`。

## 10. seed 會插入甚麼

| 電郵 | 密碼 | 角色 | 職位 |
|---|---|---|---|
| `admin@ysk.hk` | `ysk-admin-dev` | ADMIN | Ops lead，Operations，**已發布** |
| `user@ysk.hk` | `ysk-user-dev` | USER | 沒有 |

## 11. 啟動與登入

```bash
cd ~/Projects/my-jobs
pnpm dev
```

開啟 http://localhost:5173/login。以 `user@ysk.hk`／`ysk-user-dev` 登入。登入後到 `/users`。在導航開啟 **Job**。

## 12. UI 逐步

![空白列表](screenshots/02-empty.png)

**預期效果：**標題 **Jobs**，空白狀態 **No jobs**。

標題留空，按 **Create**。

![校驗錯誤](screenshots/03-invalid.png)

**預期效果：**警告橫額出現。表格仍是空的。

標題填 `React engineer`，部門 `Product`，Create。

![已建立](screenshots/04-created.png)

**預期效果：**一列 **React engineer**，狀態 **Unpublished**，按鈕 **Publish**。

先看 Scalar（下一節），再回到 `/job`，在該列按 **Publish**。狀態變成 **Published**。

開啟 **Application**，Job 選 **React engineer**，申請人 `Chan Tai Man`，電郵 `chan@ysk.hk`，求職信 `I use YSK Kit`，Create。

![申請](screenshots/06-application.png)

**預期效果：**一列 Chan Tai Man。

## 13. HTTP 逐步

基底 URL http://localhost:3001（擷取時為 **13001**）。`POST /v1/auth/login` 取得 Bearer。

**預期效果**（`expected/create-ok.json`）：HTTP **201**

```json
{
  "ok": true,
  "data": {
    "title": "React engineer",
    "department": "Product",
    "published": false
  }
}
```

空白標題 → HTTP **422** `{ "ok": false, "error": { "code": "VALIDATION_FAILED" } }`。

未發布就申請 → HTTP **409** `CONFLICT`（`expected/unpublished-apply.json`）。記憶體與 HTTP 測試都在發布**之前**覆蓋此例。

不明 `jobId` → HTTP **404** `NOT_FOUND`。

同一電郵再申請 → HTTP **409** `CONFLICT`。

沒有 `Authorization` → HTTP **401** `UNAUTHENTICATED`。

發布：`POST /v1/job/:id/publish`，本文 `{}`。

## 14. Scalar `/docs`

![Scalar 文件](screenshots/05-docs.png)

**預期效果：**Scalar 列出 `GET`／`POST /v1/job` 與 `POST /v1/job/{id}/publish`。`GET /openapi.json` 亦列出 `/v1/application`。

## 15. 驗證命令

在目的地內：

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk check agent
```

**預期效果：**全部綠色。職位測試涵蓋發布／第二次發布。申請測試涵蓋未發布申請、重複電郵與不明職位。

## 16. 本例不做甚麼

- 把 `job` 掛進 living kit
- 公開職缺目錄、ATS 評分或發信給申請人
- `ysk add team` 或 billing

## 17. 下一例

外勤工單（`field-work-orders`）是 [實例目錄](../README.zh.md) 的下一個系統。
