import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as chatController from './chat.controller.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/authenticate.js';
import {
  chatRequestSchema,
  conversationIdParamSchema,
  listConversationsQuerySchema,
  updateConversationSchema,
} from './chat.schema.js';

const router = Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.sub ?? req.ip ?? 'anonymous',
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Terlalu banyak chat. Tunggu sebentar.' },
  },
});

router.use(authenticate);

/**
 * @openapi
 * /chat:
 *   post:
 *     tags: [Chat]
 *     summary: Kirim pesan ke AI dan dapatkan respons
 *     description: |
 *       Endpoint utama chat. Flow:
 *       1. Kalau `conversation_id` tidak ada → backend create conversation baru otomatis (title auto-generated dari pertanyaan)
 *       2. User message disimpan ke DB
 *       3. Backend panggil AI service (mock atau real, tergantung env `AI_SERVICE_URL`)
 *       4. AI response disimpan ke DB sebagai message dari sender_type "ai"
 *       5. Return conversation + user_message + ai_message
 *
 *       **Note**: Admin dapat draft reply (Gemini), user biasa dapat klasifikasi saja.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatRequest'
 *     responses:
 *       200:
 *         description: Chat berhasil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: conversation_id tidak ditemukan
 *       429:
 *         $ref: '#/components/responses/RateLimited'
 *       503:
 *         description: AI service tidak tersedia
 */
router.post('/chat', chatLimiter, validate(chatRequestSchema), chatController.chat);

/**
 * @openapi
 * /predict:
 *   post:
 *     tags: [Chat]
 *     summary: Stateless predict (response flat untuk kompatibilitas frontend)
 *     description: |
 *       Endpoint shim untuk kompatibilitas frontend. Beda dengan /chat:
 *       - **Stateless**: gak save ke DB conversations/messages
 *       - **Response flat**: { answer, category, urgency, confidence, draft_reply?, sources? }
 *       - **Category di-map**: 4 kategori AI → 6 kategori UI (Jadwal/Materi/Teknis/Tugas/Umum/Akun)
 *
 *       Untuk integrasi dengan history & analytics, gunakan POST /chat.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question]
 *             properties:
 *               question: { type: string, minLength: 2, maxLength: 2000 }
 *     responses:
 *       200:
 *         description: Klasifikasi + draft reply
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer: { type: string }
 *                 category: { type: string, enum: [Jadwal, Materi, Teknis, Tugas, Umum, Akun] }
 *                 urgency: { type: string, enum: [low, medium, high] }
 *                 confidence: { type: number, example: 0.85 }
 *                 draft_reply: { type: string, description: "Admin only" }
 *                 sources: { type: array, items: { type: string } }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/RateLimited'
 *       503:
 *         description: AI service tidak tersedia
 */
router.post('/predict', chatLimiter, chatController.predict);

/**
 * @openapi
 * /conversations:
 *   get:
 *     tags: [Conversations]
 *     summary: List conversations milik user (atau semua untuk admin)
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
 *         name: mine
 *         schema: { type: boolean }
 *         description: |
 *           Default behaviour:
 *           - Peserta selalu cuma lihat conversation sendiri.
 *           - Admin tanpa flag = lihat SEMUA conversation.
 *           - Admin dengan `mine=true` = lihat conversation milik sendiri.
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: |
 *           Search keyword. Match di title; untuk admin (tanpa `mine=true`)
 *           juga match nama dan email user pemilik conversation.
 *     responses:
 *       200:
 *         description: Daftar conversation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListConversationsResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/conversations', validate(listConversationsQuerySchema, 'query'), chatController.listConversations);

/**
 * @openapi
 * /conversations/{id}:
 *   get:
 *     tags: [Conversations]
 *     summary: Detail conversation + semua messages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Conversation detail
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConversationDetailResponse'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Tidak ditemukan
 */
router.get(
  '/conversations/:id',
  validate(conversationIdParamSchema, 'params'),
  chatController.getConversation,
);

/**
 * @openapi
 * /conversations/{id}:
 *   patch:
 *     tags: [Conversations]
 *     summary: Update title conversation
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
 *             required: [title]
 *             properties:
 *               title: { type: string, minLength: 1, maxLength: 255 }
 *     responses:
 *       200:
 *         description: Updated
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Tidak ditemukan
 */
router.patch(
  '/conversations/:id',
  validate(conversationIdParamSchema, 'params'),
  validate(updateConversationSchema),
  chatController.updateConversation,
);

/**
 * @openapi
 * /conversations/{id}:
 *   delete:
 *     tags: [Conversations]
 *     summary: Hapus conversation (cascade delete messages)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Berhasil dihapus
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Tidak ditemukan
 */
router.delete(
  '/conversations/:id',
  validate(conversationIdParamSchema, 'params'),
  chatController.deleteConversation,
);

export default router;
