import { PrismaClient } from '@/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    // During build time, return a mock that will throw on any actual use
    // This allows the build to complete without a database connection
    if (process.env.NODE_ENV === 'production' && !process.env.NEXT_RUNTIME) {
      // We're in build phase, return a proxy that will throw on use
      return new Proxy({} as PrismaClient, {
        get() {
          throw new Error('DATABASE_URL is not set. This is likely a build-time error.');
        }
      });
    }
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
}

// Lazy initialization - only create client when first accessed
let prismaInstance: PrismaClient | undefined;

function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = globalForPrisma.prisma ?? createPrismaClient();
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaInstance;
    }
  }
  return prismaInstance;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = getPrismaClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});

export default prisma;
