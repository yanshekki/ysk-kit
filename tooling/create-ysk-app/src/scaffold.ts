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

export type Db = 'mysql' | 'postgresql' | 'sqlite';
export const FLAVORS = [
  'saas',
  'desktop',
  'gateway',
  'php-bridge',
  'trading',
  'static-web3',
] as const;
export type Flavor = (typeof FLAVORS)[number];

export type CreateAppOptions = {
  name: string;
  dest: string;
  kitRoot: string;
  flavor: string;
  db: Db;
  admin: boolean;
  mobile: boolean;
};

const SKIP = new Set(['node_modules', 'dist', '.git', '.turbo', 'coverage', '.expo', '.DS_Store']);

export const parseArgs = (argv: string[]) => {
  const flavorFlag = argv.find((arg) => arg.startsWith('--flavor='))?.slice('--flavor='.length);
  const flavorIdx = argv.indexOf('--flavor');
  const flavor = flavorFlag ?? (flavorIdx >= 0 ? argv[flavorIdx + 1] : 'saas') ?? 'saas';
  const dbFlag = argv.find((arg) => arg.startsWith('--db='))?.slice('--db='.length);
  const dbIdx = argv.indexOf('--db');
  const db = (dbFlag ?? (dbIdx >= 0 ? argv[dbIdx + 1] : 'mysql')) as Db;
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
    flavor,
    db,
  ]);
  const positional = argv.filter((arg) => !arg.startsWith('--') && !flags.has(arg));
  return {
    name: positional[0],
    flavor,
    db,
    admin: !argv.includes('--no-admin'),
    mobile: !argv.includes('--no-mobile'),
  };
};

const copyTree = (from: string, to: string, kitRoot: string, skipApps: Set<string>): void => {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from)) {
    if (SKIP.has(entry)) continue;
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
    image: jaegertracing/all-in-one:1.76.0
    restart: unless-stopped
    environment:
      COLLECTOR_OTLP_ENABLED: "true"
    ports:
      - "16686:16686"
      - "4318:4318"
  prometheus:
    image: prom/prometheus:v3.13.3
    restart: unless-stopped
    extra_hosts:
      - "host.docker.internal:host-gateway"
    ports:
      - "9090:9090"
    volumes:
      - ./deploy/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
  grafana:
    image: grafana/grafana:13.2.2
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
    image: redis:7.4-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
${jaegerService}
volumes:
  ysk_kit_mysql:
`;

const pgCompose = `services:
  postgres:
    image: postgres:16-alpine
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
    image: redis:7.4-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
${jaegerService}
volumes:
  ysk_kit_pg:
`;

const sqliteCompose = `services:
  redis:
    image: redis:7.4-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
${jaegerService}`;

export const createYskApp = (opts: CreateAppOptions): string => {
  if (!FLAVORS.includes(opts.flavor as Flavor)) {
    throw new Error(
      `flavor '${opts.flavor}' is not in this phase. Use --flavor saas, desktop, gateway, php-bridge, trading, or static-web3.`,
    );
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
    writeFileSync(schemaPath, schema);
  }

  const webLine =
    opts.flavor === 'saas' || opts.flavor === 'trading' || opts.flavor === 'static-web3'
      ? '- Web http://localhost:5173\n'
      : '';
  const adminLine = includeAdmin ? '- Admin http://localhost:5174\n' : '';
  const desktopLine =
    opts.flavor === 'desktop' ? '- Desktop: pnpm --filter @ysk/desktop start\n' : '';
  const readmeBody =
    opts.flavor === 'static-web3'
      ? `# ${opts.name}

Generated from YSK Kit (\`static-web3\` flavor).

\`\`\`bash
corepack enable
pnpm install
cp .env.example .env
pnpm --filter @ysk/web dev
\`\`\`

${webLine}
See [docs/architecture.md](docs/architecture.md).
`
      : `# ${opts.name}

Generated from YSK Kit (\`${opts.flavor}\` flavor).

\`\`\`bash
corepack enable
pnpm install
cp .env.example .env
${opts.db === 'sqlite' ? '' : `docker compose up -d ${opts.db === 'postgresql' ? 'postgres' : 'mysql'}\n`}pnpm db:generate
pnpm db:migrate
pnpm dev
\`\`\`

- API http://localhost:3001
${webLine}${adminLine}${desktopLine}
See [docs/architecture.md](docs/architecture.md).
`;
  writeFileSync(join(dest, 'README.md'), readmeBody);

  if (opts.flavor === 'static-web3') {
    writeFileSync(
      join(dest, 'WEB3.md'),
      `# static-web3

Vite web + \`@ysk/config\` / \`@ysk/sdk\`. There is no API in this repo.

- Point \`API_PUBLIC_URL\` at a remote Kit API if the UI needs one.
- Add viem/wagmi/wallet connect in this product — not in YSK Kit.
`,
    );
  }

  if (opts.flavor === 'trading') {
    writeFileSync(
      join(dest, 'TRADING.md'),
      `# Trading

API + web + worker skeleton (AQTMS-shaped). Market data, orders, and exchange connectors stay in this product repo — not in YSK Kit.

- Run \`pnpm worker\` or PM2 \`ysk-worker\` (set \`REDIS_URL\` in production).
- Enqueue work with \`@ysk/jobs\`; do not add CCXT/Binance to the kit.
`,
    );
  }

  if (opts.flavor === 'gateway') {
    writeFileSync(
      join(dest, 'GATEWAY.md'),
      `# Gateway

This product has API + Admin (no public web/mobile/desktop).

1. Create a user in Admin or \`POST /v1/auth/register\`.
2. Mint a machine token: \`POST /v1/me/api-keys\` with a JWT, then call the API with \`Authorization: Bearer ysk_live_…\`.
3. Run \`pnpm worker\` or PM2 \`ysk-worker\` (set \`REDIS_URL\` in production).
4. Optional: \`CRYPTO_MASTER_KEY\` (64 hex chars) for \`@ysk/crypto\`.
`,
    );
  }

  return dest;
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

PHP/TS bridge generated from YSK Kit. Point these clients at an existing Kit API.

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
  return dest;
};
