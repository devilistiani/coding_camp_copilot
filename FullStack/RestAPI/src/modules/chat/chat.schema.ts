import { z } from 'zod';

export const chatRequestSchema = z.object({
  question: z
    .string()
    .min(2, 'Pertanyaan minimal 2 karakter')
    .max(2000, 'Pertanyaan maksimal 2000 karakter')
    .transform((s) => s.trim()),
  conversation_id: z.string().uuid('conversation_id harus UUID valid').optional(),
});

export const listConversationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  mine: z.coerce.boolean().optional(),
  q: z.string().optional(),
});

export const conversationIdParamSchema = z.object({
  id: z.string().uuid('id harus UUID valid'),
});

export const updateConversationSchema = z.object({
  title: z.string().min(1, 'title tidak boleh kosong').max(255),
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
export type ListConversationsQuery = z.infer<typeof listConversationsQuerySchema>;
export type ConversationIdParam = z.infer<typeof conversationIdParamSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
