# 掃描第三方程式版本

Language: [English](scan-supply.md) · 中文

如何用 `ysk-kit check supply` 盤點 Node、PHP、kernel、lockfile、Actions 與 compose pin。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。Skill：[supply-scan](../skills/supply-scan.zh.md)。CLI：[ysk-kit](../cli/ysk-kit.zh.md)。

## 命令

```bash
pnpm ysk-kit check supply --json
pnpm ysk-kit check supply --repo-only
pnpm ysk-kit check supply --repo-only --online
```

`--repo-only` 跳過主機 PHP 與 kernel（CI）。`--online` 跑 `pnpm audit --json` 並尊重 `pnpm-workspace.yaml` 的 `auditConfig.ignoreGhsas`。Vitest 永不呼叫 registry。

## finding 長這樣

```text
runtime-below-floor  node  have=v26.12.0 need=26.12.1  CVE-2026-111497
constraint-below-floor  engines.node  have=>=26.0.0 need=26.12.1  package.json  CVE-2026-111497
```

`--json` 印出 `{ ok, catalogUpdated, inventory, findings }` 給 agent。

## 典型修法

| Finding | 修法 |
|---|---|
| Node 低於下限 | 安裝 ≥26.12.1；把 `engines.node` 設成 `>=26.12.1` |
| PHP 低於下限 | 安裝已修補線（8.2.35／8.3.36／8.4.27／8.5.12）；composer `>=8.2.35` |
| GHSA | 工作區 override 到已修補版本，或有說明的 `ignoreGhsas` |
| 未釘的 Action | `uses: owner/repo@<40 字元 sha>` |
| Compose `latest` | 釘版本標籤 |
| Kernel 提醒 | 發行版 kernel 更新；CLI 不會因 `ubuntu-latest` 讓 CI 失敗 |

不要把 Trivy 或 OSV-Scanner 設為預設。不要跑 exploit PoC。世界級 CVE 之後，先改 `tooling/ysk-cli/src/supply/catalog.json` 再跑。
