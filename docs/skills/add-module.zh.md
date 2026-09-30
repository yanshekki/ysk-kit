# Skill：加模組

Language: [English](add-module.md) · 中文

加入業務 HTTP 資源。跟隨 [docs/recipes/add-module.zh.md](../recipes/add-module.zh.md)。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。

## 步驟

1. 選一個 kebab-case 名稱。不要人手建立資料夾。
2. `pnpm ysk add module <name> --prisma --web`（若沒有 Vite 應用則用 `--no-web`）。
3. 擴充 DTO、command 與 Prisma 欄位。
4. 規則放在 `application/<name>-service.ts`。
5. Prisma 留在 `infra/`。客戶端只用 `@ysk-kit/sdk` / `@ysk-kit/web-sdk`。
6. `pnpm db:migrate && pnpm gen:openapi`。
7. [驗證改動](verify-change.zh.md)。
