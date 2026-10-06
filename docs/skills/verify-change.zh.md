---
name: verify-change
description: >
  每個功能之後跑 YSK Kit 驗證鏈（layers、typecheck、test、OpenAPI、check agent）。
  完成改動、加模組／能力之後，或 /verify-change 時使用。
  中文：驗證、layers、typecheck、OpenAPI、check agent。
  不要用於略過命令卻聲稱完成，或在單元測試啟動 Redis／Stripe。
---

# Skill：驗證改動

Language: [English](verify-change.md) · 中文

每個功能之後都執行。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。測試：[測試指南](../guides/testing.zh.md)。

## 觸發

- 功能或修復即將標為完成。
- `ysk-kit add module`／`add <capability>` 之後。
- 修復 layers 或 check-agent 失敗之後。

## 輸入

| 輸入 | 必要 | 備註 |
|---|---|---|
| 產品根目錄 | 否 | 若掃描的不是本 checkout，設 `YSK_ROOT` |
| 登入／shell 改動 | 否 | 3001／5173 空閒時可加跑 `pnpm e2e` |

## 步驟

未經本回合跑完此鏈，永遠不要聲稱改動已完成。

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

然後：

```bash
git diff --exit-code docs/openapi.yaml
```

若 HTTP 路徑或 DTO 有變，YAML **必須**與 `HEAD` 不同，直到你提交它。若沒有變，此命令必須 exit 0。

### 每條命令的預期輸出

| 命令 | 成功看起來像 | 典型失敗 |
|---|---|---|
| `pnpm layers` | `no dependency violations found` | `error` + 規則名稱（`clients-no-server-infra`，…） |
| `pnpm typecheck` | turbo tasks successful | 套件 log 裡的 `TS` 錯誤 |
| `pnpm test` | Vitest 檔通過 | 紅色 `it()` — 保留它，跟隨 [debug-issue](debug-issue.zh.md) |
| `pnpm gen:openapi` | `wrote …/docs/openapi.yaml` | contract import／flatten 錯誤 |
| `pnpm ysk-kit check agent` | `ysk-kit check agent: ok` | `rule  file:line`（enum、Prisma、fetch、skill-drift、budget） |

`pnpm layers` 捉到客戶端 → Prisma import 代表改動失敗，不是警告。`pnpm ysk-kit check agent` 捉到 TypeScript `enum`、客戶端 Prisma import、web/admin/mobile/desktop 的 raw `fetch`、指針不再提及 `AGENTS.md`、skill 副本漂移，或根目錄加巢狀 `AGENTS.md` 超過 24 KiB，同樣代表改動失敗。

### 失敗 → 修復

| 失敗 | 下一條 skill／動作 |
|---|---|
| `clients-no-server-infra`／`domain-no-infra` | [修復分層](fix-layers.zh.md) |
| `no-ts-enum`／客戶端 Prisma／raw `fetch` | 把型別移到 contracts；呼叫 `@ysk-kit/sdk` |
| `skill-drift`／`agents-md-budget` | 從 `tooling/ysk-cli/templates/agent` 還原 wrapper；縮短巢狀 `AGENTS.md` |
| DTO 改了之後 OpenAPI 仍 dirty | 提交 `docs/openapi.yaml` |
| 沒改 contracts 但 OpenAPI dirty | 確認沒有路徑變更後 `git checkout -- docs/openapi.yaml` |
| 紅色 Vitest | [debug-issue](debug-issue.zh.md) — 先寫紅色測試 |
| Prisma SQL／reset 提示 | [db-migration](db-migration.zh.md) |

### 條件性額外（適用時才跑）

| 何時 | 命令 |
|---|---|
| 永遠有用 | `pnpm lint` |
| 加了 Markdown 連結／文件 | `pnpm check:links` |
| 加了給人讀的 Markdown | 有對應的 `.zh.md` 配對（`docs-pair` 測試） |
| 可發佈套件有變 | changeset 列出**全部 26** 個公開套件，同一 bump |
| 登入／shell 路徑有變且 3001／5173 空閒 | `pnpm e2e` |
| 加了 HTTP 路徑 | 打開 `GET /docs` |
| Grok Build | `grok inspect` |
| UI | [ui-review](ui-review.zh.md) |
| 新測試 | 先 [test-plan](test-plan.zh.md)，再 [write-tests](write-tests.zh.md) |

不要為了讓單元測試通過而啟動 Redis、Stripe、Twilio、FCM、Jaeger 或 Grafana。

範圍內再跟：[security-review](security-review.zh.md)、[db-migration](db-migration.zh.md)、[webhook-handling](webhook-handling.zh.md)、[desktop-electron](desktop-electron.zh.md)、[contract-change](contract-change.zh.md)、[review-change](review-change.zh.md)。

## 驗證

- [ ] 本回合五條命令都印出成功
- [ ] `git diff --exit-code docs/openapi.yaml` 與「HTTP 有沒有變」的答案一致
- [ ] 適用的條件性額外都是綠色
- [ ] 日誌沒有密鑰、OTP、Stripe `sk_` 或 webhook 密鑰

## 輸出格式

```md
## Verify — <scope>
layers: ok | FAIL (<rule>)
typecheck: ok | FAIL
test: ok | FAIL (<file>)
gen:openapi: wrote yaml
openapi diff: clean | committed | unexpected
check agent: ok | FAIL (<rule>)
extras: lint | check:links | changeset | zh pair | e2e | skipped (<why>)
Done: no | yes (DoD)
```

## 完成條件

只有本回合五條命令全綠、OpenAPI 與合約改動一致，而且 `AGENTS.zh.md` 的[完成定義](../../AGENTS.zh.md#完成定義)成立，才可把改動標為完成。

## 反模式

| 症狀 | 改為 |
|---|---|
| 沒跑就說「應該沒問題」 | 跑五條命令 |
| 因為只改文件就略過 `check agent` | 仍然要跑（budget + drift） |
| 留下 dirty 的 OpenAPI | 提交或還原 |
| 為了單元測試通過而啟動 Redis | 記憶體 port |

## 升級／詢問

因為外部服務「必須」而略過驗證之前，或把紅色 job 當 flake 卻沒有本機紅色測試之前，先問。
