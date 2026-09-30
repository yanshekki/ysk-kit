# Skill: fix layers

Language: [中文](fix-layers.zh.md) · English

`pnpm layers` failed. Read [hexagonal](../guides/hexagonal.md) and `.dependency-cruiser.cjs`. Law: [AGENTS.md](../../AGENTS.md).

## Steps

1. Read the cruiser rule name (`clients-no-server-infra`, `domain-no-infra`, `api-no-react-ui`, `contracts-leaf`, `sdk-ui-logic-no-node-react-prisma`).
2. Move the import, do not disable the rule.
3. Typical repairs:
   - Client needed data → call `@ysk-kit/sdk` / `@ysk-kit/web-sdk`.
   - Application needed Prisma → inject a port; implement in `infra/`.
   - Domain imported a router → drop it.
4. Re-run `pnpm layers`.
5. Continue with [verify-change](verify-change.md).
