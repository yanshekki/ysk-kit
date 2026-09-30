# Worked examples CLI

Language: [中文](examples.zh.md) · English

Package `@ysk-kit/examples` at `tooling/examples`. Catalogue and tutorials: [examples/README.md](../../examples/README.md).

```text
pnpm --filter @ysk-kit/examples start apply <slug> [--dest <path>] [--yes] [--db sqlite|mysql|postgresql] [--force] [--skip-install] [--skip-verify]
pnpm --filter @ysk-kit/examples start capture <slug> [--dest <path>]
```

Missing `<slug>` prints `--help` and exits 1.

| Flag | Default | Effect |
|---|---|---|
| `--dest` | `examples/.runs/<slug>` | Product root to create or capture |
| `--yes` / `-y` | off | Passed through to `create-ysk-app` (apply always sends `--yes`) |
| `--db` | from `spec.json` | sqlite / mysql / postgresql |
| `--force` | off | Delete a non-empty destination first |
| `--skip-install` | off | Skip `pnpm install`, env, generate, migrate, seed |
| `--skip-verify` | off | Skip dest `layers` / typecheck / test / openapi / `ysk-kit check agent` |

`apply` sets `YSK_ROOT` to the destination when it runs `ysk`. After copying `overlay/`, apply runs optional `examples/<slug>/patches.json` (exact string replacements). Capture reads `examples/<slug>/capture.json`, uses API port **13001** and web port **15173** so the living kit can keep 3001 / 5173, and for sqlite destinations recreates `apps/api/dev.db` and re-seeds before it walks the UI.

CI job `example-smoke` applies every catalogue slug onto sqlite (`fail-fast: false`). Capture is a documentation tool; CI does not compare pixels.

Do not add these industry modules to the living `apps/api`. The overlay is for the destination tree.
