# 能力

Language: [English](capabilities.md) · 中文

**能力**是已編目的平台功能。`ysk-kit add <name>` 把它合併進產品。**模組**是業務 HTTP 切片（`ysk-kit add module`）。兩者不要混為一談。

## Thin 對比本倉

| `--preset thin` 之後仍在 | thin 會剝走（用 `ysk-kit add` 還原） |
|---|---|
| 身分（註冊、登入、OTP、refresh、users） | `llm` |
| 檔案／儲存 | `team`（organizations） |
| 通知 | `billing`（須先有 `team`） |
| 工作 + 郵件 | `push`（devices） |
| API 金鑰 + 加密 | |
| 即時通訊（Socket.IO） | |

本倉保留完整一套。若樹上已有略過標記，`ysk-kit add` 是空操作。

## 目錄

見 [ysk-kit CLI](../cli/ysk-kit.zh.md) 的表格。十六個名稱：`auth`、`rbac`、`audit-log`、`storage`、`i18n`、`jobs`、`mail`、`notifications`、`llm`、`websocket`、`push`、`mobile`、`team`、`apikey`、`crypto`、`billing`。別名 `org` → `team`。

只有 `llm`、`team`、`billing`、`push` 會從 `tooling/ysk-cli/templates/capabilities/<name>/` 複製源碼樹，而且只在 `app.ts` / `composition.ts` 尚未包含略過標記時複製。

`team` 還原 web `/orgs`；若產品有 `apps/mobile`，同時還原 Expo 組織列表、詳情與接受邀請畫面。`--preset thin` 會剝走那些畫面。

`billing` 需要 Prisma 裏的 `model Organization`。順序：先 `ysk-kit add team`，再 `ysk-kit add billing`。

Flavor 不是能力。沒有 `ysk-kit add trading` 或 `ysk-kit add web3`。

操作手冊：[加能力](../recipes/add-capability.zh.md)。
