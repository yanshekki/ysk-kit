# Skill: add module

Language: [中文](add-module.zh.md) · English

Add a business HTTP resource. Follow [docs/recipes/add-module.md](../recipes/add-module.md). Law: [AGENTS.md](../../AGENTS.md).

## Steps

1. Pick a kebab-case name. Do not create folders by hand.
2. `pnpm ysk add module <name> --prisma --web` (or `--no-web` if there is no Vite app).
3. Extend DTO, command, and Prisma fields.
4. Put rules in `application/<name>-service.ts`.
5. Keep Prisma in `infra/`. Clients use `@ysk-kit/sdk` / `@ysk-kit/web-sdk` only.
6. `pnpm db:migrate && pnpm gen:openapi`.
7. [verify-change](verify-change.md).
