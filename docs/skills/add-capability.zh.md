# Skill：加能力

Language: [English](add-capability.md) · 中文

合併一項已編目的平台功能。跟隨 [docs/recipes/add-capability.zh.md](../recipes/add-capability.zh.md)。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。

## 步驟

1. 確認名稱在目錄內（`auth`、`rbac`、`audit-log`、`storage`、`i18n`、`jobs`、`mail`、`notifications`、`llm`、`websocket`、`push`、`mobile`、`team`、`apikey`、`crypto`、`billing`）。別名 `org` → `team`。
2. 若名稱是 `billing`，先執行 `pnpm ysk add team`。
3. `pnpm ysk add <name>`。
4. Prisma 有變就執行 `pnpm db:migrate`。
5. 從 `.env.example` 填環境變數（不要提交密鑰）。
6. [驗證改動](verify-change.zh.md)。

不要在目錄以外發明新的能力資料夾。不要用這條路加入行業 domain。
