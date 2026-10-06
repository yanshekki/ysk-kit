# `create-ysk-app`

Language: [中文](create-ysk-app.zh.md) · English

Scaffold a product from this kit. Package: `@ysk-kit/create-app`.

```text
pnpm --filter @ysk-kit/create-app start <name> [options]
pnpm create @ysk-kit/app <name> [options]
npm create @ysk-kit/app <name> [options]
```

There is no unscoped `create-ysk-app` package on npm. The published package is `@ysk-kit/create-app`; its bin name is `create-ysk-app`.

From a kit checkout the CLI copies this tree. From npm it resolves tag `v{version}` to a commit SHA, downloads that commit's archive, and checks the extracted `package.json` name and version.

Missing `<name>` on a non-TTY prints `--help` and exits 1. Unknown `--flavor` throws `not in this phase`.

## Interactive

On a TTY, omitted choices are prompted (name, flavor, preset, database, admin, mobile). Empty input keeps the default. Flags already on the command line are not asked again.

`--yes` / `-y` skips prompts and uses defaults plus any flags passed. CI and pipes are non-TTY and never prompt.

`php-bridge` and `static-web3` are not asked for preset or database. Only `saas` is asked for admin and mobile.

## Options

| Flag | Values | Default | Notes |
|---|---|---|---|
| `--preset` | `thin` \| `full` | `thin` | Thin copies then strips llm, billing, organizations, devices. Full keeps the living demonstration. Ignored by `php-bridge` and `static-web3`. |
| `--db` | `mysql` \| `postgresql` \| `sqlite` | `mysql` | Rewrites Prisma `provider`, driver adapter in `create-prisma.ts`, `DATABASE_URL`, and Compose. SQLite strips `@db.*` native types. |
| `--flavor` | `saas` \| `desktop` \| `gateway` \| `php-bridge` \| `trading` \| `static-web3` | `saas` | Selects which apps are copied. |
| `--no-admin` | flag | admin on | Skip `apps/admin`. Ignored when the flavor already omits admin. Gateway always includes admin. |
| `--no-mobile` | flag | mobile on | Skip `apps/mobile`. Ignored when the flavor already omits mobile. |
| `--yes` / `-y` | flag | off | Do not prompt. Use defaults and any other flags. |

Copy skips `node_modules`, `dist`, `.git`, `.turbo`, `coverage`, `.expo`, `.DS_Store`, `generated`, the kit-root `examples/` tutorials, `.runs`, `.cursor`, `.grok`, editor trees, any `.env*` file except `.env.example`, and kit-authoring tests under `tooling/` (`*.test.ts` / `*.test.tsx`). `tooling/examples` and `tooling/create-ysk-app` stay. After copy, skipped apps (mobile, admin, …) are dropped from dest `pnpm-lock.yaml` importers so `pnpm install` works with a frozen lockfile. Workspace flavors then write agent skill wrappers from `tooling/ysk-cli/templates/agent/` into `.agents/skills/`, `.claude/skills/`, `.cursor/skills/`, `.grok/skills/`, plus scoped `.cursor/rules/*.mdc` and nested `AGENTS.md` files when those apps exist. The copied `.gitignore` ignores `.env` and `.env.*` (keeps `.env.example`), sqlite `*.db` (including `apps/api/dev.db`), editor caches under `.cursor/`, `.claude/`, and `.grok/` (committed rule/skill trees are un-ignored), generated Prisma, `node_modules`, build output, Playwright reports, `.runs/`, and root `plan.md`.

## Flavors

| Flavor | Apps | Extra file | Preset |
|---|---|---|---|
| `saas` | api, web, admin, mobile (flags can drop admin/mobile) | — | applied |
| `desktop` | api, desktop | — | applied |
| `gateway` | api, admin | `GATEWAY.md` + `.zh.md` | applied |
| `php-bridge` | none (OpenAPI + `ts/` + `php/` clients) | bilingual README | ignored |
| `trading` | api, web | `TRADING.md` + `.zh.md` | applied |
| `static-web3` | web | `WEB3.md` + `.zh.md` | ignored |

Details: [flavors guide](../guides/flavors.md).

## Thin preset

After copy, thin removes llm, billing, organizations, and device (push) modules, Prisma models, routes, web screens, and the optional SDK resource tests. Identity, files, notifications, jobs, mail, API keys, crypto, and realtime stay. Restore with:

```bash
pnpm ysk-kit add llm
pnpm ysk-kit add team
pnpm ysk-kit add billing    # after team
pnpm ysk-kit add push
```

Copied `docs/openapi.yaml` still describes the living kit until you run `pnpm gen:openapi` in the product.

## After create

The CLI prints next steps. Typical Node flavor:

```bash
cd <name>
pnpm install
cp .env.example .env
docker compose up -d mysql    # skip for sqlite
pnpm db:generate && pnpm db:migrate && pnpm db:seed
pnpm ysk-kit add module <kebab> --prisma --web
pnpm gen:openapi
pnpm dev
```

Generated products receive `.ysk-kit.json`, `README.md`, and `README.zh.md`. Seed accounts: `admin@ysk.hk` / `ysk-admin-dev`. Refresh kit guardrails with `pnpm ysk-kit upgrade` ([guide](../guides/upgrade.md)).
