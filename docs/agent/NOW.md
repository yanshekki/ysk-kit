# Agent memory

Read this first when starting work. Update it at the end **only** when locks or the in-progress list changed. Cap: about 150 lines. English only.

This kit is not a deployed product. Hosts and SHAs stay `unset`. Do not copy another product’s hosts, SHAs, brand sentences, or plan-status tables here.

## Official deploy

| Surface | Value |
|---|---|
| Official host | unset |
| Web SHA | unset |
| API SHA | unset |

## In progress

Max 3 dated plans (or none).

None.

## Frozen decisions

- Product domains stay out of this kit. Tutorials live in `examples/`.
- JSON stays on `{ ok, data }` / `{ ok, error }` except the four envelope exceptions in `AGENTS.md`.
- Lean plans are the default. `--full` is only for HTTP, Prisma, auth, secrets, webhooks, or a new envelope exception.
- Agent skill wrappers are four routers (`plan`, `implement`, `verify`, `review`). Full procedures stay in `docs/skills/`.
- This kit does not ship a `fund-protocol` file. Do not invent one here.

## Do not search

- `docs/qa/**/*.png`
- `docs/plans/` files older than 14 days, unless the user names them
