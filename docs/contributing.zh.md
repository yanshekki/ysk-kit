# 貢獻指引

Language: [English](contributing.md) · 中文

本檔給改動 YSK Kit 本身的人：程式、測試或文件。

## 程式

1. 寫程式之前先讀 [AGENTS.zh.md](../AGENTS.zh.md)。
2. 新的 HTTP 資源由 `pnpm ysk-kit add module <kebab> --prisma --web` 開始。
3. 業務規則放在 `application/`。Prisma 留在 `infra/`。
4. [計劃協議](../AGENTS.zh.md#計劃協議)要求計劃時，先寫 `docs/plans/<yyyy-mm-dd>-<slug>.md`（`pnpm ysk-kit plan <slug>`）。
5. 完成前執行：`pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent`。

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
- 版本化的產品變更紀錄寫在 [CHANGELOG.zh.md](../CHANGELOG.zh.md)。根 README 只列出最近三個版本（見下）。階段日記寫在 [history.zh.md](history.zh.md)。
- 下一步工作寫在 [product-plan.zh.md](product-plan.zh.md)，用功能名稱，不用內部波次編號。
- 不要把開發日記寫進架構、指南、README、CLI 手冊或 skills。
- Flavor 用產品形態說明。不要假設讀者認識其他私人倉。

不翻譯 `LICENSE`、`docs/openapi.yaml`、程式碼註解或 Prisma schema。

工具入口維持英文而且精簡：`CLAUDE.md`、`GEMINI.md`、`.github/copilot-instructions.md`、`.cursor/rules/*.mdc`，以及來自 `tooling/ysk-cli/templates/agent/` 的 skill 包裝。它們指向 `AGENTS.md` 與 `docs/skills/`。共用 skills 在 `.agents/skills/`（`.claude/skills/` 是相同副本）。`.cursor/`、`.claude/`、`.grok/` 底下的編輯器快取仍 gitignore，已提交的指引樹除外。根目錄 `plan.md` 是工作階段草稿，已 gitignore。

### 單一事實來源

| 事實 | 所在 |
|---|---|
| 硬規則 | `AGENTS.md`（中文：`AGENTS.zh.md`） |
| 現行系統形態 | `docs/architecture.md` |
| 命令與旗標 | `docs/cli/` |
| 概念 | `docs/guides/` |
| 逐步操作 | `docs/recipes/` |
| Agent 程序 | `docs/skills/`（`.agents/skills` 包裝只指向此處） |
| 功能計劃 | `docs/plans/<yyyy-mm-dd>-<slug>.md` |
| 版本變更紀錄 | `CHANGELOG.md`（最近三個版本同時在根 README） |
| 階段日記 | `docs/history.md` |
| 路線圖 | `docs/product-plan.md` |
| 決定 | `docs/adr/` |

### README 變更紀錄窗口

`README.md` 與 `README.zh.md` 只顯示最近三個版本。每個版本按適用的類別分組：

| English | 中文 |
|---|---|
| New features | 新功能 |
| Improvements | 改進 |
| Fixes | 修正 |
| Security | 安全 |
| Dependency upgrades | 依賴升級 |
| Internal/CI | 內部／CI |

該節結尾連結到完整變更紀錄（`CHANGELOG.md`，中文 `CHANGELOG.zh.md`）。完整變更紀錄保留每一個版本，由新到舊，並使用同樣的類別。Changesets 仍然撰寫每個套件的 `CHANGELOG.md`。完整變更紀錄連結這些檔案。不要編造條目。條目取自 GitHub release、tag、各套件變更紀錄與 git 歷史。

每次發佈都把新版本加在 README 該節的頂部，並把三個版本中最舊的一個移入完整變更紀錄。GitHub 產品 release `vX.Y.Z` 的說明就是 README 上的新條目。v1.1.3 之前，README 窗口是 v1.1.2、v1.1.1 與 v1.1.0；v1.1.3 把 v1.1.0 移入完整變更紀錄。

若該次發佈改動 npm 會隨套件發佈的 README，加上 patch changeset，讓 npm 上的 README 一併更新。

先改英文來源，再更新中文對。

`tooling/ysk-cli` 的配對測試會在 `docs/**/*.md` 缺少 `.zh.md` 兄弟檔時失敗。
