---
plan: lean
---

# Plan: {{title}}

| | |
|---|---|
| **Slug** | `{{slug}}` |
| **Date** | {{date}} |
| **Status** | draft |
| **Canonical file** | `docs/plans/{{date}}-{{slug}}.md` |

Law: [AGENTS.md](../../AGENTS.md). Procedure: [plan-feature](../skills/plan-feature.md). Check: `pnpm ysk-kit plan --check docs/plans/{{date}}-{{slug}}.md`. After `/compact`, re-read only Decision.

## Decision

What we will do and why. At most 15 lines.

## Files

Paths to add or change. Reuse existing modules, contracts, and generators when they already fit.

## Tests

In-memory ports. Given / when / then. Out of scope.

## Risks

What can go wrong, and how to revert.

## Done

Commands and the expected one-line result.

## Open questions

Unresolved items. `none` is fine.
