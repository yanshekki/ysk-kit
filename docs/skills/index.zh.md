# Skills

Language: [English](index.md) · 中文

給人與 AI agent 的程序。每個 skill 都是短序列，指向法律、CLI 與操作手冊。它不複製 [AGENTS.zh.md](../../AGENTS.zh.md)。

| Skill | 何時 |
|---|---|
| [new-product](new-product.zh.md) | 用 `create-ysk-app` 產生產品 |
| [add-module](add-module.zh.md) | 新的 HTTP 資源 |
| [add-capability](add-capability.zh.md) | 還原 llm／team／billing／push（或其他目錄名稱） |
| [verify-change](verify-change.zh.md) | 任何功能之後 |
| [fix-layers](fix-layers.zh.md) | `pnpm layers` 失敗 |
| [envelope-api](envelope-api.zh.md) | 新路由、SSE、PDF 或錯誤形狀 |

Grok 載入 `.grok/skills/<name>/SKILL.md`。Cursor 載入 `.cursor/skills/<name>/SKILL.md`。那些檔是由 `tooling/ysk-cli/templates/agent/` 產生的英文包裝（`create-ysk-app` 與 `ysk-kit upgrade`）：YAML `description` 加上指向此處的指針。它們已 gitignore。其他 agent 先讀 `AGENTS.md`，再跟本目錄。
