import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

export type { PrismaClient };

/** Living kit uses MariaDB/MySQL. create-ysk-app --db postgresql|sqlite replaces this file. */
export const createPrisma = (databaseUrl: string): PrismaClient => {
  const adapter = new PrismaMariaDb(databaseUrl);
  return new PrismaClient({ adapter });
};
