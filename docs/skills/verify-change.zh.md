---
name: verify-change
description: >
  功能之後跑 YSK Kit 驗證。單一套件：pnpm --filter <pkg> test。
  跨套件：layers、typecheck、test、OpenAPI、check agent、check errors、check docs-budget。
  完成改動、加模組／能力之後，或 /verify-change 時使用。
  中文：驗證、單套件 test、跨套件鏈。
  不要用於略過命令卻聲稱完成，或在單元測試啟動 Redis／Stripe。
---

# Skill：驗證改動

Language: [English](verify-change.md) · 中文

功能之後執行。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。測試：[測試指南](../guides/testing.zh.md)。

## 觸發

- 功能或修復即將標為完成。
- `ysk-kit add module`／`add <capability>` 之後。
- 修復 layers 或 check-agent 失敗之後。

## 步驟

**單一套件：** `pnpm --filter <pkg> test`

**只有跨套件**才跑：

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent && pnpm ysk-kit check errors && pnpm ysk-kit check docs-budget
```

對話只保留**一行結果**。若本回合已經綠、而且工作樹沒再改，重用該結果。

然後：`git diff --exit-code docs/openapi.yaml` — HTTP／DTO 有變時 YAML 必須與 `HEAD` 不同直到提交；沒變則 exit 0。

不要為了單元測試通過而啟動 Redis、Stripe、Twilio、FCM、Jaeger 或 Grafana。

### 失敗 → 修復

| 失敗 | 下一步 |
|---|---|
| `clients-no-server-infra`／`domain-no-infra` | [fix-layers](fix-layers.zh.md) |
| `no-ts-enum`／客戶端 Prisma／raw `fetch` | 類型放到 contracts；走 `@ysk-kit/sdk` |
| `docs-budget` | 縮短 Unreleased／去掉禁止的 CHANGELOG 句子／縮小精簡計劃／不要 git-add `docs/qa/**/*.png` |
| `skill-drift`／`agents-md-budget` | 從 `tooling/ysk-cli/templates/agent` 還原四個路由器；縮短 nested `AGENTS.md` |
| 紅燈 Vitest | [debug-issue](debug-issue.zh.md) |

### 條件額外項

| 何時 | 命令 |
|---|---|
| 加了 Markdown 連結／文件 | `pnpm check:links` |
| 改了可發佈套件 | 只為實際改動的套件寫 changeset |
| 登入／shell 路徑改了且 3001／5173 空閒 | `pnpm e2e` |
| 擷取了 JSONL 日誌 | `pnpm ysk-kit check logs --file <jsonl>` |
| CVE／runtime／lockfile | `pnpm ysk-kit check supply --repo-only` |
| UI | [ui-review](ui-review.zh.md) |

## 輸出格式

一行，例如：`verify: ok (cli test + check agent + check docs-budget)`。

## 完成條件

適用的命令在**本回合**印出成功（或本回合已綠且工作樹沒再改）。行為改動有新增或更新的 Vitest，或明確只改文件。[AGENTS.zh.md](../../AGENTS.zh.md) 硬規則成立。若有日期計劃，計劃已滿足。

## 反模式

| 症狀 | 改為 |
|---|---|
| 沒跑就說「應該沒問題」 | 跑適用的命令 |
| 單套件 CLI 改動卻重跑整個 monorepo 鏈 | `pnpm --filter @ysk-kit/cli test` |
| 為了單元測試通過而啟動 Redis | 記憶體 port |
