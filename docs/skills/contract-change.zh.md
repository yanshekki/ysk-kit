---
name: contract-change
description: >
  先改 YSK Kit 合約：破壞性變更表、gen:openapi diff（可選 oasdiff）、棄用、新錯誤碼、鎖定同步 changeset bump。
  編輯 packages/contracts、ts-rest 路徑、DTO、錯誤碼、OpenAPI，或客戶端可見欄位時使用。
  中文：合約、OpenAPI、破壞性變更、錯誤碼、changeset。
  不要用於沒有 DTO／路徑改動的 application 規則，或 Prisma SQL（用 db-migration）。
---

# Skill：合約變更

Language: [English](contract-change.md) · 中文

`@ysk-kit/contracts` 是 enum、DTO、錯誤碼與 ts-rest 路徑的唯一來源。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。相關：[envelope-api](envelope-api.zh.md)、[add-module](add-module.zh.md)、[db-migration](db-migration.zh.md)。

## 觸發

- 編輯 `packages/contracts/**`。
- 新增或重新命名 `/v1/…` 路徑、DTO 欄位、錯誤碼或 enum 值。
- `pnpm gen:openapi` 會改到 `docs/openapi.yaml`。

不要用於維持同一 DTO 的 application 規則，或 Prisma SQL（[db-migration](db-migration.zh.md)）。

## 輸入

| 輸入 | 必要 | 備註 |
|---|---|---|
| 變更類別 | 是 | 加性／棄用／破壞性（見下表） |
| 消費者 | 是 | SDK、web-sdk、OpenAPI、PHP bridge、examples |
| Bump | 是 | 鎖定同步：**全部 26** 個公開套件同一種 `patch`／`minor`／`major` |

## 破壞性變更決策

| 改動 | 對已發佈 SDK 破壞性？ | Bump（鎖定同步） | 棄用 |
|---|---|---|---|
| 新的可選 DTO 欄位、新路徑、新錯誤碼 | 否 | `patch` | 不適用 |
| 既有 command 加必填欄 | 是 | `minor` | 優先可選 + 預設，維持一個發佈週期 |
| 刪除或重新命名欄位／路徑／enum 值 | 是 | `minor`（kit 未到 2.0；仍鎖定同步） | 舊名再留一個發佈週期；寫進 CHANGELOG |
| 收緊 Zod（較短 max、較少 enum 成員） | 是 | `minor` | 若已發佈的客戶端仍在用，雙解析舊 payload |
| 放寬 Zod（較長 max、多一個 enum 成員） | 否 | `patch` | 不適用 |
| 新的 envelope 例外 | **先問** | 批准前不適用 | 寫在四個例外旁邊 |

破壞性合約變更之前先問使用者（AGENTS.md）。不要默默刪欄。

## 步驟

1. 用表分類改動。若屬破壞性，停下來問，除非使用者已經批准。
2. **先**改 `@ysk-kit/contracts`：DTO、`as const` + Zod（不要 TypeScript `enum`）、`OkSchema`／`ErrSchema`、ts-rest 路徑。新錯誤碼放進 `packages/contracts/src/errors/codes.ts` **以及** `messages.ts` 的 `ERROR_MESSAGE`（`zh-HK` + `en`）。`AppError` HTTP 狀態在 `packages/domain-kernel/src/index.ts` 的 `HTTP_STATUS`。
3. 更新 SDK resource／web-sdk hooks／capability 模板，使模板化時與活樹 byte-match。
4. `pnpm gen:openapi`。然後：

   ```bash
   git diff --exit-code docs/openapi.yaml
   ```

   改了路徑之後 OpenAPI 靜默不變，代表改動失敗。YAML 與 DTO 一併 commit。
5. 可選 OpenAPI 語意 diff（不是工作區依賴）：

   ```bash
   npx --yes oasdiff diff origin/main:docs/openapi.yaml docs/openapi.yaml
   ```

   沒有 `npx` 就略過。把 `oasdiff` 輸出當審查輔助，不是 CI 閘。
6. Changelog：在目前版本下一條 bullet，類別對得上（通常是 Fixes 或 New features）。README 三個版本視窗。Patch／minor／major changeset 列出**全部 26** 個公開 `@ysk-kit` 套件（鎖定同步測試）。
7. [驗證改動](verify-change.zh.md)。新路徑只經 `@ysk-kit/sdk` 呼叫。

## 棄用

舊欄或舊路徑再留一個已發佈版本。在 CHANGELOG 標明。不要另產生第二棵 DTO 樹。若舊客戶端仍送舊形狀，在 `application/` 雙讀。

## 驗證

```bash
pnpm --filter @ysk-kit/contracts test
pnpm gen:openapi
git diff --exit-code docs/openapi.yaml
pnpm layers && pnpm typecheck && pnpm test && pnpm ysk-kit check agent
```

預期：合約測試綠；OpenAPI 已 commit；`ysk-kit check agent: ok`。

- [ ] DTO 在 handler 與客戶端之前落地
- [ ] 沒有 TypeScript `enum`
- [ ] 加了代碼時，`ERROR_MESSAGE` 有 `zh-HK` 與 `en`
- [ ] 鎖定同步 changeset 列出全部 26 個名稱、同一種 bump

## 輸出格式

```md
## Contract change — <path or DTO>
Class: additive | deprecating | breaking
Bump: patch | minor | major (all 26)
OpenAPI: gen:openapi + git diff (oasdiff: ran | skipped)
Deprecation: n/a | keep <old> until vX.Y.Z
Error codes: <none | CODE → HTTP>
Consumers: SDK / web-sdk / templates / examples
```

## 完成條件

合約先行、OpenAPI 已更新、bump 與 changelog 已記錄、五條驗證命令全綠。破壞性變更有書面使用者批准。

## 反模式

| 症狀 | 改為 |
|---|---|
| 只在客戶端為 API 欄位寫 TypeScript 型別 | 在合約加 Zod DTO |
| `enum Foo {}` | `as const` + `z.enum` |
| Handler 裡新錯誤字串 | 重用代碼，或加 `ERROR_MESSAGE` + `HTTP_STATUS` |
| 人手改 OpenAPI | `pnpm gen:openapi` |
| 只為一個套件寫 changeset | 全部 26 個用同一種 bump |
| 在客戶端仍使用的同一發佈刪欄 | 先棄用一個版本 |

## 升級／詢問

刪已發佈欄位或路徑、加 envelope 例外，或選 `major` 之前，先問。

## 來源

- OpenAPI Initiative — <https://spec.openapis.org/oas/latest.html>
- oasdiff（可選 CLI） — <https://github.com/tufin/oasdiff>
- Changesets versioning — <https://github.com/changesets/changesets>
- ts-rest 合約作為真相來源 — [架構](../architecture.zh.md)
