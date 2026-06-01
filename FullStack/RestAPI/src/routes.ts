import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes.js';
import chatRoutes from './modules/chat/chat.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import { prisma } from './lib/prisma.js';
import { env } from './config/env.js';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     description: |
 *       Cek status server + dependency:
 *       - database (PostgreSQL ping)
 *       - ai_service (HTTP GET ke AI Service /health, timeout 3 detik)
 *
 *       Status code 200 kalau semua "ok", 503 kalau ada yang "down".
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
 *                     ai_service: { type: string, example: "ok" }
 *       503:
 *         description: Server unhealthy
 */
router.get('/health', async (_req, res) => {
  let dbStatus: 'ok' | 'down' = 'ok';
  let aiStatus: 'ok' | 'down' = 'ok';

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'down';
  }

  try {
    const aiRes = await fetch(`${env.AI_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!aiRes.ok) aiStatus = 'down';
  } catch {
    aiStatus = 'down';
  }

  const allOk = dbStatus === 'ok' && aiStatus === 'ok';
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'unhealthy',
    uptime: Math.floor(process.uptime()),
    checks: {
      database: dbStatus,
      ai_service: aiStatus,
    },
  });
});

router.use('/auth', authRoutes);
router.use(chatRoutes);
router.use('/admin', adminRoutes);

export default router;
