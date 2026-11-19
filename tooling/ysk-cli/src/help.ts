import { CAPABILITIES } from './add-capability.js';

export const HELP = `ysk-kit — generator for YSK Kit products (alias: yskk)

Usage:
  pnpm ysk-kit add module <kebab-name> [--prisma] [--web] [--no-web]
  pnpm ysk-kit add <capability>
  pnpm ysk-kit generate openapi
  pnpm ysk-kit upgrade [--dry-run]
  pnpm ysk-kit check agent
  pnpm ysk-kit check errors
  pnpm ysk-kit check docs-budget
  pnpm ysk-kit check logs [--file <jsonl>]
  pnpm ysk-kit check supply [--json] [--repo-only] [--online]
  pnpm ysk-kit doctor [--json]
  pnpm ysk-kit plan <kebab-slug> [--date YYYY-MM-DD] [--force] [--lean] [--full] [--zh]
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
      root + nested AGENTS.md over 24 KiB, docs-budget (README Unreleased
      length, new CHANGELOG phrases, lean-plan size, git-added QA PNGs),
      and (when present) a dest ysk-sidecar crate that is not an
      ICryptoPort adapter. Prints rule id + file:line.
      Exit 1 when anything matches.

  check docs-budget
      Fail on a README Unreleased cell over 800 characters, forbidden
      phrases between <!-- docs-budget-new --> and
      <!-- docs-budget-legacy --> in CHANGELOG, a plan: lean file over
      8 KiB, or a git-added docs/qa PNG. Also runs as check-agent rule
      docs-budget. Exit 1 when anything matches.

  check errors
      Scan application/ for throw new Error, apps/api for console.log
      (seed.ts allowlisted), and logger/JSON.stringify(process.env).
      Prints rule id + file:line. Exit 1 when anything matches.

  check logs [--file <jsonl>]
      Validate captured Pino JSON lines (stdin or --file): secret
      literals, ERROR lines missing requestId/reqId, INTERNAL counts.
      Exit 1 on secret leak or missing requestId. Not for pretty/dev logs.

  check supply [--json] [--repo-only] [--online]
      Inventory third-party runtimes and pins (Node, PHP, kernel,
      engines, composer, lockfile IOCs, Actions SHA, compose tags)
      against the vendored advisory catalog. Exit 1 on high/critical
      findings. Kernel reminders are warnings and do not fail.
      --json        Print { ok, catalogUpdated, inventory, findings }
      --repo-only   Skip host PHP and kernel; still check CLI Node
      --online      Run pnpm audit --json and honor ignoreGhsas

  plan <slug> [--date YYYY-MM-DD] [--force] [--lean] [--full] [--zh]
      Write docs/plans/<date>-<slug>.md from the lean English template
      (plan: lean; six sections) plus a gitignored root plan.md pointer.
      --full uses the 19-section template (plan: full). --zh writes the
      Chinese pair. --lean and --full cannot be used together. Slug must
      be kebab-case. --date defaults to today. --force overwrites.

  plan --check <file>
      If the file has plan: lean, require lean headings; otherwise
      require full headings (including unmarked and old plans). Missing
      headings fail. Empty bodies and none / n/a / nil / no / 沒有 /
      不適用 pass. Exit 1 on failure.

  doctor [--json]
      Check a generated product: Node and pnpm versus engines, required
      env vars, insecure defaults (JWT_SECRET placeholder or shorter than
      32 characters), database reachability and applied Prisma migrations,
      guardrail files versus \`ysk-kit upgrade\`, \`check agent\`,
      \`check errors\` (warnings), and Node versus the supply catalog
      runtime floor.
      Warnings stay on exit 0. Exit 1 when any check is an error.
      --json   Print { ok, errors, warnings, checks } and no secret values.

Environment:
  YSK_ROOT    Product root to patch (default: this repository)

After add module / add capability:
  pnpm db:migrate && pnpm gen:openapi && pnpm layers && pnpm typecheck && pnpm test && pnpm ysk-kit check agent && pnpm ysk-kit check errors && pnpm ysk-kit check docs-budget

Manual: docs/cli/ysk-kit.md
Chinese: docs/cli/ysk-kit.zh.md
`;
