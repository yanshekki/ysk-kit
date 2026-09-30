import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyThinPreset } from './thin';

export const DBS = ['mysql', 'postgresql', 'sqlite'] as const;
export type Db = (typeof DBS)[number];
export const FLAVORS = [
  'saas',
  'desktop',
  'gateway',
  'php-bridge',
  'trading',
  'static-web3',
] as const;
export type Flavor = (typeof FLAVORS)[number];
export const PRESETS = ['thin', 'full'] as const;
export type Preset = (typeof PRESETS)[number];

export type CreateAppOptions = {
  name: string;
  dest: string;
  kitRoot: string;
  flavor: string;
  db: Db;
  admin: boolean;
  mobile: boolean;
  preset: Preset;
};

const SKIP = new Set([
  'node_modules',
  'dist',
  '.git',
  '.turbo',
  'coverage',
  '.expo',
  '.DS_Store',
  'generated',
  'examples',
  '.runs',
  '.env',
  '.env.local',
  '.cursor',
  '.grok',
  '.idea',
  '.vscode',
  '.claude',
  '.codex',
]);

export const shouldSkipCopyEntry = (entry: string): boolean =>
  SKIP.has(entry) || (entry.startsWith('.env') && entry !== '.env.example');

const writeAgentStubs = (kitRoot: string, dest: string): void => {
  const templates = join(kitRoot, 'tooling/ysk-cli/templates/agent');
  const rule = join(templates, 'ysk-kit.mdc');
  const skillsDir = join(templates, 'skills');
  if (!existsSync(rule) || !existsSync(skillsDir)) {
    throw new Error('agent templates missing');
  }
  mkdirSync(join(dest, '.cursor/rules'), { recursive: true });
  cpSync(rule, join(dest, '.cursor/rules/ysk-kit.mdc'));
  for (const name of readdirSync(skillsDir)) {
    const skillDir = join(skillsDir, name);
    const src = join(skillDir, 'SKILL.md');
    if (!statSync(skillDir).isDirectory() || !existsSync(src)) continue;
    for (const tree of ['.grok/skills', '.cursor/skills'] as const) {
      const dir = join(dest, tree, name);
      mkdirSync(dir, { recursive: true });
      cpSync(src, join(dir, 'SKILL.md'));
    }
  }
};

const hasOpt = (argv: string[], name: string): boolean =>
  argv.includes(`--${name}`) || argv.some((arg) => arg.startsWith(`--${name}=`));

export type ParsedArgs = {
  name: string | undefined;
  flavor: string;
  db: Db;
  preset: Preset;
  admin: boolean;
  mobile: boolean;
  yes: boolean;
  explicit: {
    flavor: boolean;
    db: boolean;
    preset: boolean;
    noAdmin: boolean;
    noMobile: boolean;
  };
};

export const parseArgs = (argv: string[]): ParsedArgs => {
  const flavorFlag = argv.find((arg) => arg.startsWith('--flavor='))?.slice('--flavor='.length);
  const flavorIdx = argv.indexOf('--flavor');
  const flavor = flavorFlag ?? (flavorIdx >= 0 ? argv[flavorIdx + 1] : 'saas') ?? 'saas';
  const dbFlag = argv.find((arg) => arg.startsWith('--db='))?.slice('--db='.length);
  const dbIdx = argv.indexOf('--db');
  const db = (dbFlag ?? (dbIdx >= 0 ? argv[dbIdx + 1] : 'mysql')) as Db;
  const presetFlag = argv.find((arg) => arg.startsWith('--preset='))?.slice('--preset='.length);
  const presetIdx = argv.indexOf('--preset');
  const preset = (presetFlag ??
    (presetIdx >= 0 ? argv[presetIdx + 1] : 'thin') ??
    'thin') as Preset;
  const flags = new Set([
    'saas',
    'desktop',
    'gateway',
    'php-bridge',
    'trading',
    'static-web3',
    'mysql',
    'postgresql',
    'sqlite',
    'thin',
    'full',
    flavor,
    db,
    preset,
  ]);
  const positional = argv.filter((arg) => arg !== '-y' && !arg.startsWith('--') && !flags.has(arg));
  return {
    name: positional[0],
    flavor,
    db,
    preset,
    admin: !argv.includes('--no-admin'),
    mobile: !argv.includes('--no-mobile'),
    yes: argv.includes('--yes') || argv.includes('-y'),
    explicit: {
      flavor: hasOpt(argv, 'flavor'),
      db: hasOpt(argv, 'db'),
      preset: hasOpt(argv, 'preset'),
      noAdmin: argv.includes('--no-admin'),
      noMobile: argv.includes('--no-mobile'),
    },
  };
};

const copyTree = (from: string, to: string, kitRoot: string, skipApps: Set<string>): void => {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from)) {
    if (shouldSkipCopyEntry(entry)) continue;
    const source = join(from, entry);
    const dest = join(to, entry);
    const stat = statSync(source);
    if (stat.isDirectory()) {
      if (from === join(kitRoot, 'apps') && skipApps.has(entry)) continue;
      copyTree(source, dest, kitRoot, skipApps);
    } else {
      cpSync(source, dest);
    }
  }
};

const jaegerService = `  jaeger:
    image: jaegertracing/jaeger:2.21.0
    restart: unless-stopped
    ports:
      - "16686:16686"
      - "4318:4318"
  prometheus:
    image: prom/prometheus:v3.15.0
    restart: unless-stopped
    extra_hosts:
      - "host.docker.internal:host-gateway"
    ports:
      - "9090:9090"
    volumes:
      - ./deploy/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
  grafana:
    image: grafana/grafana:13.2.3
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_USER: admin
      GF_SECURITY_ADMIN_PASSWORD: admin
      GF_USERS_ALLOW_SIGN_UP: "false"
    volumes:
      - ./deploy/grafana/provisioning:/etc/grafana/provisioning:ro
      - ./deploy/grafana/dashboards:/var/lib/grafana/dashboards:ro
`;

const mysqlCompose = `services:
  mysql:
    image: mysql:8.4
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: ysk_kit
      MYSQL_USER: ysk
      MYSQL_PASSWORD: ysk
    ports:
      - "3306:3306"
    volumes:
      - ysk_kit_mysql:/var/lib/mysql
    command: ["--default-authentication-plugin=mysql_native_password", "--character-set-server=utf8mb4", "--collation-server=utf8mb4_unicode_ci"]
  redis:
    image: redis:8.10-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
${jaegerService}
volumes:
  ysk_kit_mysql:
`;

const pgCompose = `services:
  postgres:
    image: postgres:18-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ysk_kit
      POSTGRES_USER: ysk
      POSTGRES_PASSWORD: ysk
    ports:
      - "5432:5432"
    volumes:
      - ysk_kit_pg:/var/lib/postgresql/data
  redis:
    image: redis:8.10-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
${jaegerService}
volumes:
  ysk_kit_pg:
`;

const sqliteCompose = `services:
  redis:
    image: redis:8.10-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
${jaegerService}`;

const pgCreatePrisma = `import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

export type { PrismaClient };

export const createPrisma = (databaseUrl: string): PrismaClient => {
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
};
`;

const sqliteCreatePrisma = `import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client';

export type { PrismaClient };

export const createPrisma = (databaseUrl: string): PrismaClient => {
  const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
  return new PrismaClient({ adapter });
};
`;

const rewritePrismaAdapter = (dest: string, db: Db): void => {
  const createPath = join(dest, 'apps/api/src/infra/create-prisma.ts');
  const pkgPath = join(dest, 'apps/api/package.json');
  if (!existsSync(createPath) || !existsSync(pkgPath)) return;
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
    dependencies: Record<string, string>;
  };
  delete pkg.dependencies['@prisma/adapter-mariadb'];
  if (db === 'postgresql') {
    pkg.dependencies['@prisma/adapter-pg'] = '7.10.0';
    pkg.dependencies.pg = '^8.16.3';
    writeFileSync(createPath, pgCreatePrisma);
  } else if (db === 'sqlite') {
    pkg.dependencies['@prisma/adapter-better-sqlite3'] = '7.10.0';
    writeFileSync(createPath, sqliteCreatePrisma);
  } else {
    pkg.dependencies['@prisma/adapter-mariadb'] = '7.10.0';
  }
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
};

export const createYskApp = (opts: CreateAppOptions): string => {
  if (!FLAVORS.includes(opts.flavor as Flavor)) {
    throw new Error(
      `flavor '${opts.flavor}' is not in this phase. Use --flavor saas, desktop, gateway, php-bridge, trading, or static-web3.`,
    );
  }
  if (!PRESETS.includes(opts.preset)) {
    throw new Error('--preset must be thin or full');
  }
  if (!['mysql', 'postgresql', 'sqlite'].includes(opts.db)) {
    throw new Error('--db must be mysql, postgresql, or sqlite');
  }
  const dest = resolve(opts.dest);
  if (existsSync(dest) && readdirSync(dest).length > 0) {
    throw new Error(`${dest} is not empty`);
  }
  if (opts.flavor === 'php-bridge') {
    return scaffoldPhpBridge(opts, dest);
  }

  const skipApps = new Set<string>();
  const includeAdmin = opts.flavor === 'gateway' || (opts.flavor === 'saas' && opts.admin);
  if (opts.flavor === 'desktop') {
    skipApps.add('web');
    skipApps.add('admin');
    skipApps.add('mobile');
  } else if (opts.flavor === 'gateway') {
    skipApps.add('web');
    skipApps.add('mobile');
    skipApps.add('desktop');
  } else if (opts.flavor === 'trading') {
    skipApps.add('admin');
    skipApps.add('mobile');
    skipApps.add('desktop');
  } else if (opts.flavor === 'static-web3') {
    skipApps.add('api');
    skipApps.add('admin');
    skipApps.add('mobile');
    skipApps.add('desktop');
  } else {
    if (!opts.admin) skipApps.add('admin');
    if (!opts.mobile) skipApps.add('mobile');
  }

  copyTree(opts.kitRoot, dest, opts.kitRoot, skipApps);
  rmSync(join(dest, 'tooling/create-ysk-app'), { recursive: true, force: true });
  writeAgentStubs(opts.kitRoot, dest);

  const pkgPath = join(dest, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { name: string; description?: string };
  pkg.name = opts.name;
  pkg.description = `${opts.name} — generated from YSK Kit ${opts.flavor} flavor`;
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

  const envLines =
    opts.flavor === 'static-web3'
      ? [
          'NODE_ENV=development',
          'API_PUBLIC_URL=http://localhost:3001',
          'WEB_PUBLIC_URL=http://localhost:5173',
          'ADMIN_PUBLIC_URL=http://localhost:5174',
        ]
      : [
          'NODE_ENV=development',
          'API_PORT=3001',
          'API_PUBLIC_URL=http://localhost:3001',
          'WEB_PUBLIC_URL=http://localhost:5173',
          includeAdmin ? 'ADMIN_PUBLIC_URL=http://localhost:5174' : '',
          'REDIS_URL=',
          'CRYPTO_MASTER_KEY=',
          opts.db === 'mysql'
            ? 'DATABASE_URL=mysql://ysk:ysk@localhost:3306/ysk_kit'
            : opts.db === 'postgresql'
              ? 'DATABASE_URL=postgresql://ysk:ysk@localhost:5432/ysk_kit'
              : 'DATABASE_URL=file:./dev.db',
          'JWT_SECRET=change-me-in-dev-only',
          'RATE_LIMIT_MAX=300',
          'RATE_LIMIT_WINDOW_MS=60000',
        ];
  writeFileSync(join(dest, '.env.example'), `${envLines.filter(Boolean).join('\n')}\n`);

  if (opts.flavor === 'static-web3') {
    writeFileSync(join(dest, 'docker-compose.yml'), '# static-web3: no local database\n');
  } else {
    writeFileSync(
      join(dest, 'docker-compose.yml'),
      opts.db === 'mysql' ? mysqlCompose : opts.db === 'postgresql' ? pgCompose : sqliteCompose,
    );
  }

  const schemaPath = join(dest, 'apps/api/prisma/schema.prisma');
  if (existsSync(schemaPath)) {
    let schema = readFileSync(schemaPath, 'utf8');
    const provider =
      opts.db === 'postgresql' ? 'postgresql' : opts.db === 'sqlite' ? 'sqlite' : 'mysql';
    schema = schema.replace(/provider\s*=\s*"mysql"/, `provider = "${provider}"`);
    if (opts.db === 'sqlite') {
      schema = schema.replace(/\s+@db\.[A-Za-z0-9(),]+/g, '');
    }
    writeFileSync(schemaPath, schema);
    rewritePrismaAdapter(dest, opts.db);
  }

  const usesCopyTree = opts.flavor !== 'php-bridge';
  if (opts.preset === 'thin' && usesCopyTree && opts.flavor !== 'static-web3') {
    applyThinPreset(dest);
  }

  writeProductReadme(dest, opts, includeAdmin);
  writeKitMarker(dest, opts);

  if (opts.flavor === 'static-web3') {
    writeFileSync(
      join(dest, 'WEB3.md'),
      `# static-web3

Language: [中文](WEB3.zh.md) · English

Vite web plus \`@ysk/config\` / \`@ysk/sdk\`. This product has no API.

- Point \`API_PUBLIC_URL\` at a remote Kit API if the UI needs one.
- Add wallet connect (viem, wagmi, or similar) in this product.
`,
    );
    writeFileSync(
      join(dest, 'WEB3.zh.md'),
      `# static-web3

Language: [English](WEB3.md) · 中文

Vite 前端，連同 \`@ysk/config\` / \`@ysk/sdk\`。此產品沒有 API。

- 若介面需要後端，將 \`API_PUBLIC_URL\` 指向一套遠端 Kit API。
- 錢包連線（viem、wagmi 等）寫在此產品內。
`,
    );
  }

  if (opts.flavor === 'trading') {
    writeFileSync(
      join(dest, 'TRADING.md'),
      `# Trading

Language: [中文](TRADING.zh.md) · English

API + web + worker skeleton. Market data, orders, and exchange connectors stay in this product.

- Run \`pnpm worker\` or PM2 \`ysk-worker\` (set \`REDIS_URL\` in production).
- Enqueue work with \`@ysk/jobs\`.
`,
    );
    writeFileSync(
      join(dest, 'TRADING.zh.md'),
      `# Trading

Language: [English](TRADING.md) · 中文

API、Web 與 worker 骨架。行情、下單與交易所連接器寫在此產品內。

- 執行 \`pnpm worker\` 或 PM2 \`ysk-worker\`（生產環境設定 \`REDIS_URL\`）。
- 用 \`@ysk/jobs\` 入列工作。
`,
    );
  }

  if (opts.flavor === 'gateway') {
    writeFileSync(
      join(dest, 'GATEWAY.md'),
      `# Gateway

Language: [中文](GATEWAY.zh.md) · English

This product has API + Admin (no public web, mobile, or desktop).

1. Create a user in Admin or \`POST /v1/auth/register\`.
2. Mint a machine token: \`POST /v1/me/api-keys\` with a JWT, then call the API with \`Authorization: Bearer ysk_live_…\`.
3. Run \`pnpm worker\` or PM2 \`ysk-worker\` (set \`REDIS_URL\` in production).
4. Optional: \`CRYPTO_MASTER_KEY\` (64 hex chars) for \`@ysk/crypto\`.
`,
    );
    writeFileSync(
      join(dest, 'GATEWAY.zh.md'),
      `# Gateway

Language: [English](GATEWAY.md) · 中文

此產品包含 API 與 Admin（沒有公開 Web、流動應用或桌面應用）。

1. 在 Admin 建立帳戶，或呼叫 \`POST /v1/auth/register\`。
2. 以 JWT 呼叫 \`POST /v1/me/api-keys\` 產生機器權杖，其後以 \`Authorization: Bearer ysk_live_…\` 呼叫 API。
3. 執行 \`pnpm worker\` 或 PM2 \`ysk-worker\`（生產環境設定 \`REDIS_URL\`）。
4. 可選：為 \`@ysk/crypto\` 設定 \`CRYPTO_MASTER_KEY\`（64 個十六進位字元）。
`,
    );
  }

  return dest;
};

const kitVersionOf = (kitRoot: string): string => {
  const pkg = JSON.parse(readFileSync(join(kitRoot, 'package.json'), 'utf8')) as {
    version: string;
  };
  return pkg.version;
};

const writeKitMarker = (dest: string, opts: CreateAppOptions): void => {
  const marker = {
    kit: 'ysk-kit',
    version: kitVersionOf(opts.kitRoot),
    flavor: opts.flavor,
    preset: opts.preset,
    db: opts.db,
  };
  writeFileSync(join(dest, '.ysk-kit.json'), `${JSON.stringify(marker, null, 2)}\n`);
};

const generatedFromEn = (opts: CreateAppOptions): string => {
  const version = kitVersionOf(opts.kitRoot);
  return `Generated from YSK Kit ${version} (\`${opts.flavor}\`, preset \`${opts.preset}\`).
Refresh guardrails: \`pnpm ysk upgrade\``;
};

const generatedFromZh = (opts: CreateAppOptions): string => {
  const version = kitVersionOf(opts.kitRoot);
  return `由 YSK Kit ${version} 產生（\`${opts.flavor}\`，preset \`${opts.preset}\`）。
更新護欄：\`pnpm ysk upgrade\``;
};

const writeProductReadme = (dest: string, opts: CreateAppOptions, includeAdmin: boolean): void => {
  const webLine =
    opts.flavor === 'saas' || opts.flavor === 'trading' || opts.flavor === 'static-web3'
      ? '- Web http://localhost:5173\n'
      : '';
  const adminLine = includeAdmin ? '- Admin http://localhost:5174\n' : '';
  const desktopLine =
    opts.flavor === 'desktop' ? '- Desktop: pnpm --filter @ysk/desktop start\n' : '';
  const webLineZh =
    opts.flavor === 'saas' || opts.flavor === 'trading' || opts.flavor === 'static-web3'
      ? '- Web http://localhost:5173\n'
      : '';
  const adminLineZh = includeAdmin ? '- Admin http://localhost:5174\n' : '';
  const desktopLineZh =
    opts.flavor === 'desktop' ? '- 桌面應用：pnpm --filter @ysk/desktop start\n' : '';
  const compose =
    opts.db === 'sqlite'
      ? ''
      : `docker compose up -d ${opts.db === 'postgresql' ? 'postgres' : 'mysql'}\n`;

  if (opts.flavor === 'static-web3') {
    writeFileSync(
      join(dest, 'README.md'),
      `# ${opts.name}

Language: [中文](README.zh.md) · English

${generatedFromEn(opts)}

\`\`\`bash
# Node 24 + pnpm 12
pnpm install
cp .env.example .env
pnpm --filter @ysk/web dev
\`\`\`

${webLine}
Documentation: [docs/README.md](docs/README.md).
`,
    );
    writeFileSync(
      join(dest, 'README.zh.md'),
      `# ${opts.name}

Language: [English](README.md) · 中文

${generatedFromZh(opts)}

\`\`\`bash
# Node 24 + pnpm 12
pnpm install
cp .env.example .env
pnpm --filter @ysk/web dev
\`\`\`

${webLineZh}
文件：[docs/README.zh.md](docs/README.zh.md)。
`,
    );
    return;
  }

  writeFileSync(
    join(dest, 'README.md'),
    `# ${opts.name}

Language: [中文](README.zh.md) · English

${generatedFromEn(opts)}

\`\`\`bash
# Node 24 + pnpm 12
pnpm install
cp .env.example .env
${compose}pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
\`\`\`

- API http://localhost:3001
${webLine}${adminLine}${desktopLine}
After seed, sign in as \`admin@ysk.hk\` / \`ysk-admin-dev\` (see \`.env.example\`).

Documentation: [docs/README.md](docs/README.md).
`,
  );
  writeFileSync(
    join(dest, 'README.zh.md'),
    `# ${opts.name}

Language: [English](README.md) · 中文

${generatedFromZh(opts)}

\`\`\`bash
# Node 24 + pnpm 12
pnpm install
cp .env.example .env
${compose}pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
\`\`\`

- API http://localhost:3001
${webLineZh}${adminLineZh}${desktopLineZh}
種子帳戶：\`admin@ysk.hk\` / \`ysk-admin-dev\`（見 \`.env.example\`）。

文件：[docs/README.zh.md](docs/README.zh.md)。
`,
  );
};

const copyDirReplace = (from: string, to: string, name: string): void => {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from)) {
    const source = join(from, entry);
    const dest = join(to, entry);
    if (statSync(source).isDirectory()) {
      copyDirReplace(source, dest, name);
      continue;
    }
    const raw = readFileSync(source, 'utf8');
    writeFileSync(dest, raw.replaceAll('__NAME__', name));
  }
};

const scaffoldPhpBridge = (opts: CreateAppOptions, dest: string): string => {
  const here = dirname(fileURLToPath(import.meta.url));
  const fromKit = join(opts.kitRoot, 'tooling/create-ysk-app/templates/php-bridge');
  const fromPkg = join(here, '../templates/php-bridge');
  const templates = existsSync(fromKit) ? fromKit : fromPkg;
  if (!existsSync(templates)) {
    throw new Error('php-bridge templates missing');
  }
  const slug =
    opts.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'app';
  copyDirReplace(templates, dest, slug);
  mkdirSync(join(dest, 'docs'), { recursive: true });
  const openapi = join(opts.kitRoot, 'docs/openapi.yaml');
  if (!existsSync(openapi)) {
    throw new Error('docs/openapi.yaml missing; run pnpm gen:openapi in the kit');
  }
  writeFileSync(join(dest, 'docs/openapi.yaml'), readFileSync(openapi));
  writeFileSync(
    join(dest, 'README.md'),
    `# ${opts.name}

Language: [中文](README.zh.md) · English

${generatedFromEn(opts)}

PHP and TypeScript clients generated from YSK Kit. Point them at an existing Kit API.

\`\`\`bash
# TypeScript
cd ts && node --experimental-strip-types
# PHP
cd php && composer dump-autoload
\`\`\`

\`YskClient\` / \`createClient\` unwrap \`{ ok, data }\` / \`{ ok, error }\`. Use \`request(method, path, body?)\` for any OpenAPI path. Set \`API_PUBLIC_URL\` (default http://localhost:3001).

See \`docs/openapi.yaml\`.
`,
  );
  writeFileSync(
    join(dest, 'README.zh.md'),
    `# ${opts.name}

Language: [English](README.md) · 中文

${generatedFromZh(opts)}

由 YSK Kit 產生的 PHP 與 TypeScript 客戶端。請指向一套現有的 Kit API。

\`\`\`bash
# TypeScript
cd ts && node --experimental-strip-types
# PHP
cd php && composer dump-autoload
\`\`\`

\`YskClient\` / \`createClient\` 會解開 \`{ ok, data }\` / \`{ ok, error }\`。其餘 OpenAPI 路徑用 \`request(method, path, body?)\`。設定 \`API_PUBLIC_URL\`（預設 http://localhost:3001）。

見 \`docs/openapi.yaml\`。
`,
  );
  writeKitMarker(dest, opts);
  return dest;
};
