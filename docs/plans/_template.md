# Plan: {{title}}

Language: Chinese pair `{{date}}-{{slug}}.zh.md` · English `{{date}}-{{slug}}.md`

| | |
|---|---|
| **Slug** | `{{slug}}` |
| **Date** | {{date}} |
| **Status** | draft |
| **Canonical file** | `docs/plans/{{date}}-{{slug}}.md` |
| **Session pointer** | `/plan.md` (gitignored) |

Law: [AGENTS.md](../../AGENTS.md). Procedure: [plan-feature](../skills/plan-feature.md).

## Goal and user problem

What outcome the user needs, and why the current tree does not provide it.

## Scope

- In:

## Non-goals

- Out:

## Affected flavors / presets / capabilities

| Axis | Value | Notes |
|---|---|---|
| Flavor | saas / desktop / gateway / trading / static-web3 / php-bridge / kit itself | |
| Preset | thin / full / n/a | |
| Capabilities | auth, team, billing, llm, push, … | |

## Contracts first

DTO names, fields, error codes, and ts-rest paths. Add `OkSchema` / `ErrSchema` before handlers.

| Item | Name / path | Notes |
|---|---|---|
| DTO | | |
| Command | | |
| Error codes | reuse existing unless a new code is justified | |
| Paths | `/v1/…` | |

## Data model / Prisma and migrations

Models, fields, relations. Prisma stays in `apps/api/src/modules/*/infra`. Note whether `pnpm db:migrate` is required.

## Module slices and layers

Which `apps/api/src/modules/<name>/{domain,application,infra}` files change. Domain and application stay free of Express, Fastify, Prisma, React, and BullMQ.

## SDK / web-sdk / client surfaces

`packages/sdk` resources, `packages/web-sdk` hooks, and web / admin / mobile / desktop screens. No raw `fetch`. No Prisma in clients.

## Jobs / mail / realtime / notifications

Queue names, mail templates, socket events, in-app notifications — or “none”.

## Security and privacy

Authz (role / permission), rate limits, secrets (never log OTP, Stripe `sk_`, webhook secrets), personal data.

## Test plan

In-memory ports only. Do not start Redis, Stripe, Twilio, FCM, Jaeger, or Grafana.

- [ ] Memory-repo service cases
- [ ] Envelope / error-code cases
- [ ] Client hooks only via SDK (if UI changed)

## Verification commands

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

Optional: `pnpm lint`. `pnpm e2e` when login or shell changed and ports 3001/5173 are free. On Grok Build: `grok inspect`.

## Docs / changelog / changeset

- [ ] `docs/skills/` or recipe if the procedure changed
- [ ] `CHANGELOG.md` / `CHANGELOG.zh.md` and README latest-three window
- [ ] Changeset for publishable packages

## Risks and rollback

What can go wrong, and how to revert (migration down, revert commit, leave capability unmounted).

## Task checklist

Ordered. Each item has acceptance criteria.

1. [ ] Contracts — *acceptance:* DTO + `OkSchema` / `ErrSchema` exist; no TypeScript `enum`
2. [ ] Scaffold — *acceptance:* `ysk-kit add module` / `add <capability>` used when applicable
3. [ ] Application rules — *acceptance:* tests on memory ports pass
4. [ ] Clients — *acceptance:* SDK / web-sdk only
5. [ ] Verify — *acceptance:* the five commands above are green
6. [ ] Docs — *acceptance:* EN + zh pairs match

## Open questions

- 
