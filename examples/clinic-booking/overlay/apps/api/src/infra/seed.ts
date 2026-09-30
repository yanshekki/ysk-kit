import { hashPassword } from '@ysk-kit/auth';
import { createPrisma } from './create-prisma';

export const assertSeedAllowed = (env: NodeJS.ProcessEnv = process.env): void => {
  if (env.NODE_ENV === 'production' && env.ALLOW_SEED !== '1') {
    throw new Error('Refusing to seed when NODE_ENV=production (set ALLOW_SEED=1)');
  }
};

export type SeedAccount = {
  email: string;
  password: string;
  role: 'ADMIN' | 'USER';
  displayName: string;
};

export const resolveSeedAccounts = (
  env: NodeJS.ProcessEnv = process.env,
): readonly SeedAccount[] => [
  {
    email: env.SEED_ADMIN_EMAIL ?? 'admin@ysk.hk',
    password: env.SEED_ADMIN_PASSWORD ?? 'ysk-admin-dev',
    role: 'ADMIN',
    displayName: 'Admin',
  },
  {
    email: env.SEED_USER_EMAIL ?? 'user@ysk.hk',
    password: env.SEED_USER_PASSWORD ?? 'ysk-user-dev',
    role: 'USER',
    displayName: 'User',
  },
];

export const runSeed = async (env: NodeJS.ProcessEnv = process.env): Promise<void> => {
  assertSeedAllowed(env);
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required');
  const prisma = createPrisma(databaseUrl);
  try {
    const accounts = resolveSeedAccounts(env);
    for (const account of accounts) {
      const passwordHash = await hashPassword(account.password);
      await prisma.user.upsert({
        where: { email: account.email },
        create: {
          email: account.email,
          displayName: account.displayName,
          role: account.role,
          status: 'ACTIVE',
          passwordHash,
        },
        update: {
          displayName: account.displayName,
          role: account.role,
          status: 'ACTIVE',
          passwordHash,
        },
      });
    }
    const adminEmail = accounts[0]?.email;
    const admin = adminEmail
      ? await prisma.user.findUnique({ where: { email: adminEmail } })
      : null;
    if (admin) {
      const existing = await prisma.appointment.count({ where: { authorId: admin.id } });
      if (existing === 0) {
        await prisma.appointment.createMany({
          data: [
            {
              patientName: 'Wong Mei Ling',
              phone: '+85261112222',
              startsAt: new Date(Date.now() + 24 * 3600_000),
              durationMin: 30,
              status: 'SCHEDULED',
              authorId: admin.id,
            },
            {
              patientName: 'Lee Ka Ming',
              phone: '+85263334444',
              startsAt: new Date(Date.now() + 48 * 3600_000),
              durationMin: 45,
              status: 'SCHEDULED',
              authorId: admin.id,
            },
          ],
        });
      }
    }
    console.log(`seeded ${accounts.map((account) => account.email).join(', ')}`);
  } finally {
    await prisma.$disconnect();
  }
};

const isCli = process.argv.some((arg) => /[/\\]infra[/\\]seed\.(ts|js)$/.test(arg));
if (isCli) {
  void runSeed().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
