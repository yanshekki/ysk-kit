---
name: supply-scan
description: >
  用 ysk-kit check supply 掃描 YSK Kit 第三方程式與 pin（Node、PHP、Linux
  kernel、lockfile IOC、GitHub Actions SHA、compose 標籤）。
  Use when CVE, php2shell, Node security release, supply chain, third-party
  versions, lockfile audit, or /supply-scan.
  中文：供應鏈、第三方程式、CVE、runtime 下限、check supply。
  Do not use for diff-scoped authz (security-review) or to reproduce exploits.
---

# Skill：掃描第三方程式版本

Language: [English](supply-scan.md) · 中文

盤點 runtime 與 pin，再對照內建目錄。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。CLI：[ysk-kit check supply](../cli/ysk-kit.zh.md)。以 diff 為範圍的授權仍用 [security-review](security-review.zh.md)。操作手冊：[掃描供應鏈](../recipes/scan-supply.zh.md)。

## 觸發

- 使用者要求掃描依賴、CVE、供應鏈或第三方程式版本。
- 具名 runtime CVE（php2shell、Node.js 安全發佈、kernel LPE）。
- 發佈之前，或加入**執行期**依賴時。
- `ysk-kit check supply` 報了 finding。

不要用於以 diff 為範圍的授權／租戶／密鑰（[security-review](security-review.zh.md)），也不要用來重現 exploit。

## 輸入

| 輸入 | 必要 | 備註 |
|---|---|---|
| 產品根目錄 | 否 | 若掃描對象不是本 checkout，設 `YSK_ROOT` |
| 具名 CVE／advisory | 使用者有指名時 | 把它的發佈日期與 `catalog.updated` 比較 |
| 網絡 | `--online` 時 | `pnpm audit --json`；不要在 Vitest 用 |

## 步驟

1. 兩條都跑：

   ```bash
   pnpm ysk-kit check supply --json
   pnpm ysk-kit check supply --repo-only
   ```

   主機掃描看 Node／PHP／kernel。`--repo-only` 是 CI 釘住的內容。不要 `npx` Trivy、OSV-Scanner 或不明掃描器。不要為了「掃一下」加第三方 GitHub Action。

2. 若具名 CVE 的發佈日期新於 `tooling/ysk-cli/src/supply/catalog.json` 的 `updated`，或目錄沒有該 id：讀**上游**公告（php.net、Node.js blog、發行版、CISA）。改目錄下限／IOC 種子，更新 `updated`，再跑。產品靠升級 `@ysk-kit/cli` 取得目錄。

3. 分類 finding：

   | 規則 | 意思 | 典型修法 |
   |---|---|---|
   | `runtime-below-floor` | 主機或 CLI 的 Node／PHP patch 低於該線下限 | 安裝已修補的直譯器 |
   | `constraint-below-floor` | `engines.node` 或 `require.php` 仍允許易受攻擊的 patch | 提高範圍（kit：`>=26.12.1`，PHP `>=8.2.35`） |
   | `runtime-eol` | PHP ≤8.1（上游沒有 php2shell 修補） | 遷到受支援的線 |
   | `compromised-package` | lockfile 命中目錄 IOC（Shai-Hulud 類） | 移除／釘已知安全版本；輪換憑證 |
   | `audit-advisory` | `--online` GHSA 不在 `ignoreGhsas` | override 已修補版本，或寫明 ignore |
   | `action-unpinned` | `uses:` 是 tag，不是 40 字元 SHA | 用 SHA 釘住（security-review 已要求） |
   | `image-unpinned` | compose 標籤缺失或 `latest` | 釘版本標籤（`mysql:8.4` 可以） |
   | `kernel-advisory` | 主機是 Linux；`uname` **不是**已修補證明 | 核對發行版 kernel；只 warn，不失敗 |

4. 修補。提高 `engines`／composer／工作區 override。只有在 CHANGELOG 寫了理由時才加 `ignoreGhsas`（uuid／node-forge／braces 風格）。憑證失竊活動：輪換 npm、GitHub 與雲端 token；不要只升版本。永遠不要貼 exploit 步驟或 PoC。

5. 輸出 [輸出格式](#輸出格式)。若改了程式，再跑 [verify-change](verify-change.zh.md)。

## 目錄

`tooling/ysk-cli/src/supply/catalog.json` 隨 `@ysk-kit/cli` 發佈。初始下限（上游公告，2026-10-21）：

- Node 22 ≥ 22.23.4、24 ≥ 24.22.1、26 ≥ 26.12.1（CVE-2026-111497）。
- PHP 8.2 ≥ 8.2.35、8.3 ≥ 8.3.36、8.4 ≥ 8.4.27、8.5 ≥ 8.5.12（CVE-2026-109618／CVE-2026-109619）。PHP ≤8.1 已 EOL。
- Linux 提醒：Dirty Frag（CVE-2026-43284）、ptrace LPE（CVE-2026-46333）——只盤點。
- npm 種子：`@ctrl/tinycolor` 4.1.1／4.1.2（Shai-Hulud）。完整度靠 `--online`。

## 驗證

```bash
pnpm ysk-kit check supply --repo-only
pnpm ysk-kit check agent
```

預期：已修補的樹上印 `ysk-kit check supply: ok`（或只有已記錄的 ignore／只 warn 的 kernel）。改目錄或 skill 之後 `check agent: ok`。

- [ ] 樹內與寫作都沒有 exploit PoC
- [ ] 用了 `ignoreGhsas` 時 CHANGELOG 有理由
- [ ] 目錄 `updated` 對得上你剛加的公告

## 輸出格式

```md
## Supply scan — <scope>

catalog.updated: <date>
host: node <ver> php <ver|none> kernel <ver|skipped>
repo: engines.node <range> composer.php <range|none>

| Rule | Component | Have | Need | Advisories | Action |
|---|---|---|---|---|---|
| 1 | node | 26.12.0 | 26.12.1 | CVE-2026-111497 | install patched Node |

Online: ran | skipped
Done: no | yes
```

## 完成條件

失敗的 finding 已修或有書面 ignore。具名 CVE 的目錄是新的。沒有加入不明掃描器二進制。

## 反模式

| 症狀 | 改做這個 |
|---|---|
| 預設 `npx trivy`／`osv-scanner` | `ysk-kit check supply`；新掃描器二進制先問 |
| 把 `uname -r` 當成已修補 | kernel 只 warn；讀發行版公告 |
| 為了 CI 綠而 ignore GHSA | override 已修補版本，或寫明原因 |
| 重現 php2shell／Dirty Frag | 盤點版本；永不跑 PoC |
| 把 CVE 規則併進 `check agent` | `check agent` 是法律（enum／Prisma／fetch／skill-drift） |

## 升級／詢問

在把 Trivy／OSV-Scanner／Snyk 設為 kit 預設之前、在加 envelope 例外之前、在沒有理由就放寬 `ignoreGhsas` 之前，停下來問。
