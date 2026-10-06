# Feature plans

Language: [中文](README.zh.md) · English

Durable plans for YSK Kit work. Agent law: [AGENTS.md](../../AGENTS.md). Procedure: [plan-feature](../skills/plan-feature.md).

## Location

| File | Role |
|---|---|
| `_template.md` / `_template.zh.md` | Bilingual skeleton. Do not fill these in place. |
| `<yyyy-mm-dd>-<slug>.md` | Canonical English plan (ISO date, kebab slug). |
| `<yyyy-mm-dd>-<slug>.zh.md` | Chinese pair, same depth. |
| `/plan.md` (repo root) | Optional session pointer. Gitignored. `pnpm ysk-kit plan <slug>` writes it. |

When a plan is required, write the dated file **before** contracts and implementation. Edit the dated file, not only the session pointer.

## Create

```bash
pnpm ysk-kit plan <kebab-slug>
pnpm ysk-kit plan <kebab-slug> --force
pnpm ysk-kit plan <kebab-slug> --date 2026-10-06
```

`--date` defaults to today (local). `--force` overwrites an existing dated pair.

## When required

See [AGENTS.md — Planning protocol](../../AGENTS.md#planning-protocol). Short form: new or changed HTTP, Prisma, capabilities, SDK/client surfaces, multi-package work, authz/secrets, or the user asked for a plan.
