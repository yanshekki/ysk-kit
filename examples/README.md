# Worked examples

Language: [中文](README.zh.md) · English

Ten product systems you can scaffold from YSK Kit. Each example is an **overlay** plus a bilingual step-by-step tutorial. The living kit does not mount these industry routes. You apply an example onto a **new product directory**.

## Catalogue

| # | Slug | System | Scaffold | Status | Tutorial |
|---|---|---|---|---|---|
| 01 | `clinic-booking` | Clinic / consultancy booking | saas thin, sqlite | Available | [EN](clinic-booking/tutorial.md) · [中文](clinic-booking/tutorial.zh.md) |
| 02 | `crm-contacts` | CRM contacts and follow-ups | saas thin | Available | [EN](crm-contacts/tutorial.md) · [中文](crm-contacts/tutorial.zh.md) |
| 03 | `inventory-stock` | Stock in / out | saas thin | Available | [EN](inventory-stock/tutorial.md) · [中文](inventory-stock/tutorial.zh.md) |
| 04 | `helpdesk-tickets` | Support tickets | saas thin + team | Available | [EN](helpdesk-tickets/tutorial.md) · [中文](helpdesk-tickets/tutorial.zh.md) |
| 05 | `membership-club` | Membership subscription | saas thin + team + billing | Available | [EN](membership-club/tutorial.md) · [中文](membership-club/tutorial.zh.md) |
| 06 | `course-enrollment` | Course enrolment | saas thin | Available | [EN](course-enrollment/tutorial.md) · [中文](course-enrollment/tutorial.zh.md) |
| 07 | `invoice-quotes` | Quotes | saas thin | Available | [EN](invoice-quotes/tutorial.md) · [中文](invoice-quotes/tutorial.zh.md) |
| 08 | `event-rsvp` | Event RSVP | saas thin | Available | [EN](event-rsvp/tutorial.md) · [中文](event-rsvp/tutorial.zh.md) |
| 09 | `job-board` | Job board | saas thin | Available | [EN](job-board/tutorial.md) · [中文](job-board/tutorial.zh.md) |
| 10 | `field-work-orders` | Field work orders | saas thin + mobile + push | Available | [EN](field-work-orders/tutorial.md) · [中文](field-work-orders/tutorial.zh.md) |

Gateway, php-bridge, trading, and static-web3 already have flavor manuals under `docs/guides/flavors.md`. They are not duplicated here.

## Apply

From the kit checkout:

```bash
pnpm --filter @ysk-kit/examples start apply clinic-booking --dest ~/Projects/my-clinic --yes
```

Default destination (gitignored via `.runs/`): `examples/.runs/<slug>/`. Pass `--force` to replace a previous run. `--db sqlite|mysql|postgresql` overrides `spec.json`. `--skip-install` and `--skip-verify` are for generator tests.

The applicator:

1. Runs `create-ysk-app --yes` with the spec flavor, preset, database, and admin/mobile flags.
2. Runs `ysk-kit add` for each capability (`team` before `billing` when both appear).
3. Runs `ysk-kit add module` for each module.
4. Copies `overlay/` onto the destination, replaces Prisma models the generator already inserted, and applies `patches.json` exact string replacements when that file exists.
5. Installs, generates the client, `db push` (sqlite) or migrate (MySQL/Postgres), seeds, then `layers`, `typecheck`, `test`, `gen:openapi`, and `ysk-kit check agent`.

Command reference: [docs/cli/examples.md](../docs/cli/examples.md).

## Screenshots

```bash
pnpm --filter @ysk-kit/examples start capture clinic-booking
```

Starts the applied destination on API **13001** and web **15173**, walks the tutorial UI, and writes PNG files into `examples/<slug>/screenshots/`. For sqlite destinations, capture recreates `apps/api/dev.db` and re-seeds so the empty-list screenshot stays empty. Capture is a documentation tool; CI does not compare pixels.

Each available tutorial includes those screenshots plus the HTTP envelopes in `expected/`.

## Layout

```text
examples/<slug>/
  spec.json
  capture.json      # Playwright walk
  patches.json      # optional exact string replacements after overlay
  tutorial.md
  tutorial.zh.md
  overlay/          # destination-relative files
  expected/         # envelope JSON and visible strings
  screenshots/      # 1280×800 PNG
```

`examples/` is not a pnpm workspace member. Applied trees stay out of git.
