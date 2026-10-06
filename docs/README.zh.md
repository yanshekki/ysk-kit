# 文件

Language: [English](README.md) · 中文

YSK Kit 的公開手冊。從未見過本倉的讀者，應能從這裏開始：明白這套平台是甚麼、如何運行、如何加功能。

| 若要… | 閱讀 |
|---|---|
| 數分鐘內運行 kit 或產生一個產品 | [入門](guides/getting-started.zh.md) |
| 跟隨一個做完的系統（十列目錄） | [已完成的實例](../examples/README.zh.md) |
| 理解這套平台 | [架構](architecture.zh.md)、[根 README](../README.zh.md) |
| 使用產生器 | [CLI](cli/index.zh.md)、[加模組](recipes/add-module.zh.md)、[加能力](recipes/add-capability.zh.md)、[更新護欄](guides/upgrade.zh.md) |
| 學習一個子系統 | [Hexagonal 分層](guides/hexagonal.zh.md)、[envelope](guides/envelope.zh.md)、[flavors](guides/flavors.zh.md)、[能力](guides/capabilities.zh.md)、[測試](guides/testing.zh.md)、[部署](guides/deploy.zh.md)、[升級](guides/upgrade.zh.md) |
| 跟隨 AI 程序 | [Skills](skills/index.zh.md) 與 [AGENTS.zh.md](../AGENTS.zh.md) |
| 寫功能計劃 | [計劃](plans/README.zh.md) 與 [plan-feature](skills/plan-feature.zh.md) |
| 查看某個版本加入了甚麼 | [變更紀錄](../CHANGELOG.zh.md) |
| 閱讀階段日記 | [歷史](history.zh.md) |
| 報告漏洞 | [安全](../SECURITY.zh.md) |
| 查看下一步方向 | [產品方向](product-plan.zh.md) |
| 閱讀架構決定 | [ADR 0001：ts-rest](adr/0001-ts-rest.zh.md) |
| 投稿文件 | [貢獻指引](contributing.zh.md) |

產生出來的 OpenAPI 在 [`openapi.yaml`](openapi.yaml)（運行中的 API 提供 `GET /openapi.json`）。由 `pnpm gen:openapi` 寫出，不另譯語言。

中文版路徑相同，副檔名為 `.zh.md`。
