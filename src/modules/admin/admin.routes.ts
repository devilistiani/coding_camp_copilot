import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import {
  listUsersQuerySchema,
  updateUserSchema,
  userIdParamSchema,
} from './admin.schema.js';

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List semua user (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search di email atau nama (case-insensitive)
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [aktif, nonaktif] }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [peserta, admin] }
 *     responses:
 *       200:
 *         description: Daftar user dengan pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string, format: uuid }
 *                           email: { type: string, format: email }
 *                           full_name: { type: string }
 *                           role: { type: string, enum: [peserta, admin] }
 *                           is_active: { type: boolean }
 *                           chat_count: { type: integer }
 *                           joined_at: { type: string, format: date-time }
 *                           updated_at: { type: string, format: date-time }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page: { type: integer }
 *                         limit: { type: integer }
 *                         total: { type: integer }
 *                         total_pages: { type: integer }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/users', validate(listUsersQuerySchema, 'query'), adminController.listUsers);

/**
 * @openapi
 * /admin/users/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update user (toggle is_active, rename, ubah role)
 *     description: |
 *       Update field user. Constraint:
 *       - Admin TIDAK BISA menonaktifkan akun sendiri
 *       - Admin TIDAK BISA mengubah role akun sendiri (lockout protection)
 *       - Saat user di-nonaktifkan, semua refresh token aktif akan dicabut otomatis
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Minimal salah satu field harus diisi
 *             properties:
 *               full_name: { type: string, minLength: 2, maxLength: 150 }
 *               is_active: { type: boolean }
 *               role: { type: string, enum: [peserta, admin] }
 *     responses:
 *       200:
 *         description: User berhasil diupdate
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: User tidak ditemukan
 */
router.patch(
  '/users/:id',
  validate(userIdParamSchema, 'params'),
  validate(updateUserSchema),
  adminController.updateUser,
);

/**
 * @openapi
 * /admin/users/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Hapus user permanen (cascade ke refresh_tokens + conversations + messages)
 *     description: |
 *       Hapus user permanen dari DB. Cascade:
 *       - Semua refresh_tokens di-delete
 *       - Semua conversations + messages di-delete
 *
 *       Admin TIDAK BISA menghapus akun sendiri.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: User berhasil dihapus
 *       400:
 *         description: Tidak bisa menghapus akun sendiri
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: User tidak ditemukan
 */
router.delete(
  '/users/:id',
  validate(userIdParamSchema, 'params'),
  adminController.deleteUser,
);

/**
 * @openapi
 * /admin/analytics/summary:
 *   get:
 *     tags: [Admin]
 *     summary: Ringkasan analitik untuk dashboard Streamlit
 *     description: |
 *       Endpoint agregasi data untuk dashboard analitik. Return:
 *       - User stats (total, aktif/nonaktif, per role, baru 7 hari)
 *       - Conversation stats (total, per status, baru hari ini & 7 hari)
 *       - Message stats (total, per sender, baru hari ini & 7 hari)
 *       - AI stats (avg confidence, top 10 kategori, distribusi urgensi)
 *       - Daily trend 30 hari terakhir (conversations + messages)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ringkasan analitik
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     generated_at: { type: string, format: date-time }
 *                     users:
 *                       type: object
 *                       properties:
 *                         total: { type: integer }
 *                         active: { type: integer }
 *                         inactive: { type: integer }
 *                         by_role:
 *                           type: object
 *                           properties:
 *                             peserta: { type: integer }
 *                             admin: { type: integer }
 *                         new_last_7_days: { type: integer }
 *                     conversations:
 *                       type: object
 *                       properties:
 *                         total: { type: integer }
 *                         new_today: { type: integer }
 *                         new_last_7_days: { type: integer }
 *                     messages:
 *                       type: object
 *                       properties:
 *                         total: { type: integer }
 *                         by_sender:
 *                           type: object
 *                           properties:
 *                             user: { type: integer }
 *                             ai: { type: integer }
 *                         new_today: { type: integer }
 *                         new_last_7_days: { type: integer }
 *                     ai:
 *                       type: object
 *                       properties:
 *                         avg_confidence: { type: number, nullable: true, example: 0.8423 }
 *                         by_category:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               category: { type: string }
 *                               count: { type: integer }
 *                         by_urgency:
 *                           type: object
 *                           properties:
 *                             low: { type: integer }
 *                             medium: { type: integer }
 *                             high: { type: integer }
 *                     daily_trend_last_30_days:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date: { type: string, example: "2026-05-29" }
 *                           conversations: { type: integer }
 *                           messages: { type: integer }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/analytics/summary', adminController.analyticsSummary);

export default router;
