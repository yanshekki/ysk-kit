# ADR 0002: Polyglot clients stay behind OpenAPI

Language: [中文](0002-polyglot-clients.zh.md) · English

- Status: accepted
- Date: 2026-10-13

## Context

YSK Kit’s living stack is TypeScript: `@ysk-kit/contracts` → hexagonal `apps/api` (Express default, Fastify via `HTTP_ADAPTER`) → `@ysk-kit/sdk` / `@ysk-kit/web-sdk` → Vite web/admin, Expo mobile, Electron desktop. Hard rules keep Prisma in API infra, JSON on `{ ok, data }` / `{ ok, error }`, and kit clients on the SDK. `pnpm layers`, `ysk-kit check agent`, and `ysk-kit doctor` enforce that graph.

Products sometimes want a native UI (Swift, Kotlin, Flutter, Tauri) or a non-TypeScript worker (Rust crypto, Python ML). The existing `php-bridge` flavor already emits OpenAPI plus envelope-aware TypeScript and PHP clients without copying the API. The risk is a second domain: the same tenancy, billing, or membership rules rewritten in Python, Rust, or C++.

This decision records the polyglot boundary. It does not add Tauri, Flutter, Kotlin Multiplatform, extra `gen:client` languages, or a second HTTP server.

## Options

### 1. TypeScript clients only, forever

Keep Expo and Electron as the only client story. Non-TS callers use raw HTTP against OpenAPI with no kit help.

- Lowest maintenance. Skills, zinc tokens, and CI stay one language.
- Blocks teams that already ship PHP, Swift, or Kotlin and only need an envelope-aware client.
- Ignores the `php-bridge` pattern that already works.

### 2. Sibling domain in another language

Stand up FastAPI, Axum, or a C++ service that re-implements product rules next to `apps/api`.

- Looks like a “polyglot monorepo”.
- Authz, tenancy, and envelope handling drift. `pnpm layers` cannot see the second tree.
- Contradicts contract-first law: `@ysk-kit/contracts` would stop being the only source.

### 3. OpenAPI + envelope as the sole boundary (chosen)

Default stack stays TypeScript. Optional non-TS clients are flavors or codegen that consume `docs/openapi.yaml` and unwrap the envelope. Workers in Rust (or a narrow C++ addon) implement ports behind composition; they do not own membership or billing rules. Python is an ML sidecar, not the product API.

## Decision

**OpenAPI (from `@ysk-kit/contracts`) plus the JSON envelope is the only polyglot HTTP boundary.**

- The default product stack stays TypeScript: Node 26 API, Vite web/admin, Expo, Electron.
- Kit TypeScript clients still use `@ysk-kit/sdk` / `@ysk-kit/web-sdk`. Hard rules 4, 5, 6, 9, and 10 do not loosen. `pnpm layers`, `check agent`, and `doctor` stay required.
- Do not copy domain or business rules into Python, Rust, or C++. Those languages may wrap adapters behind ports (crypto, codecs, ML infer) that `application/` calls.
- Optional non-TS HTTP clients follow `php-bridge`: emit OpenAPI + an envelope-aware generated client. Do not copy Prisma, jobs, or `application/`.
- Rust belongs as a worker or crypto adapter behind a port (HTTP or, on the internal network only, gRPC). It is not a second public API.
- Defer FastAPI (or Axum) as the main API. Defer Tauri, Flutter, and Kotlin Multiplatform flavors until a real product asks.
- Public, webhook, mobile, and partner traffic stay REST + envelope. Do not add a public gRPC API for “polyglot”.

### Phased roadmap (docs in this change; runtime later)

| Phase | Work | Not in this change |
|---|---|---|
| 0 — docs | This ADR, flavors language-choice table, architecture pointer | Runtime |
| 1 — codegen | Extra OpenAPI client targets (for example Python + Swift or Kotlin), golden envelope fixtures | Second API server |
| 2 — optional flavors | `desktop-tauri` and one of Flutter or KMP when a customer pays for it | Two native UI stacks at once |
| 3 — only with evidence | Sibling FastAPI as main API; hexagonal domain moved to Rust; C++ as a default path | Almost never |

## Consequences

- Agents choose language with [flavors](../guides/flavors.md) (`php-bridge` today; future client flavors), not by forking `application/`.
- A generated PHP, Swift, or Dart client that skips envelope unwrap is a bug, same as a TypeScript `fetch('/v1/…')`.
- Adding Tauri, Flutter, KMP, or `gen:client --lang` needs its own plan, contracts (if any), and verification. This ADR does not authorise those trees.
- Express and Fastify remain the HTTP servers. Hono, Nest, Next, and Drizzle stay non-defaults ([ADR 0001](0001-ts-rest.md) for the ts-rest pin).
