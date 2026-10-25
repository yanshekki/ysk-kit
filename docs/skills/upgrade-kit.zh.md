---
name: upgrade-kit
description: >
  升級 YSK Kit 依賴、審查 Dependabot，並在 GitHub Actions 配額用盡時跑本機
  smoke。Use when doing weekly kit maintenance, stable bumps, major-hold lists,
  ki-mac-mini gates, or /upgrade-kit.
  中文：kit 依賴、Dependabot、穩定版、本機 smoke、ki-mac-mini。
  Do not use to refresh a generated product (docs/guides/upgrade.md).
---

# Skill：升級本 kit

Language: [English](upgrade-kit.md) · 中文

升級的是**本倉**（活著的 kit），不是 dest 產品。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。供應盤點：[supply-scan](supply-scan.zh.md)。產品樹更新：[更新已產生產品的護欄](../guides/upgrade.zh.md)（`pnpm ysk-kit upgrade`）——那是另一份工作。

## 觸發

- 每週 kit 維護、Dependabot PR，或「升依賴」。
- 具名工具鏈（pnpm、Electron、Expo、Prisma、Node）有較新的**穩定**發佈。
- GitHub Actions 配額用盡；閘必須在 ki-mac-mini（或其他 private worker）跑。

不要用來把護欄複製進產品（`ysk-kit upgrade`）、加模組，或實作功能。

## 輸入

| 輸入 | 必要 | 備註 |
|---|---|---|
| Checkout | 是 | 乾淨樹，已對齊最新 `origin/main` |
| 主機 | Actions 跑不了時 | ki-mac-mini 上 `check`／`thin-smoke`／`e2e`／`supply` 的本機對等命令 |
| 批准 | 大版本 | Electron 45、TypeScript 7、Prisma 8 及其他 major ——先問 |

## 步驟

1. **同步。** `git fetch origin && git checkout main && git pull --ff-only origin main`。不要混入無關的髒工作。

2. **只升穩定版。** 升到最新 **stable**。永遠不要 beta／RC／alpha／canary／nightly。若有誘人的預發佈，留在穩定版，並把該預發佈列入暫緩。

3. **審計。** 比較 `package.json`、`pnpm-lock.yaml`、`pnpm-workspace.yaml` override、Actions SHA、compose／Docker 標籤、Expo、Electron、`engines.node`、Vite。然後 [supply-scan](supply-scan.zh.md)：

   ```bash
   pnpm ysk-kit check supply --repo-only --online
   ```

   `--repo-only --online` 就是 CI 跑的內容。不要加 Trivy。不要發明靜態 npm registry token（npm Trusted Publishing／OIDC 即可）。

4. **分類。** 符合 engines 與 peers 的安全 patch／minor → 升。Major 或破壞 peer → 暫緩等使用者批准。暫緩例子（2026-10-25）：Electron **45.0.0**（2026-10-20 起已是穩定版；未批准前留在 44.x）、TypeScript **7**、Prisma **8**（`latest` 仍是 RC）。既有 `@ts-rest/core` `3.53.0-rc.1` 維持；不要引入**新的**預發佈。

5. **一條分支。** 安全 bump 與緊急漏洞修補放同一條。公開 `@ysk-kit/*` 有使用者可見改動時，用 lockstep patch changeset。`main` 上只有已合併的 Dependabot、沒有產品／文件／AGENTS 工作，**不必**單獨發佈。

6. **Actions 跑不了時的本機閘**（ki-mac-mini）：

   ```bash
   pnpm lint && pnpm check:links
   pnpm ysk-kit check supply --repo-only --online
   pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi
   pnpm ysk-kit check agent && pnpm ysk-kit check errors
   ```

   然後 thin-smoke（`create-ysk-app --preset thin --flavor saas --no-admin --no-mobile --db sqlite`，再到 dest 跑 `layers`／`check agent`／`check errors`／`typecheck`／`test`／`gen:openapi`）。MySQL 8.4 起來時跑 `pnpm e2e`。把確切命令與結果寫進 PR。若規則集仍要求 Actions 無法提供的 GitHub check 狀態，讓 PR 開著。

7. **驗證。** 改了程式之後跟 [verify-change](verify-change.zh.md)。若 Actions 被觸發且配額已盡，取消那些 run。

## 驗證

```bash
pnpm ysk-kit check supply --repo-only --online
pnpm layers && pnpm typecheck && pnpm test && pnpm ysk-kit check agent
```

- [ ] 沒有引入 beta／RC／alpha／canary／nightly
- [ ] 未批准的 major 已暫緩
- [ ] 公開套件有改動時有 changeset
- [ ] PR 寫了本機閘命令與結果
- [ ] **沒有**在這裡做 dest 產品更新

## 輸出格式

```md
## Upgrade kit — <date>
Stable bumps: <from → to>
Held (pre-release / major): <list>
Vulns: <fixed | ignored with reason | none>
Local gates: <commands + ok/fail>
PR: <url or none>
Release: vX.Y.Z changeset | no release needed
```

## 完成條件

安全穩定版已在分支上，或已寫明略過理由。Major 沒有偷渡。Actions 跑不了時，本機已跑 CI 對等命令。沒有把產品的 `ysk-kit upgrade` 當成這份工作。

## 反模式

| 症狀 | 改做 |
|---|---|
| 在本 kit 跑 `pnpm ysk-kit upgrade` 來「升依賴」 | 用本 skill；dest 更新是 [upgrade](../guides/upgrade.zh.md) |
| Electron 45／TS 7／Prisma 8「因為是 latest」 | 暫緩；先問 |
| 貼上靜態 npm registry token | 只用 Trusted Publishing／OIDC |
| 因 Actions 配額紅燈而跳過閘 | 跑上面的本機清單；把結果寫下來 |
| 一次加一堆低價值 skill | 每週最多 1–2 個高槓桿雙語 skill |

## 升級／詢問

Major（Electron 45、TypeScript 7、Prisma 8、新的預設 HTTP adapter）、新的 envelope 例外，或從筆電發佈之前，先問。
