# YSK Kit

YSK Limited 共用全端開發架構：合約先行，可選四端（API / Web / Admin / Mobile）。

Language: [English](README.md) · 中文

```bash
corepack enable
pnpm install
cp .env.example .env
docker compose up -d mysql
pnpm db:generate
pnpm db:migrate
pnpm dev
```
