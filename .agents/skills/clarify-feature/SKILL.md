---
name: clarify-feature
description: >
  Ask at most five kit-native questions and fold the answers into the dated
  YSK Kit plan (Assumptions, Scope, Open questions) before approval.
  Use when Open questions are non-empty, the user asks to clarify, 澄清, 釐清,
  or /clarify-feature.
  中文：澄清、釐清、未決問題、批准前。
  Do not use to implement, to vendor Spec Kit or .specify/, or when Open
  questions are already empty.
---

Read `docs/skills/clarify-feature.md`. Law: `AGENTS.md`.

1. Read the dated plan pair. Ask only unanswered gaps, at most five: authz, tenancy, envelope, flavor/preset, UI surfaces.
2. Fold answers into Assumptions, Scope / Non-goals, and Open questions in both languages. Do not start contracts.
Gotcha: do not guess; do not create `.specify/`; do not paste Spec Kit.
Verify: `pnpm ysk-kit plan --check` on both dated files.
Full steps: `docs/skills/clarify-feature.md`.
