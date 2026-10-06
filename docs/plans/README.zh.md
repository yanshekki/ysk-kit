# 功能計劃

Language: [English](README.md) · 中文

YSK Kit 工作的可保存計劃。Agent 法律：[AGENTS.zh.md](../../AGENTS.zh.md)。程序：[plan-feature](../skills/plan-feature.zh.md)。

## 位置

| 檔案 | 角色 |
|---|---|
| `_template.md`／`_template.zh.md` | 雙語骨架。不要直接填在這兩個檔。 |
| `<yyyy-mm-dd>-<slug>.md` | 正規英文計劃（ISO 日期，kebab slug）。 |
| `<yyyy-mm-dd>-<slug>.zh.md` | 中文配對，深度相同。 |
| `/plan.md`（倉根） | 可選工作階段指針。已 gitignore。`pnpm ysk-kit plan <slug>` 會寫入。 |

協議要求計劃時，在合約與實作**之前**寫好日期檔。請改日期檔，不要只改工作階段指針。

## 建立

```bash
pnpm ysk-kit plan <kebab-slug>
pnpm ysk-kit plan <kebab-slug> --force
pnpm ysk-kit plan <kebab-slug> --date 2026-10-06
```

`--date` 預設是今天（本地日期）。`--force` 會覆寫已有的日期配對。

## 何時必須

見 [AGENTS.zh.md — 計劃協議](../../AGENTS.zh.md#計劃協議)。簡述：新增或改動 HTTP、Prisma、capability、SDK／客戶端表面、跨套件工作、授權／密鑰，或使用者要求計劃。
