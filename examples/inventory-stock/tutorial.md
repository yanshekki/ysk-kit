# Stock in / out

Language: [中文](tutorial.zh.md) · English

A thin SaaS product that tracks SKUs and stock movements. Two hexagonal modules, no extra capabilities.

Screenshots below are 1280×800, captured against an applied destination (API **13001**, web **15173**).

## 1. What you get

- Module `sku` at `GET/POST /v1/sku`.
- Module `stock-move` at `GET/POST /v1/stock-move`. An `OUT` or `ADJUST` that would make `qtyOnHand` negative is rejected.
- Web pages `/sku` and `/stock-move` (nav labels **Sku** and **StockMove**).
- Seed accounts `admin@ysk.hk` / `ysk-admin-dev` (SKU `WIDGET-1`, qty 10) and `user@ysk.hk` / `ysk-user-dev` (empty list).

![Sign in](screenshots/01-login.png)

**Expected:** the Sign in form. Title **Sign in**.

## 2. Who it is for, and how long it takes

Small warehouses and retail counters. About **20–30 minutes** the first time.

## 3. Prerequisites

- **Node 24** and **pnpm 12**
- A checkout of this kit
- Optional: Docker MySQL 8.4 if you override `--db mysql`

## 4. Why this flavor, preset, and database

| Choice | Value | Why |
|---|---|---|
| Flavor | `saas` | Web + API |
| Preset | `thin` | Fifteen-minute path |
| Database | sqlite in `spec.json` | No Docker |
| Admin / mobile | off | Desktop web is enough |

Industry stock does **not** mount on the living kit API.

## 5. Scaffold commands

```bash
pnpm --filter @ysk-kit/examples start apply inventory-stock --dest ~/Projects/my-stock --yes
```

Default destination: `examples/.runs/inventory-stock`. Pass `--force` to replace a previous run.

## 6. Modules and capabilities, and why that order

`spec.json` lists `sku` then `stock-move`. Capabilities are empty. Add the parent first so the child Prisma fragment can declare `sku Sku @relation(...)`.

`patches.json` shares one in-memory SKU repository between the two services.

## 7. Data model

**Sku:** `code` (unique per author), `name`, `qtyOnHand` (int ≥ 0).

**Stock-move:** `skuId`, `delta` (int > 0), `reason` `IN` \| `OUT` \| `ADJUST`.

Who can read/write: the signed-in user lists **their** rows.

## 8. Business rules

1. Duplicate `code` for the same author → `CONFLICT`.
2. `qtyOnHand < 0` on create → `VALIDATION_FAILED`.
3. `IN`: `qtyOnHand += delta`. `OUT`: `qtyOnHand -= delta`. `ADJUST`: `qtyOnHand = delta`.
4. `OUT` or `ADJUST` resulting in a negative quantity → `CONFLICT` (quantity unchanged).
5. Missing or foreign SKU → `NOT_FOUND`.
6. Missing session → `UNAUTHENTICATED`.

## 9. Overlay files versus the generator defaults

The generator still uses `title` / `body`. The overlay replaces DTOs, contracts, services, repos, HTTP tests, Prisma fragments, SDK, web-sdk, both pages, and seed. `app.ts` and `router.tsx` stay as the CLI patched them.

## 10. Seed data

| Email | Password | Role | SKUs |
|---|---|---|---|
| `admin@ysk.hk` | `ysk-admin-dev` | ADMIN | `WIDGET-1`, qty 10 |
| `user@ysk.hk` | `ysk-user-dev` | USER | none |

## 11. Start and sign in

```bash
cd ~/Projects/my-stock
pnpm dev
```

Sign in as `user@ysk.hk` / `ysk-user-dev`. Open **Sku** in the nav.

## 12. UI walkthrough

![Empty list](screenshots/02-empty.png)

**Expected:** empty state **No skus**.

Create code `WIDGET-2`, name `Box`, quantity `-1`.

![Invalid](screenshots/03-invalid.png)

**Expected:** an alert banner.

Set quantity to `10` and Create.

![Created](screenshots/04-created.png)

**Expected:** a row `WIDGET-2` with qty 10.

Open `/stock-move`, choose Sku **WIDGET-2**, reason **OUT**, delta `2`, Create.

![Stock move](screenshots/06-stock-move.png)

**Expected:** an `OUT` row. The SKU quantity is now 8.

## 13. HTTP walkthrough

**Expected** (`expected/create-ok.json`): HTTP **201** `{ "ok": true, "data": { "code": "WIDGET-2", "qtyOnHand": 10 } }`.

Quantity `-1` → HTTP **422** `VALIDATION_FAILED`.

`OUT` larger than on-hand → HTTP **409** `CONFLICT`.

No `Authorization` → HTTP **401** `UNAUTHENTICATED`.

## 14. Scalar `/docs`

![Scalar docs](screenshots/05-docs.png)

**Expected:** Scalar lists `GET`/`POST /v1/sku`. `GET /openapi.json` also lists `/v1/stock-move`.

## 15. Verify commands

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

**Expected:** all green.

## 16. Out of scope

- Mounting `sku` on the living kit
- Multi-warehouse, barcodes, or purchase orders

## 17. Next example

Support tickets (`helpdesk-tickets`) is the next worked system in the [examples index](../README.md).
