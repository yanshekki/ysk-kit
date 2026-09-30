# CLI

Language: [English](index.md) · 中文

YSK Kit 附帶兩套產生器與一組工作區 script。

| 工具 | 用途 | 手冊 |
|---|---|---|
| `ysk` | 加模組、加能力、產生 OpenAPI、更新護欄、掃描 agent 補丁 | [ysk.zh.md](ysk.zh.md) |
| `create-ysk-app` | 從本 kit 產生一個產品 | [create-ysk-app.zh.md](create-ysk-app.zh.md) |
| `@ysk/examples` | 把已完成的產品 overlay 套用到新目的地 | [examples.zh.md](examples.zh.md) |
| 根 `package.json` scripts | 開發、測試、遷移、種子、lint | [workspace-scripts.zh.md](workspace-scripts.zh.md) |
| `.env` / `.env.example` | 運行時設定 | [env.zh.md](env.zh.md) |

無參數執行 `pnpm ysk` 或 `pnpm --filter @ysk/create-app start` 會列印英文 `--help`。中文手冊是完整參考。

`YSK_ROOT` 決定 `ysk` 修補哪一棵樹。二進制預設是本倉；測試與產生出來的產品把 `YSK_ROOT` 設成產品根目錄。
