# YSK Kit

YSK Limited 共用全端開發架構：合約先行、四端可選（API / Web / Admin / Mobile）。

Language: [中文](README.zh.md) · English

| | |
|---|---|
| **Version** | 0.1.0 |
| **License** | MIT |
| **Company** | [YSK Limited](https://ysk.hk/) |
| **Contact** | email@ysk.hk |

## What this is

A pnpm + Turborepo starter so a new product does not reinvent enums, DTOs, error codes, a typed HTTP client, UI rules without sharing DOM, Express + Prisma API, Vite web/admin, or Expo React Native.

Product domains stay out of this repo.

## Quick start

```bash
corepack enable
pnpm install
cp .env.example .env
docker compose up -d mysql
pnpm db:generate
pnpm db:migrate
pnpm dev
```

- API http://localhost:3001
- Web http://localhost:5173
- Admin http://localhost:5174

See [docs/architecture.md](docs/architecture.md).
