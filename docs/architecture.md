# YSK Kit architecture (v0.2)

This repo implements the saas skeleton.

## Rules

- `@ysk/contracts` is the only source of enums, DTOs, and error codes.
- Do not use TypeScript `enum`.
- web / admin / mobile talk to the API only through `@ysk/sdk`.
- `@ysk/ui-logic` must stay DOM-free.
- Prisma stays in api infra.
- Prisma enum literals must match contracts string unions.

```bash
pnpm ysk add module booking
```
