import { CAPABILITIES } from './add-capability';

export const HELP = `ysk — generator for YSK Kit products

Usage:
  pnpm ysk add module <kebab-name> [--prisma] [--web] [--no-web]
  pnpm ysk add <capability>
  pnpm ysk generate openapi
  pnpm ysk upgrade [--dry-run]
  pnpm ysk check agent

Commands:
  add module <name>
      Scaffold one hexagonal HTTP slice: contract, DTO, memory + Prisma
      repositories, Express + Fastify handlers, SDK resource, web-sdk hooks,
      optional Vite page, and a memory-repo service test.
      --prisma   Merge a title/body/authorId Prisma model (off by default)
      --web      Write apps/web page (on by default)
      --no-web   Skip the Vite page
      Name must be kebab-case (booking, inventory-item). Path is /v1/<name>.

  add <capability>
      Merge a catalogued platform capability into the product root.
      Capabilities: ${CAPABILITIES.join(', ')}
      Alias: org → team
      billing requires team (Organization model) first.
      llm, team, billing, and push copy source trees when the product does
      not already wire them. A second run is a no-op.

  generate openapi
      Write docs/openapi.yaml from the ts-rest app contract.

  upgrade [--dry-run]
      Copy allowlisted guardrail files from this kit checkout into the
      product root (YSK_ROOT). Overwrites AGENTS.md, skills, TypeScript
      and Biome config, and dependency-cruiser. Workspace products also
      receive generated Cursor/Grok skill wrappers (gitignored). Does
      not touch apps, modules, product README, .env, or Prisma.
      --dry-run   List will copy / skip without writing

  check agent
      Scan the product root for typical broken patches: TypeScript enum,
      Prisma imports in web/admin/mobile/desktop, and raw fetch in those
      apps. Prints rule id + file:line. Exit 1 when anything matches.

Environment:
  YSK_ROOT    Product root to patch (default: this repository)

After add module / add capability:
  pnpm db:migrate && pnpm gen:openapi && pnpm layers && pnpm typecheck && pnpm test && pnpm ysk check agent

Manual: docs/cli/ysk.md
Chinese: docs/cli/ysk.zh.md
`;
