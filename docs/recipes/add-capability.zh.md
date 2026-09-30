# 加能力

Language: [English](add-capability.md) · 中文

還原或合併一項已編目的平台功能。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。目錄：[能力](../guides/capabilities.zh.md)、[ysk-kit CLI](../cli/ysk.zh.md)。

## 何時使用

- 產品以 `--preset thin` 開出，現在需要 llm、組織、billing 或 push。
- Flavor 略過了某個介面（沒有 web），但 API 端仍要 jobs、mail 或 API 金鑰。
- 要把 `.env.example` 與 Prisma fragments 對齊目錄。

不要用這條命令加新的業務資源。那是 [加模組](add-module.zh.md)。

## 命令

```bash
pnpm ysk-kit add team
pnpm ysk-kit add billing
pnpm ysk-kit add llm
pnpm ysk-kit add push
pnpm db:migrate
pnpm gen:openapi
pnpm layers && pnpm typecheck && pnpm test
```

`billing` 須先有 `team`（`model Organization`）。否則 CLI 會丟出錯誤。

## 會做甚麼

1. 合併目錄列出的 Prisma fragment 以及 User／Organization 關聯欄位。
2. 把缺失的鍵加進 `.env.example`。
3. 加入缺失的 `apps/api` workspace 依賴。
4. 對 `llm`、`team`、`billing`、`push`：若 `app.ts` 或 `composition.ts` 尚未包含略過標記，複製 `tooling/ysk-cli/templates/capabilities/<name>/`。`team` 在產品有 `apps/mobile` 時同時複製 Expo 組織畫面。
5. 若 recipe 定義了修補，以字串修補 Express、Fastify、composition、main、SDK、web-sdk、web router、worker 與流動應用組織畫面。

再跑一次是空操作。本可運行倉已經接上那些 service，add 會列印 “already part of the saas flavor” 以及提示。

命令不執行 `prisma migrate`。請自行執行，若路由有變再產生 OpenAPI。
