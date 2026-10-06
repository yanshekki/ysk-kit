---
name: verify-change
description: >
  每個功能之後跑 YSK Kit 驗證鏈（layers、typecheck、test、OpenAPI、check agent）。
  完成改動、加模組／能力之後，或 /verify-change 時使用。
---

# Skill：驗證改動

Language: [English](verify-change.md) · 中文

每個功能之後都執行。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。測試：[測試指南](../guides/testing.zh.md)。

## 觸發

- 功能或修復即將標為完成。
- `ysk-kit add module`／`add <capability>` 之後。
- 修復 layers 或 check-agent 失敗之後。

## 輸入

| 輸入 | 必要 | 備註 |
|---|---|---|
| 產品根目錄 | 否 | 若掃描的不是本 checkout，設 `YSK_ROOT` |
| 登入／shell 改動 | 否 | 3001／5173 空閒時可加跑 `pnpm e2e` |

## 步驟

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

五項都必須成功。`pnpm layers` 捉到客戶端 → Prisma import 代表改動失敗，不是警告。`pnpm ysk-kit check agent` 捉到 TypeScript `enum`、客戶端 Prisma import、web/admin/mobile/desktop 的 raw `fetch`、指針不再提及 `AGENTS.md`、skill 副本漂移，或根目錄加巢狀 `AGENTS.md` 超過 24 KiB，同樣代表改動失敗。

可選：

- `pnpm lint`
- 若改了登入或 shell 路徑，且 3001／5173 空閒，執行 `pnpm e2e`
- `gen:openapi` 之後打開 `GET /docs`，確認新路徑
- Grok Build：用 `grok inspect` 確認載入了哪些規則檔
- UI 畫面：標為完成之前跑 [ui-review](ui-review.zh.md)
- 新測試：先 [test-plan](test-plan.zh.md)，再 [write-tests](write-tests.zh.md)

不要為了讓單元測試通過而啟動 Redis、Stripe、Twilio、FCM、Jaeger 或 Grafana。

## 驗證

- [ ] 五條命令都顯示成功
- [ ] HTTP 有變時，`docs/openapi.yaml` 看得到新路徑
- [ ] 日誌沒有密鑰、OTP、Stripe `sk_` 或 webhook 密鑰

## 完成條件

五條命令全綠，而且 `AGENTS.zh.md` 的[完成定義](../../AGENTS.zh.md#完成定義)成立，才可把改動標為完成。
