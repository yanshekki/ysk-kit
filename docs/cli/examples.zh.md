# 已完成實例 CLI

Language: [English](examples.md) · 中文

套件 `@ysk-kit/examples`，位於 `tooling/examples`。目錄與教程：[examples/README.zh.md](../../examples/README.zh.md)。

```text
pnpm --filter @ysk-kit/examples start apply <slug> [--dest <path>] [--yes] [--db sqlite|mysql|postgresql] [--force] [--skip-install] [--skip-verify]
pnpm --filter @ysk-kit/examples start capture <slug> [--dest <path>]
```

缺少 `<slug>` 會列印 `--help` 並以狀態 1 結束。

| 旗標 | 預設 | 效果 |
|---|---|---|
| `--dest` | `examples/.runs/<slug>` | 要建立或擷取的產品根目錄 |
| `--yes`／`-y` | 關閉 | 傳給 `create-ysk-app`（套用一律送 `--yes`） |
| `--db` | 來自 `spec.json` | sqlite／mysql／postgresql |
| `--force` | 關閉 | 先刪除非空目的地 |
| `--skip-install` | 關閉 | 略過 `pnpm install`、env、generate、migrate、seed |
| `--skip-verify` | 關閉 | 略過目的地的 `layers`／typecheck／test／openapi／`ysk check agent` |

`apply` 執行 `ysk` 時把 `YSK_ROOT` 設成目的地。複製 `overlay/` 之後會執行可選的 `examples/<slug>/patches.json`（精確字串替換）。擷取讀取 `examples/<slug>/capture.json`，使用 API 埠 **13001** 與 web 埠 **15173**，讓 living kit 可繼續佔用 3001／5173。sqlite 目的地會重建 `apps/api/dev.db` 並重新 seed，然後才逐步操作介面。

CI job `example-smoke` 把目錄裡每一個 slug 套用到 sqlite（`fail-fast: false`）。擷取是文件工具；CI 不比對像素。

不要把這些行業模組加進 living `apps/api`。overlay 是給目的地樹用的。
