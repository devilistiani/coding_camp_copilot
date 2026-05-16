import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes.js';
import { prisma } from './lib/prisma.js';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     description: Cek status server & koneksi database. Dipakai monitoring & frontend untuk indicator API online.
 *     responses:
 *       200:
 *         description: Server healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "ok" }
 *                 uptime: { type: number, example: 12345 }
 *                 checks:
 *                   type: object
 *                   properties:
 *                     database: { type: string, example: "ok" }
 *       503:
 *         description: Server unhealthy
 */
router.get('/health', async (_req, res) => {
  let dbStatus: 'ok' | 'down' = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'down';
  }

  const overallStatus = dbStatus === 'ok' ? 'ok' : 'unhealthy';
  res.status(dbStatus === 'ok' ? 200 : 503).json({
    status: overallStatus,
    uptime: Math.floor(process.uptime()),
    checks: {
      database: dbStatus,
    },
  });
});

router.use('/auth', authRoutes);

export default router;
