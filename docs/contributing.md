# Contributing

Language: [中文](contributing.zh.md) · English

This document is for people who change YSK Kit itself: code, tests, or documentation.

## Code

1. Read [AGENTS.md](../AGENTS.md) before writing code.
2. New HTTP resources start with `pnpm ysk add module <kebab> --prisma --web`.
3. Put business rules in `application/`. Keep Prisma in `infra/`.
4. Before you finish: `pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi`.

Do not add an industry domain (salon, trading venue, map product) to this kit. Build those in a product repository created by `create-ysk-app`.

## Documentation

Every human-readable Markdown file is a pair:

- English: `name.md`
- Traditional Chinese in Hong Kong written style: `name.zh.md`

Link the sibling at the top of each file:

```text
Language: [中文](foo.zh.md) · English
```

```text
Language: [English](foo.md) · 中文
```

The two editions have the same depth: tables, commands, and exception lists appear in both. Chinese is not a summary of English.

### Chinese (Hong Kong written style)

Use Traditional characters and written syntax（是／不是／沒有／此／該）. Prefer Hong Kong terms: 軟件, 網絡, 伺服器, 預設, 檔案, 資料庫, 帳戶, 權限, 質素, 程式, 套件. Keep technical names in English (Prisma, Express, envelope, Playwright). Do not use Cantonese colloquial particles（係、唔、冇、嚟、嗰）.

### Public voice

Documentation is public. Write so a third party who has never seen the company or this repository can understand the platform.

- Describe how the system works today and how to use it.
- Put dated “what shipped when” only in [history.md](history.md).
- Put upcoming work in [product-plan.md](product-plan.md) using feature names, not internal wave numbers.
- Do not write development-diary phrases into architecture, guides, README, CLI manuals, or skills.
- Explain flavors as product shapes. Do not require the reader to know other private repositories.

Do not translate `LICENSE`, `docs/openapi.yaml`, source comments, or Prisma schema.

Tool stubs stay English-only: `CLAUDE.md`, and the generated Cursor/Grok wrappers from `tooling/ysk-cli/templates/agent/`. They point at `AGENTS.md` and `docs/skills/`. `.cursor/` and `.grok/` are gitignored.

### One home per fact

| Fact | Home |
|---|---|
| Hard rules | `AGENTS.md` (Chinese: `AGENTS.zh.md`) |
| Current system shape | `docs/architecture.md` |
| Commands and flags | `docs/cli/` |
| Concepts | `docs/guides/` |
| Step-by-step how-to | `docs/recipes/` |
| Agent procedures | `docs/skills/` (generated `.grok/skills` and `.cursor/skills` wrappers only point here) |
| Changelog | `docs/history.md` |
| Roadmap | `docs/product-plan.md` |

Change the English home first, then update the Chinese pair.

A pairing test in `tooling/ysk-cli` fails if a `docs/**/*.md` file has no `.zh.md` sibling.
