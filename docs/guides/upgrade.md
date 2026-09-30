# Refreshing a generated product

Language: [中文](upgrade.zh.md) · English

A product created with `create-ysk-app` starts as a copy of this repository (or, for `php-bridge`, as generated clients). Business code then lives in that product. Kit guardrails — agent law, skills, TypeScript config, Biome config, and `pnpm layers` rules — can be refreshed later without copying the whole tree again.

Daily path: **copy-tree, then `ysk upgrade`**.

## Two consumption paths

| Path | When to use |
|---|---|
| Copy-tree + `ysk upgrade` | Default. Every flavor of `create-ysk-app`. |
| GitHub Packages (`@ysk/*`) | Only when the GitHub owner matches the `@ysk` npm scope. Publishable libraries already set `publishConfig` for `https://npm.pkg.github.com`. This kit’s daily workflow does not `npm install` those packages from a registry. |

Workspace products continue to resolve `@ysk/*` as `workspace:*` TypeScript source.

## Origin marker

`create-ysk-app` writes `.ysk-kit.json` at the product root for every flavor:

```json
{
  "kit": "ysk-kit",
  "version": "0.1.0",
  "flavor": "saas",
  "preset": "thin",
  "db": "mysql"
}
```

`version` is the kit `package.json` version at scaffold time. Generated `README.md` / `README.zh.md` record the same origin and point at `pnpm ysk upgrade`.

## How to run

The command copies from the **kit checkout that contains the CLI** into the **product root**.

From a checkout of YSK Kit at the version you want to apply:

```bash
YSK_ROOT=/path/to/your-product pnpm ysk upgrade
YSK_ROOT=/path/to/your-product pnpm ysk upgrade --dry-run
```

`YSK_ROOT` defaults to the repository that owns the CLI. Running `pnpm ysk upgrade` inside this kit is idempotent (source and destination are the same tree). `--dry-run` prints `will copy` / `skip` and does not write files.

If `.ysk-kit.json` is missing, the command still runs when `pnpm-workspace.yaml` or `AGENTS.md` is present, then writes a marker with `flavor` / `preset` / `db` set to `unknown` unless those fields already exist. Otherwise it exits with: run from a product root, or set `YSK_ROOT`.

## What is overwritten

| Path | Role |
|---|---|
| `AGENTS.md` · `AGENTS.zh.md` | Agent law |
| `CLAUDE.md` | Agent entry |
| `.cursor/rules/ysk-kit.mdc` | Cursor law |
| `.dependency-cruiser.cjs` | `pnpm layers` |
| `packages/typescript-config/` | Compiler config (no business types) |
| `packages/biome-config/` | Lint config |
| `docs/skills/` | Agent procedures |
| `.grok/skills/` · `.cursor/skills/` | Skill wrappers |

Directory copies skip `node_modules` and `dist`. A path that does not exist in the kit is skipped (typical for `php-bridge`, which has no TypeScript workspace packages). Missing parent directories on the product side are created.

After a successful run, `.ysk-kit.json` `version` becomes the current kit version. `flavor`, `preset`, and `db` are kept.

## What is left alone

- `apps/**` and `modules/**`
- Product DTOs under `packages/contracts`
- Product `README.md` / `README.zh.md`
- `.env` and Prisma migrations
- `docs/openapi.yaml` (a product may describe a different API)

Envelope rules stay in `AGENTS.md`. Envelope helpers stay in the product’s copied `@ysk/contracts`. Contract implementation fixes are not auto-merged.

## `php-bridge`

Most allowlisted paths are absent. The command still succeeds, prints `skip` for paths the product does not already have, and updates `.ysk-kit.json`. It does not add a TypeScript workspace, and it does not overwrite `docs/openapi.yaml`.

## After upgrade

```bash
pnpm layers && pnpm typecheck && pnpm test
```

`php-bridge` and `static-web3` follow the generated README instead of the API verify chain.

CLI reference: [`ysk upgrade`](../cli/ysk.md#ysk-upgrade).
