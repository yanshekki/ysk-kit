# 計劃：{{title}}

Language: 英文配對 `{{date}}-{{slug}}.md` · 中文 `{{date}}-{{slug}}.zh.md`

| | |
|---|---|
| **Slug** | `{{slug}}` |
| **日期** | {{date}} |
| **狀態** | draft |
| **正規檔** | `docs/plans/{{date}}-{{slug}}.md` |
| **工作階段指針** | `/plan.md`（已 gitignore） |

法律：[AGENTS.zh.md](../../AGENTS.zh.md)。程序：[plan-feature](../skills/plan-feature.zh.md)。

## 目標與使用者問題

使用者需要的結果，以及現行樹為何未能提供。

## 範圍

- 包含：

## 非目標

- 不含：

## 受影響的 flavor／preset／capability

| 軸 | 值 | 備註 |
|---|---|---|
| Flavor | saas / desktop / gateway / trading / static-web3 / php-bridge / kit 本身 | |
| Preset | thin / full / 不適用 | |
| Capabilities | auth、team、billing、llm、push、… | |

## 合約先行

DTO 名稱、欄位、error code、ts-rest 路徑。先加 `OkSchema`／`ErrSchema`，才寫 handler。

| 項目 | 名稱／路徑 | 備註 |
|---|---|---|
| DTO | | |
| Command | | |
| Error codes | 重用既有代碼，除非有理由新增 | |
| 路徑 | `/v1/…` | |

## 資料模型／Prisma 與遷移

Model、欄位、關聯。Prisma 留在 `apps/api/src/modules/*/infra`。註明是否需要 `pnpm db:migrate`。

## 模組切片與分層

哪些 `apps/api/src/modules/<name>/{domain,application,infra}` 檔會改。domain 與 application 不碰 Express、Fastify、Prisma、React、BullMQ。

## SDK／web-sdk／客戶端表面

`packages/sdk` resource、`packages/web-sdk` hooks，以及 web／admin／mobile／desktop 畫面。不要 raw `fetch`。客戶端不要 Prisma。

## Jobs／mail／realtime／notifications

隊列名稱、郵件模板、socket 事件、站內通知 — 或「沒有」。

## 安全與私隱

授權（角色／權限）、速率限制、密鑰（不要把 OTP、Stripe `sk_`、webhook 密鑰寫進日誌）、個人資料。

## 測試計劃

只用記憶體 port。不要啟動 Redis、Stripe、Twilio、FCM、Jaeger 或 Grafana。

- [ ] Memory-repo 服務案例
- [ ] Envelope／error code 案例
- [ ] 若改了 UI，hooks 只經 SDK

## 驗證命令

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

可選：`pnpm lint`。若改了登入或 shell，且 3001／5173 空閒，執行 `pnpm e2e`。Grok Build：`grok inspect`。

## 文件／變更紀錄／changeset

- [ ] 程序有變則更新 `docs/skills/` 或 recipe
- [ ] `CHANGELOG.md`／`CHANGELOG.zh.md` 與 README 最近三個版本窗口
- [ ] 公開套件的 changeset

## 風險與回滾

可能出錯之處，以及如何還原（遷移回退、還原 commit、不掛載 capability）。

## 任務清單

按順序列出。每項都有驗收條件。

1. [ ] 合約 — *驗收：* DTO + `OkSchema`／`ErrSchema` 存在；沒有 TypeScript `enum`
2. [ ] 骨架 — *驗收：* 適用時使用 `ysk-kit add module`／`add <capability>`
3. [ ] Application 規則 — *驗收：* 記憶體 port 測試通過
4. [ ] 客戶端 — *驗收：* 只用 SDK／web-sdk
5. [ ] 驗證 — *驗收：* 上述五條命令全綠
6. [ ] 文件 — *驗收：* 中英配對深度一致

## 未決問題

- 
