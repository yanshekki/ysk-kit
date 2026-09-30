# Hexagonal 分層

Language: [English](hexagonal.md) · 中文

每個 HTTP 功能都是一個 bounded context，有三個資料夾。身分模組是參考實作：`apps/api/src/modules/identity/`。

```
apps/api/src/modules/identity/
  domain/         entity + repository / sender port
  application/    auth-service、user-service
  infra/          prisma + 記憶體 repo、HTTP router、Twilio adapter
```

只有 `apps/api/src/composition.ts` 會建構 adapter 並注入 service。`apps/api/src/app.ts`（Express）與 `app-fastify.ts` 註冊路由。測試經 `create-memory-input.ts` 用記憶體 port 組同一套 service。

## 依賴方向

```
HTTP adapter → application → domain ports
                    ▲
                    │ implements
                  infra
```

| 層 | 可以 import | 不可 import |
|---|---|---|
| domain | `@ysk-kit/domain-kernel`、`@ysk-kit/contracts` | Express、Fastify、Prisma、React、BullMQ |
| application | domain、contracts | Prisma、HTTP 框架、React |
| infra | 實作 port 所需的一切 | React、`@ysk-kit/ui` |
| web / admin / mobile / desktop | `@ysk-kit/sdk`、`@ysk-kit/web-sdk`、`@ysk-kit/ui`、`@ysk-kit/contracts` | Prisma、Express、Fastify、`@ysk-kit/auth`、jobs、mail、push、AWS SDK、`@ysk-kit/observability` |

`pnpm layers` 執行 dependency-cruiser（`.dependency-cruiser.cjs`）。常見失敗：

- Vite 頁面 import `@prisma/client` 或 `apps/api/src/generated`。
- domain 檔案 import `infra/`。
- contracts import `@ysk-kit/sdk`。

修正方法是把 import 移到正確的層，而不是放寬規則。程序：[fix-layers skill](../skills/fix-layers.zh.md)。

## 加功能

不要發明第四個資料夾。執行 `pnpm ysk-kit add module <kebab> --prisma --web`，然後：

1. 在 `@ysk-kit/contracts` 擴充 DTO 與 command。
2. 不變量放在 `application/<name>-service.ts`。
3. 持久化只實作在 `infra/prisma-*-repository.ts`。
4. 讓記憶體 repository 保持同步，Vitest 才不必啟動 MySQL。

逐步說明：[加模組](../recipes/add-module.zh.md)。
