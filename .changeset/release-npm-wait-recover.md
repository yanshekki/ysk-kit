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

Release waits up to 20 minutes (backoff, NPM_VIEW_WAIT_MS) for npm view after a successful upload and tags even when the packument lags. If the version is already on npm but vX.Y.Z or its GitHub Release is missing, recover the tag and notes without republishing.
