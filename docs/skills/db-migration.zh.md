---
name: db-migration
description: >
  在 YSK Kit 套用 Prisma 7.10 遷移：審查產生的 SQL、破壞性改動用 expand/contract、回填，未經明確同意不要 migrate reset。
  schema.prisma 有改、add-module --prisma 或 add <capability> 合併 Prisma 之後，或使用者說遷移／改欄名／回填／reset 時使用。
  中文：資料庫遷移、改欄位、改名、回填、migrate reset。
  不要用於 Prisma 8 指令，或沒有 schema 改動的 application 規則。
---

# Skill：資料庫遷移

Language: [English](db-migration.md) · 中文

改 Prisma schema 而不毀掉資料。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。相關：[加模組](add-module.zh.md)、[加能力](add-capability.zh.md)。本倉釘 **Prisma 7.10.0**（`apps/api/package.json`）。官方 Prisma 文件可能已寫 Prisma 8 — **不要抄那些指令**。

## 觸發

- 改 `apps/api/prisma/schema.prisma` 或 `modules/*/prisma/*.prisma`。
- `pnpm ysk-kit add module <name> --prisma` 或 `pnpm ysk-kit add <capability>` 合併 fragment 之後。
- 使用者說遷移、改欄名、回填或 `migrate reset`。
- `prisma migrate dev` 要求 reset。

不要用本 skill 處理只改 application 規則的工作，也不要跑 Prisma 8 的 `prisma contract emit`、`prisma migration plan` 或 `prisma db migrate`。

## 輸入

| 輸入 | 必要 | 備註 |
|---|---|---|
| 加欄 vs 破壞性 | 是 | 見分類表 |
| 資料庫 | 否 | Kit 預設 MySQL；產品可以是 PostgreSQL 或 SQLite |
| 使用者同意 | 破壞性操作時 | 必須在**這一輪**明確同意 |

## Prisma 7.10 指令（只用這些）

| 目的 | 指令 |
|---|---|
| 只產生 SQL，不套用 | `pnpm --filter @ysk-kit/api exec prisma migrate dev --create-only --name <snake_name>` |
| 本機套用（dev） | `pnpm db:migrate`（= `prisma migrate dev`） |
| CI／生產套用 | `pnpm --filter @ysk-kit/api prisma:migrate:deploy`（`prisma migrate deploy`） |
| 狀態 | `pnpm --filter @ysk-kit/api exec prisma migrate status` |
| 驗證 schema | `pnpm --filter @ysk-kit/api exec prisma validate` |
| Diff（可選） | `pnpm --filter @ysk-kit/api exec prisma migrate diff --from-migrations apps/api/prisma/migrations --to-schema-datamodel apps/api/prisma/schema.prisma --shadow-database-url <url>` |
| 產生 client | `pnpm db:generate` |

**不要**用：以 `prisma db push` 代替 migration；`migrate reset`；`db push --force-reset`／`--accept-data-loss`；Prisma 8 的 `contract.prisma`／`contract emit`／`migration plan`／`db migrate`。

## 分類

| 改動 | 做法 |
|---|---|
| 新表、新**可空**欄、新索引 | 一次加性遷移 |
| 改名、刪欄、改型、對已有資料的欄加 `NOT NULL`、收緊 unique | Expand/contract：多次遷移與部署 |

Expand/contract（Prisma Data Guide）：

1. 加新欄／新表（可空／可雙寫）。
2. 在 `infra/` 對舊新欄雙寫（不要放在 `application/` HTTP）。
3. 回填（專用遷移裡的 SQL；量大就分批）。
4. 核對筆數／checksum。
5. 讀改走新欄。
6. 停止寫舊欄。
7. 之後的發佈才刪舊欄。

不要在同一趟生產部署裡改名又刪舊欄。

## 步驟

1. 若規劃協議適用，在計劃的資料模型段寫遷移名、部署次數與回滾。
2. 改 schema（或讓 `add module --prisma` 合併 fragment）。Prisma enum 與 `@ysk-kit/contracts` 保持一致（`pnpm --filter @ysk-kit/db-prisma test` 會跑 `assertPrismaEnumsMatchContracts`）。
3. `pnpm --filter @ysk-kit/api exec prisma migrate dev --create-only --name <snake_name>`。
4. **讀** `apps/api/prisma/migrations/<timestamp>_<name>/migration.sql`。警號字：`DROP`、`RENAME`、沒有預設值的 `NOT NULL`、`ALTER ... TYPE`。套用前先手寫回填 SQL。
5. 本機用 `pnpm db:migrate` 套用，然後 `pnpm db:generate`。
6. **同時**更新 `infra/prisma-*-repository.ts` 與 `infra/memory-*-repository.ts`。測試用 memory port、生產用 Prisma — 行為必須一致。
7. 只在 **dev** 資料庫跑 `pnpm db:seed`（upsert `admin@ysk.hk`）。不要把 seed 當生產回填。
8. [驗證改動](verify-change.zh.md)。

## 破壞性操作

`migrate reset`、`db push --accept-data-loss`，以及刪掉仍有資料的表，**都要人類在這次對話裡同意**，而且你要先列出會刪什麼。不要用先前對話推斷同意。不要自己設 `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`（Prisma 的 agent-safety checkpoint）。

生產與 CI **只用** `prisma migrate deploy`。永遠不要 reset 共用或生產資料庫。

## 不可改的歷史

不要改已經 commit 或已部署的 migration。加一筆新的。不要為了「修好」某個 flavor 而改 `apps/api/prisma/migrations/migration_lock.toml` 的 `provider` — 新產品由 `create-ysk-app --db` 改寫 provider。

## 回滾

Prisma 7 migrate 沒有自動 down。回滾是 **前滾** 遷移（還原欄、把資料抄回去）或從備份還原。寫進計劃。

## 測試與 CI

單元測試不要啟動 MySQL。行為由 memory repository 覆蓋。CI `e2e` 對 job 的 MySQL 跑 `prisma:migrate:deploy`。schema 有改就要把 `apps/api/prisma/migrations/` 底下的新目錄一併 commit。

## 驗證

```bash
pnpm --filter @ysk-kit/api exec prisma validate
pnpm --filter @ysk-kit/api exec prisma migrate status
pnpm --filter @ysk-kit/db-prisma test
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

預期：`The schema at … is valid.`／（資料庫已遷移時）`Database schema is up to date!`／`ysk-kit check agent: ok`。

```bash
git status apps/api/prisma/migrations
```

- [ ] 新 migration 目錄已 commit；SQL 已審
- [ ] Memory repo 與 Prisma repo 行為一致
- [ ] 破壞性改動已拆成 expand/contract
- [ ] 沒有未經記錄同意的 reset

## 輸出格式

```md
## Migration — <name>
Type: additive | expand/contract
SQL review: <drop/rename/not-null findings or "clean">
Deploys: <1 or N>
Rollback: <forward migration / backup>
Consent: <n/a | quoted user sentence>
```

## 完成條件

SQL 已審、兩邊 repository 已更新、enum 與合約一致、破壞性操作已避開或取得明確同意、五條驗證命令全綠。

## 反模式

| 症狀 | 改為 |
|---|---|
| 因為快而用 `db push` | `migrate dev --create-only`，審完再 migrate |
| 一個 PR 改名又刪欄 | 分多次部署 expand/contract |
| 只改 Prisma repo，不改 memory repo | 測試綠、生產錯 — 兩邊都改 |
| 改舊的 `migration.sql` | 新遷移 |
| 跟 Prisma 8 文件 | 只用上面釘死的 7.10 指令 |
| 用 reset 修 drift | 先問；列出會失去什麼；等候 |

## 升級／詢問

Reset、資料損失旗標、改 `migration_lock.toml` provider，或對已有資料的資料庫做破壞性改欄之前，先問。

## 來源

- Prisma 7「Customizing migrations」／expand and contract — <https://www.prisma.io/docs/orm/prisma-migrate/workflows/customizing-migrations>
- Prisma Data Guide expand-and-contract — <https://www.prisma.io/dataguide/types/relational/expand-and-contract-pattern>
- prisma/skills `prisma-cli` AI Safety Checkpoint（`migrate reset`、`db push --accept-data-loss`） — <https://github.com/prisma/skills>
