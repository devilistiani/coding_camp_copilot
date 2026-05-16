import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

// Singleton untuk hindari multiple connection di hot-reload (tsx watch)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isDev ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.isDev) globalForPrisma.prisma = prisma;
