# ADR 0001: ts-rest pin and exit

Language: [中文](0001-ts-rest.zh.md) · English

- Status: accepted
- Date: 2026-10-01

## Context

`@ysk-kit/contracts` depends on `@ts-rest/core` at the exact version `3.53.0-rc.1` (`packages/contracts/package.json`). That build was published on 2 June 2025. The newest stable release, `3.52.1`, was published on 4 March 2025. The GitHub release list for `ts-rest/ts-rest` still ends at `v3.53.0-rc.1` (2 June 2025). As of 1 October 2026 there has been no newer release.

[ts-rest/ts-rest#859](https://github.com/ts-rest/ts-rest/issues/859) (opened 20 November 2025, still open, last comment 16 September 2026) asks whether the project is maintained. Maintainers have not answered on that issue. Commenters report no reply on GitHub or Discord and describe moving to oRPC, Hono with a Zod OpenAPI plugin, or Fastify plus a Zod type provider.

This repository's runtime use of the package is narrow:

- Every contract file calls `initContract()` from `@ts-rest/core` and builds plain objects: `{ method, path, body?, query?, pathParams?, responses, summary? }`.
- `@ysk-kit/api-http` flattens that shape and mounts it on Express and Fastify. Those adapters do not import `@ts-rest/express` or `@ts-rest/fastify`.
- OpenAPI is `z.toJSONSchema` in `packages/api-http/src/openapi.ts`. The kit does not depend on `@ts-rest/open-api`.
- `@ysk-kit/sdk` is hand-written resources. The kit does not call ts-rest `initClient`.

`initContract` is the only import. The HTTP stack already treats the router as a structural type (`ContractRoute` in `packages/api-http/src/flatten.ts`).

AGENTS.md keeps Express 5 as the default HTTP server and Fastify 5 as the second adapter. Hono, Nest, and Next are not defaults. Zod in this repo is 4.

## Options

### 1. Keep the pin

Stay on `3.53.0-rc.1` with an exact dependency (no `^`).

- The current code runs, and the surface we call has been stable since the pin.
- An unmaintained release candidate receives no security or Zod 4 fixes. The blast radius today is the contract builder, not the HTTP server.
- A later `pnpm update` must not widen the range by accident.

### 2. Fork or vendor

Copy `@ts-rest/core` into this repo, or publish a fork.

- A fork gives us a place to patch the release candidate.
- The published package is about 518 kB. We call one function. Vendoring the whole tarball means owning code we do not execute.
- Publishing a fork needs an npm package and a maintainer. That is an owner action, not a drop-in change.
- Doing it now rewrites the lockfile and every `initContract` import for little runtime gain.

### 3. Migrate to oRPC

oRPC is contract-first, speaks OpenAPI, and was still shipping releases through 2026. People leaving ts-rest name it as the closest replacement.

- It replaces the router object, both adapters' assumptions, the `ysk-kit add module` templates, the worked-example overlays, and the hand-written SDK.
- That is a major version of `@ysk-kit/contracts` and of every generated product.
- oRPC's client is a different call shape from `@ysk-kit/sdk` resources. We would either adopt that client or keep the hand-written SDK and only use oRPC as another object builder, which repeats option 4's smaller move at a higher cost.

### 4. Migrate to zod-openapi or a Hono-style router

`@hono/zod-openapi` (and Fastify's Zod type provider) are maintained and emit OpenAPI from Zod. Hono is a common landing place for former ts-rest users who want REST rather than an RPC client.

- Making Hono the HTTP server contradicts the Express / Fastify decision in [architecture](../architecture.md).
- Using a Hono router only as a spec generator, while Express still serves traffic, adds a second contract dialect.
- This kit already turns Zod 4 schemas into OpenAPI with `z.toJSONSchema`. The missing piece is the small router object, which we can own.

## Decision

Short term: keep `@ts-rest/core@3.53.0-rc.1`.

- The dependency stays exact. `packages/contracts/src/ts-rest-pin.test.ts` fails if `package.json` or the resolved tarball moves off that version.
- Do not add `@ts-rest/express`, `@ts-rest/fastify`, `@ts-rest/open-api`, or `initClient`. Those packages would deepen the coupling to an unmaintained tree. OpenAPI stays on Zod 4 inside `@ysk-kit/api-http`.
- Do not fork or vendor in this change. The executed surface is one function, and a fork needs a published package.

v2 path: replace `initContract` with an in-tree `defineContract` that returns the same plain router the adapters already walk, then delete `@ts-rest/core`. Templates (`ysk-kit add module`, capability overlays, worked examples) switch in the same major. `@ysk-kit/sdk` stays hand-written resources.

Revisit oRPC only if that major also wants a generated client. Until then, oRPC and Hono are not the migration.

## Consequences

- CI fails when someone bumps or widens `@ts-rest/core` without editing this ADR and the pin test together.
- Generated products keep today's contract files. `ysk-kit doctor` and `flavor-smoke` do not need a new contract library.
- The supply-chain risk that remains is the pinned tarball itself. It is immutable on npm. The risk that is accepted is "no upstream bugfix", which the v2 in-tree builder removes.
- Express and Fastify stay the HTTP servers through that migration.
