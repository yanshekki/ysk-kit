# CLI

Language: [中文](index.zh.md) · English

YSK Kit ships two generators and a set of workspace scripts.

| Tool | Purpose | Manual |
|---|---|---|
| `ysk` | Add a module, add a capability, generate OpenAPI, refresh guardrails, scan agent patches | [ysk.md](ysk.md) |
| `create-ysk-app` | Scaffold a product from this kit | [create-ysk-app.md](create-ysk-app.md) |
| `@ysk/examples` | Apply a worked product overlay onto a new destination | [examples.md](examples.md) |
| Root `package.json` scripts | Dev, test, migrate, seed, lint | [workspace-scripts.md](workspace-scripts.md) |
| `.env` / `.env.example` | Runtime configuration | [env.md](env.md) |

Run `pnpm ysk` or `pnpm --filter @ysk/create-app start` without arguments to print English `--help`. The Chinese manuals are the full reference.

`YSK_ROOT` selects which tree `ysk` patches. The binary defaults to this repository; tests and generated products set `YSK_ROOT` to the product root.
