---
"@ysk-kit/api-express": patch
"@ysk-kit/api-fastify": patch
"@ysk-kit/api-http": patch
"@ysk-kit/apikey": patch
"@ysk-kit/application": patch
"@ysk-kit/auth": patch
"@ysk-kit/cli": patch
"@ysk-kit/config": patch
"@ysk-kit/contracts": patch
"@ysk-kit/create-app": patch
"@ysk-kit/crypto": patch
"@ysk-kit/db-prisma": patch
"@ysk-kit/domain-kernel": patch
"@ysk-kit/i18n": patch
"@ysk-kit/jobs": patch
"@ysk-kit/llm": patch
"@ysk-kit/logger": patch
"@ysk-kit/mail": patch
"@ysk-kit/observability": patch
"@ysk-kit/push": patch
"@ysk-kit/realtime": patch
"@ysk-kit/sdk": patch
"@ysk-kit/storage": patch
"@ysk-kit/ui": patch
"@ysk-kit/ui-logic": patch
"@ysk-kit/web-sdk": patch
---

Security: fail-safe Electron token storage (no plaintext disk fallback), renderer CSP / sandbox / navigation / IPC sender checks, pino redaction of secrets, server-owned LLM system prompts with a per-user quota (`RATE_LIMITED`), and Stripe webhook idempotency on `event.id`.
