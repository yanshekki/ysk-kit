# Contributing

Language: [中文](contributing.zh.md) · English

This document is for people who change YSK Kit itself: code, tests, or documentation.

## Code

1. Read [AGENTS.md](../AGENTS.md) before writing code.
2. New HTTP resources start with `pnpm ysk-kit add module <kebab> --prisma --web`.
3. Put business rules in `application/`. Keep Prisma in `infra/`.
4. When the [planning protocol](../AGENTS.md#planning-protocol) requires a plan, write `docs/plans/<yyyy-mm-dd>-<slug>.md` first (`pnpm ysk-kit plan <slug>`). `pnpm ysk-kit plan --check <file>` must pass before implementation.
5. Before you finish: `pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent`.

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
- Put the versioned product changelog in [CHANGELOG.md](../CHANGELOG.md). The root README lists only the latest three versions (see below). Put the phase diary in [history.md](history.md).
- Put upcoming work in [product-plan.md](product-plan.md) using feature names, not internal wave numbers.
- Do not write development-diary phrases into architecture, guides, README, CLI manuals, or skills.
- Explain flavors as product shapes. Do not require the reader to know other private repositories.

Do not translate `LICENSE`, `docs/openapi.yaml`, source comments, or Prisma schema.

Tool stubs stay English-only and thin: `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, `.cursor/rules/*.mdc`, and skill wrappers from `tooling/ysk-cli/templates/agent/`. They point at `AGENTS.md` and `docs/skills/`. Shared skills live in `.agents/skills/` (`.claude/skills/` is an identical copy). Editor caches under `.cursor/`, `.claude/`, and `.grok/` stay gitignored except those committed guidance trees. Root `plan.md` is session scratch and is gitignored.

### One home per fact

| Fact | Home |
|---|---|
| Hard rules | `AGENTS.md` (Chinese: `AGENTS.zh.md`) |
| Current system shape | `docs/architecture.md` |
| Commands and flags | `docs/cli/` |
| Concepts | `docs/guides/` |
| Step-by-step how-to | `docs/recipes/` |
| Agent procedures | `docs/skills/` (`.agents/skills` wrappers only point here) |
| Feature plans | `docs/plans/<yyyy-mm-dd>-<slug>.md` |
| Version changelog | `CHANGELOG.md` (latest three versions also in the root README) |
| Phase diary | `docs/history.md` |
| Roadmap | `docs/product-plan.md` |
| Decisions | `docs/adr/` |

### README changelog window

`README.md` and `README.zh.md` show only the latest three versions. Group each version by the categories that apply:

| English | 中文 |
|---|---|
| New features | 新功能 |
| Improvements | 改進 |
| Fixes | 修正 |
| Security | 安全 |
| Dependency upgrades | 依賴升級 |
| Internal/CI | 內部／CI |

End that section with a link to the full changelog (`CHANGELOG.md`, Chinese `CHANGELOG.zh.md`). The full changelog keeps every version, newest first, in the same categories. Changesets still writes each package `CHANGELOG.md`. Link those files from the full changelog. Do not invent entries. Take them from GitHub releases, tags, the per-package changelogs, and git history.

Each release adds the new version at the top of the README section and moves the oldest of the three into the full changelog. The notes on the GitHub product release `vX.Y.Z` are that new README entry. Before v1.1.3 the README window was v1.1.2, v1.1.1, and v1.1.0; v1.1.3 moved v1.1.0 into the full changelog.

If that release edits a README that npm publishes with a package, add a patch changeset so the npm README updates too.

Change the English home first, then update the Chinese pair.

A pairing test in `tooling/ysk-cli` fails if a `docs/**/*.md` file has no `.zh.md` sibling.
