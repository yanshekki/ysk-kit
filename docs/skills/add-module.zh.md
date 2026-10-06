---
name: add-module
description: >
  用 ysk-kit add module 加入 hexagonal HTTP 模組（合約、DTO、Express+Fastify、SDK、網頁）。
  使用者要新資源、新 API 路由、ysk-kit add module 或 /add-module 時使用。
---

# Skill：加模組

Language: [English](add-module.md) · 中文

加入業務 HTTP 資源。跟隨 [docs/recipes/add-module.zh.md](../recipes/add-module.zh.md)。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。CLI：[ysk-kit](../cli/ysk-kit.zh.md)。若協議要求計劃，先完成 [plan-feature](plan-feature.zh.md)。

## 觸發

- 新的業務資源或 `/v1/<name>` 路由。
- 使用者說 `ysk-kit add module`、「新實體」或「新 HTTP 切片」。

不要人手 mkdir `apps/api/src/modules/<name>`。

## 輸入

| 輸入 | 必要 | 備註 |
|---|---|---|
| Kebab 名稱 | 是 | `booking`、`inventory-item`。必須符合 `^[a-z][a-z0-9-]*$` |
| `--prisma` | 通常 | 合併 `title`／`body`／`authorId` model；其後再擴充 |
| `--web`／`--no-web` | 否 | 預設 `--web`。沒有 Vite 應用時用 `--no-web` |

## 步驟

1. 選 kebab-case 名稱。不要人手建立資料夾。
2. `pnpm ysk-kit add module <name> --prisma --web`（或 `--no-web`）。
3. 在 `@ysk-kit/contracts` 與 Prisma model 擴充 DTO、command 與欄位。保留 `OkSchema`／`ErrSchema`。
4. 規則放在 `application/<name>-service.ts`。
5. Prisma 留在 `infra/`。客戶端只用 `@ysk-kit/sdk`／`@ysk-kit/web-sdk`。
6. schema 或路徑有變就執行 `pnpm db:migrate && pnpm gen:openapi`。
7. [驗證改動](verify-change.zh.md)。

## 驗證

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

- [ ] 切片檔來自產生器（沒有平行目錄樹）
- [ ] 沒有 TypeScript `enum`
- [ ] 客戶端沒有 Prisma，也沒有 raw `fetch`

## 完成條件

list + create（或所要求的動詞）走 envelope，memory-repo 測試覆蓋新規則，OpenAPI 看得到路徑，上述五條命令全綠。
