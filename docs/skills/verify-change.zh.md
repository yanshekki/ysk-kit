# Skill：驗證改動

Language: [English](verify-change.md) · 中文

每個功能之後都執行。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。測試：[測試指南](../guides/testing.zh.md)。

## 步驟

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

五項都必須成功。`pnpm layers` 捉到客戶端 → Prisma import 代表改動失敗，不是警告。`pnpm ysk-kit check agent` 捉到 TypeScript `enum`、客戶端 Prisma import，或 web/admin/mobile/desktop 的 raw `fetch`，同樣代表改動失敗。

可選：

- `pnpm lint`
- 若改了登入或 shell 路徑，且 3001／5173 空閒，執行 `pnpm e2e`
- `gen:openapi` 之後打開 `GET /docs`，確認新路徑

不要為了讓單元測試通過而啟動 Redis、Stripe、Twilio、FCM、Jaeger 或 Grafana。
