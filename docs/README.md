# Documentation

Language: [中文](README.zh.md) · English

Public manuals for YSK Kit. A reader who has never seen this repository should be able to start here and learn what the platform is, how to run it, and how to add a feature.

| If you want to… | Read |
|---|---|
| Run the kit or scaffold a product in minutes | [Getting started](guides/getting-started.md) |
| Follow a finished system (ten catalogue rows) | [Worked examples](../examples/README.md) |
| Understand the platform | [Architecture](architecture.md), [root README](../README.md) |
| Use the generators | [CLI](cli/index.md), [add a module](recipes/add-module.md), [add a capability](recipes/add-capability.md), [refresh guardrails](guides/upgrade.md) |
| Learn a subsystem | [Hexagonal layers](guides/hexagonal.md), [envelope](guides/envelope.md), [flavors](guides/flavors.md), [capabilities](guides/capabilities.md), [testing](guides/testing.md), [deploy](guides/deploy.md), [upgrade](guides/upgrade.md) |
| Follow an AI procedure | [Skills](skills/index.md) and [AGENTS.md](../AGENTS.md) |
| See what shipped when | [Changelog](history.md) |
| See what is planned | [Product direction](product-plan.md) |
| Contribute documentation | [Contributing](contributing.md) |

Generated OpenAPI lives at [`openapi.yaml`](openapi.yaml) (`GET /openapi.json` on a running API). It is produced by `pnpm gen:openapi` and is not translated.

Chinese editions use the same path with `.zh.md`.
