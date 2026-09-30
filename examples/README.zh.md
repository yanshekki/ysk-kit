# 已完成的實例

Language: [English](README.md) · 中文

十個可以用 YSK Kit 開出來的產品系統。每個實例是一份 **overlay** 加雙語逐步教程。living kit **不會**掛上這些行業路由。你把實例套用到一個**新產品目錄**。

## 目錄

| # | Slug | 系統 | 開倉 | 狀態 | 教程 |
|---|---|---|---|---|---|
| 01 | `clinic-booking` | 診所／顧問預約 | saas thin，sqlite | 現已提供 | [中文](clinic-booking/tutorial.zh.md) · [EN](clinic-booking/tutorial.md) |
| 02 | `crm-contacts` | CRM 客戶與跟進 | saas thin | 現已提供 | [中文](crm-contacts/tutorial.zh.md) · [EN](crm-contacts/tutorial.md) |
| 03 | `inventory-stock` | 進銷存 | saas thin | 現已提供 | [中文](inventory-stock/tutorial.zh.md) · [EN](inventory-stock/tutorial.md) |
| 04 | `helpdesk-tickets` | 客服工單 | saas thin + team | 現已提供 | [中文](helpdesk-tickets/tutorial.zh.md) · [EN](helpdesk-tickets/tutorial.md) |
| 05 | `membership-club` | 會員訂閱 | saas thin + team + billing | 現已提供 | [中文](membership-club/tutorial.zh.md) · [EN](membership-club/tutorial.md) |
| 06 | `course-enrollment` | 課程報名 | saas thin | 現已提供 | [中文](course-enrollment/tutorial.zh.md) · [EN](course-enrollment/tutorial.md) |
| 07 | `invoice-quotes` | 報價 | saas thin | 現已提供 | [中文](invoice-quotes/tutorial.zh.md) · [EN](invoice-quotes/tutorial.md) |
| 08 | `event-rsvp` | 活動報名 | saas thin | 現已提供 | [中文](event-rsvp/tutorial.zh.md) · [EN](event-rsvp/tutorial.md) |
| 09 | `job-board` | 招聘板 | saas thin | 現已提供 | [中文](job-board/tutorial.zh.md) · [EN](job-board/tutorial.md) |
| 10 | `field-work-orders` | 外勤工單 | saas thin + mobile + push | 現已提供 | [中文](field-work-orders/tutorial.zh.md) · [EN](field-work-orders/tutorial.md) |

Gateway、php-bridge、trading 與 static-web3 已有 flavor 手冊（`docs/guides/flavors.zh.md`），這裏不重複。

## 套用

在 kit 工作副本執行：

```bash
pnpm --filter @ysk/examples start apply clinic-booking --dest ~/Projects/my-clinic --yes
```

預設目的地（`.runs/` 已 gitignore）：`examples/.runs/<slug>/`。傳 `--force` 可覆蓋上一次結果。`--db sqlite|mysql|postgresql` 會覆寫 `spec.json`。`--skip-install` 與 `--skip-verify` 供產生器測試使用。

套用器會：

1. 以 spec 的 flavor、preset、資料庫與 admin／mobile 旗標執行 `create-ysk-app --yes`。
2. 為每項能力執行 `ysk add`（同時出現時先 `team` 再 `billing`）。
3. 為每個模組執行 `ysk add module`。
4. 把 `overlay/` 複製到目的地，取代產生器已插入的 Prisma model，若有 `patches.json` 則做精確字串替換。
5. 安裝、產生 client、sqlite 用 `db push`（MySQL／Postgres 用 migrate）、seed，然後跑 `layers`、`typecheck`、`test`、`gen:openapi` 與 `ysk check agent`。

命令參考：[docs/cli/examples.zh.md](../docs/cli/examples.zh.md)。

## 截圖

```bash
pnpm --filter @ysk/examples start capture clinic-booking
```

在 API **13001** 與 web **15173** 啟動已套用的目的地，逐步操作教程介面，並把 PNG 寫入 `examples/<slug>/screenshots/`。sqlite 目的地會重建 `apps/api/dev.db` 並重新 seed，空白列表截圖才保持空白。擷取是文件工具；CI 不比對像素。

每個現已提供的教程都附這些截圖，以及 `expected/` 內的 HTTP envelope。

## 佈局

```text
examples/<slug>/
  spec.json
  capture.json      # Playwright 逐步操作
  patches.json      # overlay 之後可選的精確字串替換
  tutorial.md
  tutorial.zh.md
  overlay/          # 相對目的地的檔案
  expected/         # envelope JSON 與可見字串
  screenshots/      # 1280×800 PNG
```

`examples/` 不是 pnpm workspace 成員。套用後的完整樹不提交。
