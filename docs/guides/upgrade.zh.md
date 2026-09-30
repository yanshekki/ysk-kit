# 更新已產生產品的護欄

Language: [English](upgrade.md) · 中文

以 `create-ysk-app` 開出的產品，一開始是本倉的複本（`php-bridge` 則是產生出來的客戶端）。其後業務程式寫在該產品內。Kit 的護欄——agent 法律、skills、TypeScript 設定、Biome 設定，以及 `pnpm layers` 規則——可以稍後更新，而無須再複製整棵樹。

日常路徑：**複製，然後 `ysk upgrade`**。

## 兩種使用方式

| 路徑 | 何時使用 |
|---|---|
| 複製 + `ysk upgrade` | 預設。適用於 `create-ysk-app` 的每一個 flavor。 |
| GitHub Packages（`@ysk/*`） | 只在 GitHub 擁有者與 `@ysk` npm scope 一致時使用。可發布程式庫已為 `https://npm.pkg.github.com` 設定 `publishConfig`。本 kit 的日常流程不會從 registry 執行 `npm install` 那些套件。 |

工作區產品仍然以 `workspace:*` 解析 TypeScript 原始碼中的 `@ysk/*`。

## 來源標記

`create-ysk-app` 會在每個 flavor 的產品根目錄寫入 `.ysk-kit.json`：

```json
{
  "kit": "ysk-kit",
  "version": "0.1.0",
  "flavor": "saas",
  "preset": "thin",
  "db": "mysql"
}
```

`version` 是產生當下 kit `package.json` 的版本。產生出來的 `README.md` / `README.zh.md` 會記下同一來源，並指向 `pnpm ysk upgrade`。

## 如何執行

命令會把 **含有 CLI 的 kit 工作副本** 複製到 **產品根目錄**。

在你要套用的那一版 YSK Kit 工作副本中執行：

```bash
YSK_ROOT=/path/to/your-product pnpm ysk upgrade
YSK_ROOT=/path/to/your-product pnpm ysk upgrade --dry-run
```

未設定時，`YSK_ROOT` 預設為擁有該 CLI 的倉。在本 kit 內執行 `pnpm ysk upgrade` 是冪等的（來源與目的是同一棵樹）。`--dry-run` 只列印 `will copy` / `skip`，不寫檔。

若沒有 `.ysk-kit.json`，只要存在 `pnpm-workspace.yaml` 或 `AGENTS.md`，命令仍會執行，然後寫入標記；`flavor` / `preset` / `db` 在檔案尚未有值時為 `unknown`。否則結束並提示：請在產品根目錄執行，或設定 `YSK_ROOT`。

## 會覆寫甚麼

| 路徑 | 職責 |
|---|---|
| `AGENTS.md` · `AGENTS.zh.md` | Agent 法律 |
| `CLAUDE.md` | Agent 入口 |
| `.cursor/rules/ysk-kit.mdc` | Cursor 法律 |
| `.dependency-cruiser.cjs` | `pnpm layers` |
| `packages/typescript-config/` | 編譯設定（沒有業務型別） |
| `packages/biome-config/` | lint 設定 |
| `docs/skills/` | Agent 程序正文 |
| `.grok/skills/` · `.cursor/skills/` | skill 包裝 |

複製目錄時略過 `node_modules` 與 `dist`。Kit 沒有的路徑會略過（`php-bridge` 沒有 TypeScript 工作區套件時屬常見情況）。產品端若缺少父目錄，會先建立。

成功執行後，`.ysk-kit.json` 的 `version` 會更新為當前 kit 版本。`flavor`、`preset` 與 `db` 保留。

## 不會改動甚麼

- `apps/**` 與 `modules/**`
- 產品在 `packages/contracts` 下的 DTO
- 產品的 `README.md` / `README.zh.md`
- `.env` 與 Prisma 遷移
- `docs/openapi.yaml`（產品可能描述另一套 API）

Envelope 規則留在 `AGENTS.md`。Envelope 輔助函式留在產品已複製的 `@ysk/contracts`。合約實作的修復不會自動合併。

## `php-bridge`

允許清單上多數路徑並不存在。命令仍然成功，對產品尚未擁有的路徑列印 `skip`，並更新 `.ysk-kit.json`。它不會加入 TypeScript 工作區，也不會覆寫 `docs/openapi.yaml`。

## 更新之後

```bash
pnpm layers && pnpm typecheck && pnpm test
```

`php-bridge` 與 `static-web3` 跟隨產生出來的 README，而不是 API 驗證鏈。

CLI 參考：[`ysk upgrade`](../cli/ysk.zh.md#ysk-upgrade)。
