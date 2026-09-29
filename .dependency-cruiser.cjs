/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'clients-no-server-infra',
      comment: 'web / admin / mobile / desktop must not import Prisma, Express, or API adapters.',
      severity: 'error',
      from: { path: '^apps/(web|admin|mobile|desktop)' },
      to: {
        path: '(^express|^fastify|^@prisma|packages/db-prisma|packages/api-express|packages/api-fastify|packages/auth|packages/jobs|packages/mail|packages/llm|packages/realtime|packages/push|packages/crypto|packages/apikey|@ysk/db-prisma|@ysk/api-express|@ysk/api-fastify|@ysk/logger|@ysk/auth|@ysk/observability|@ysk/jobs|@ysk/mail|@ysk/llm|@ysk/realtime|@ysk/push|@ysk/crypto|@ysk/apikey|bullmq|nodemailer|@aws-sdk|socket.io/|@socket.io/redis)',
      },
    },
    {
      name: 'api-no-react-ui',
      comment: 'apps/api must not import React or web UI packages.',
      severity: 'error',
      from: { path: '^apps/api' },
      to: { path: '(^react|^react-dom|@ysk/ui$|@ysk/web-sdk|packages/ui|packages/web-sdk)' },
    },
    {
      name: 'contracts-leaf',
      comment: 'contracts must not depend on apps or higher-layer packages.',
      severity: 'error',
      from: { path: '^packages/contracts' },
      to: {
        path: '^(apps/|packages/(sdk|ui|web-sdk|api-express|db-prisma|logger|application|ui-logic|config))',
      },
    },
    {
      name: 'sdk-ui-logic-no-node-react-prisma',
      comment: 'sdk and ui-logic stay React-free, Node-fs-free, and Prisma-free.',
      severity: 'error',
      from: { path: '^packages/(sdk|ui-logic)/' },
      to: { path: '(^react|^express|^@prisma|node:fs|node:path|@ysk/ui$|@ysk/web-sdk)' },
    },
    {
      name: 'domain-no-infra',
      comment: 'domain folders may not import Express, Prisma, or infra.',
      severity: 'error',
      from: { path: 'modules/.*/domain' },
      to: { path: '(express|fastify|@prisma|@ysk/db-prisma|/infra/)' },
    },
  ],
  options: {
    doNotFollow: { path: '(node_modules|dist)' },
    exclude: { path: '(^|/)dist/' },
    tsPreCompilationDeps: true,
    combinedDependencies: true,
    tsConfig: { fileName: 'tsconfig.base.json' },
  },
};
