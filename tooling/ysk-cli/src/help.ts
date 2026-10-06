import { CAPABILITIES } from './add-capability';

export const HELP = `ysk-kit — generator for YSK Kit products (alias: yskk)

Usage:
  pnpm ysk-kit add module <kebab-name> [--prisma] [--web] [--no-web]
  pnpm ysk-kit add <capability>
  pnpm ysk-kit generate openapi
  pnpm ysk-kit upgrade [--dry-run]
  pnpm ysk-kit check agent
  pnpm ysk-kit doctor [--json]
  pnpm ysk-kit plan <kebab-slug> [--date YYYY-MM-DD] [--force]
  pnpm ysk-kit plan --check <file>

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
      receive generated agent skill wrappers. Does not touch apps,
      modules, product README, .env, or Prisma.
      --dry-run   List will copy / skip without writing

  check agent
      Scan the product root for typical broken patches: TypeScript enum,
      Prisma imports in web/admin/mobile/desktop, raw fetch in those
      apps, pointer files that dropped AGENTS.md, drifted skill copies,
      and root + nested AGENTS.md over 24 KiB. Prints rule id + file:line.
      Exit 1 when anything matches.

  plan <slug> [--date YYYY-MM-DD] [--force]
      Write docs/plans/<date>-<slug>.md and the Chinese pair from the
      bilingual template, plus a gitignored root plan.md pointer.
      Slug must be kebab-case. --date defaults to today. --force overwrites.

  plan --check <file>
      Verify a plan file has every required template heading and no
      required section is still placeholder-only. Exit 1 on failure.

  doctor [--json]
      Check a generated product: Node and pnpm versus engines, required
      env vars, insecure defaults (JWT_SECRET placeholder or shorter than
      32 characters), database reachability and applied Prisma migrations,
      guardrail files versus \`ysk-kit upgrade\`, and \`check agent\`.
      Warnings stay on exit 0. Exit 1 when any check is an error.
      --json   Print { ok, errors, warnings, checks } and no secret values.

Environment:
  YSK_ROOT    Product root to patch (default: this repository)

After add module / add capability:
  pnpm db:migrate && pnpm gen:openapi && pnpm layers && pnpm typecheck && pnpm test && pnpm ysk-kit check agent

Manual: docs/cli/ysk-kit.md
Chinese: docs/cli/ysk-kit.zh.md
`;
