# 貢獻指引

Language: [English](contributing.md) · 中文

本檔給改動 YSK Kit 本身的人：程式、測試或文件。

## 程式

1. 寫程式之前先讀 [AGENTS.zh.md](../AGENTS.zh.md)。
2. 新的 HTTP 資源由 `pnpm ysk add module <kebab> --prisma --web` 開始。
3. 業務規則放在 `application/`。Prisma 留在 `infra/`。
4. 完成前執行：`pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi`。

不要把行業 domain（沙龍、交易所、地圖產品）加進本 kit。那些業務寫在 `create-ysk-app` 產生的產品倉。

## 文件

每份給人讀的 Markdown 都成對：

- 英文：`name.md`
- 繁體香港書面語：`name.zh.md`

檔案頂部互相連結：

```text
Language: [中文](foo.zh.md) · English
```

```text
Language: [English](foo.md) · 中文
```

兩種語言同等深度：表格、命令、例外清單兩邊齊。中文不是英文的摘要。

### 中文（香港書面語）

使用繁體字與書面句法（是／不是／沒有／此／該）。優先使用香港用詞：軟件、網絡、伺服器、預設、檔案、資料庫、帳戶、權限、質素、程式、套件。技術專名保留英文（Prisma、Express、envelope、Playwright）。不用粵語口語助詞（係、唔、冇、嚟、嗰）。

### 公開語調

文件是公開的。從未見過本公司或本倉的第三方，讀完應能明白這套平台。

- 寫系統現在如何運作，以及使用者如何操作。
- 標了日期的「何時加入了甚麼」只寫在 [history.zh.md](history.zh.md)。
- 下一步工作寫在 [product-plan.zh.md](product-plan.zh.md)，用功能名稱，不用內部波次編號。
- 不要把開發日記寫進架構、指南、README、CLI 手冊或 skills。
- Flavor 用產品形態說明。不要假設讀者認識其他私人倉。

不翻譯 `LICENSE`、`docs/openapi.yaml`、程式碼註解或 Prisma schema。

工具入口維持英文：`CLAUDE.md`、`.cursor/rules/`、`.grok/skills/*/SKILL.md`、`.cursor/skills/*/SKILL.md`。它們指向 `AGENTS.md` 與 `docs/skills/`。

### 單一事實來源

| 事實 | 所在 |
|---|---|
| 硬規則 | `AGENTS.md`（中文：`AGENTS.zh.md`） |
| 現行系統形態 | `docs/architecture.md` |
| 命令與旗標 | `docs/cli/` |
| 概念 | `docs/guides/` |
| 逐步操作 | `docs/recipes/` |
| Agent 程序 | `docs/skills/`（`.grok/skills` 與 `.cursor/skills` 的包裝只指向此處） |
| 變更紀錄 | `docs/history.md` |
| 路線圖 | `docs/product-plan.md` |

先改英文來源，再更新中文對。

`tooling/ysk-cli` 的配對測試會在 `docs/**/*.md` 缺少 `.zh.md` 兄弟檔時失敗。
