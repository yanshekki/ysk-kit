# 加模組

Language: [English](add-module.md) · 中文

給人與 agent。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。CLI 旗標：[ysk-kit](../cli/ysk-kit.zh.md)。

## 命令

```bash
pnpm ysk-kit add module appointment --prisma --web
pnpm db:migrate
pnpm gen:openapi
pnpm layers && pnpm typecheck && pnpm test
```

使用 kebab-case 名稱（`appointment`、`note`、`inventory-item`）。URL 是 `/v1/<name>`。Prisma model 是該名稱的 PascalCase。

`--web` 預設開啟。`--no-web` 略過 Vite 頁面。`--prisma` 合併 `title` / `body` / `authorId` model。

## 產生器寫出甚麼

| 路徑 | 職責 |
|---|---|
| `packages/contracts/src/dto/<name>.ts` | DTO + create command |
| `packages/contracts/src/api/<name>.ts` | ts-rest list + create，`OkSchema` / `ErrSchema` |
| `apps/api/src/modules/<name>/domain/` | Repository port |
| `apps/api/src/modules/<name>/application/` | Service — **業務規則寫在這裏** |
| `apps/api/src/modules/<name>/infra/` | 記憶體 + Prisma repo、`HttpHandler` map、Express 註冊、service 測試 |
| `modules/<name>/prisma/<name>.prisma` | 合併進 `apps/api/prisma/schema.prisma` 的 fragment |
| `packages/sdk/src/resources/<name>.ts` | `client.<name>.list/create` |
| `packages/web-sdk/src/<name>-hooks.ts` | `useList` / `useCreate` |
| `apps/web/src/features/<name>/<name>-page.tsx` | 使用 create command schema 的 list + create 表單 |

檔案存在時，亦會修補 `appContract`、`apps/api/src/app.ts`、`app-fastify.ts`、`composition.ts`、`main.ts` 與 `create-memory-input.ts`。已有檔案保留（冪等）。Express 路由掛在 `errorHandler` **之前**，客戶端才會收到 `{ ok: false }` envelope。Web router 會在 `AppShell`（以及舊的 `ml-auto` shell）加入導航 `Link`。

## 產生之後

1. 若需要更多欄位，改 Prisma model；保持 DTO 與 command 同步。
2. 規則只放在 `application/<name>-service.ts`。
3. Prisma 留在 `infra/`。
4. 不要加 TypeScript `enum`。額外字面值放進 `@ysk-kit/contracts`。
5. Web 頁面不要 `fetch`；使用 `@ysk-kit/web-sdk` hooks。

`modules/notes` 下 notes 形狀的樹說明模板。本倉的 API 不掛載 notes 路由，平台程式才不會混入示範業務資料。

## 給 agent 的提示

```text
Follow AGENTS.md.
Add a <name> module with fields <...>.
Use: pnpm ysk-kit add module <name> --prisma --web
Then fill business rules in application/ and the Prisma model.
Do not invent folders. Do not add TypeScript enums.
Run pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi.
```
