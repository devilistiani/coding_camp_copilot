import { Message, Prisma, SenderType, UrgencyLevel } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { aiClient, deriveUrgency } from './ai-client.js';
import {
  ChatRequestInput,
  ListConversationsQuery,
  UpdateConversationInput,
} from './chat.schema.js';

const AI_TO_UI_CATEGORY: Record<string, 'Jadwal' | 'Materi' | 'Teknis' | 'Tugas' | 'Umum' | 'Akun'> = {
  'Administrasi & Akun': 'Akun',
  'Capstone & Reporting': 'Tugas',
  'Materi & Kurikulum': 'Materi',
  'Teknis/Lain-lain': 'Teknis',
};

function mapAiCategoryToUi(aiCategory: string): 'Jadwal' | 'Materi' | 'Teknis' | 'Tugas' | 'Umum' | 'Akun' {
  return AI_TO_UI_CATEGORY[aiCategory] ?? 'Umum';
}

export interface PredictResponse {
  answer: string;
  category: 'Jadwal' | 'Materi' | 'Teknis' | 'Tugas' | 'Umum' | 'Akun';
  urgency: 'low' | 'medium' | 'high';
  confidence: number;
  draft_reply?: string;
  sources?: string[];
}

export async function predict(
  userRole: 'peserta' | 'admin',
  question: string,
): Promise<PredictResponse> {
  const aiResponse = await aiClient.predict(question, { withReply: true });
  const urgency = deriveUrgency(question, aiResponse.category, aiResponse.confidence);

  return {
    answer: aiResponse.reply ?? aiResponse.message ?? 'Maaf, AI tidak bisa generate jawaban saat ini.',
    category: mapAiCategoryToUi(aiResponse.category),
    urgency,
    confidence: aiResponse.confidence,
    ...(userRole === 'admin' && aiResponse.reply ? { draft_reply: aiResponse.reply } : {}),
    sources: [],
  };
}

export interface PublicMessage {
  id: string;
  sender_type: SenderType;
  content: string;
  category: string | null;
  urgency: UrgencyLevel | null;
  confidence: number | null;
  draft_reply: string | null;
  ai_metadata: Prisma.JsonValue | null;
  created_at: Date;
}

export interface ChatResponse {
  conversation: {
    id: string;
    title: string | null;
  };
  user_message: PublicMessage;
  ai_message: PublicMessage;
}

function toPublicMessage(msg: Message): PublicMessage {
  return {
    id: msg.id,
    sender_type: msg.senderType,
    content: msg.content,
    category: msg.category ? mapAiCategoryToUi(msg.category) : null,
    urgency: msg.urgency,
    confidence: msg.confidence ? Number(msg.confidence) : null,
    draft_reply: msg.draftReply,
    ai_metadata: msg.aiMetadata,
    created_at: msg.createdAt,
  };
}

function generateTitle(question: string): string {
  const cleaned = question.trim().replace(/\s+/g, ' ');
  return cleaned.length <= 60 ? cleaned : cleaned.slice(0, 57) + '...';
}

export async function chat(
  userId: string,
  userRole: 'peserta' | 'admin',
  input: ChatRequestInput,
): Promise<ChatResponse> {
  let conversation;
  if (input.conversation_id) {
    conversation = await prisma.conversation.findUnique({
      where: { id: input.conversation_id },
    });
    if (!conversation) throw ApiError.notFound('Conversation tidak ditemukan');
    if (conversation.userId !== userId) {
      throw ApiError.forbidden('Conversation ini bukan milik kamu');
    }
  } else {
    conversation = await prisma.conversation.create({
      data: {
        userId,
        title: generateTitle(input.question),
      },
    });
  }

  const userMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderType: SenderType.user,
      content: input.question,
    },
  });

  const aiResponse = await aiClient.predict(input.question, {
    withReply: true,
  });

  const urgency = deriveUrgency(input.question, aiResponse.category, aiResponse.confidence);

  const aiMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderType: SenderType.ai,
      content: aiResponse.reply || aiResponse.message || '(Tidak ada jawaban)',
      category: aiResponse.category,
      urgency,
      confidence: new Prisma.Decimal(aiResponse.confidence),
      draftReply: userRole === 'admin' ? (aiResponse.reply ?? null) : null,
      aiMetadata: {
        status: aiResponse.status,
        cleaned_text: aiResponse.cleaned_text,
        label: aiResponse.label,
        all_scores: aiResponse.all_scores,
        warning_message: aiResponse.message,
      } satisfies Prisma.InputJsonValue,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {},
  });

  return {
    conversation: {
      id: conversation.id,
      title: conversation.title,
    },
    user_message: toPublicMessage(userMessage),
    ai_message: toPublicMessage(aiMessage),
  };
}

export async function listConversations(
  userId: string,
  userRole: 'peserta' | 'admin',
  query: ListConversationsQuery,
) {
  const scopeToSelf = userRole === 'peserta' || query.mine === true;
  const includeUser = userRole === 'admin' && !scopeToSelf;
  const q = query.q?.trim();

  const where: Prisma.ConversationWhereInput = {
    ...(scopeToSelf && { userId }),
    ...(q && {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        ...(includeUser
          ? [
              { user: { fullName: { contains: q, mode: 'insensitive' as const } } },
              { user: { email: { contains: q, mode: 'insensitive' as const } } },
            ]
          : []),
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: {
        _count: { select: { messages: true } },
        ...(includeUser && {
          user: { select: { id: true, email: true, fullName: true } },
        }),
      },
    }),
    prisma.conversation.count({ where }),
  ]);

  return {
    items: items.map((c) => ({
      id: c.id,
      title: c.title,
      message_count: c._count.messages,
      created_at: c.createdAt,
      updated_at: c.updatedAt,
      ...(includeUser && 'user' in c && c.user
        ? { user: { id: c.user.id, email: c.user.email, full_name: c.user.fullName } }
        : {}),
    })),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      total_pages: Math.ceil(total / query.limit),
    },
  };
}

export async function getConversationDetail(
  conversationId: string,
  userId: string,
  userRole: 'peserta' | 'admin',
) {
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      user: { select: { id: true, email: true, fullName: true } },
    },
  });

  if (!conv) throw ApiError.notFound('Conversation tidak ditemukan');
  if (userRole === 'peserta' && conv.userId !== userId) {
    throw ApiError.forbidden('Conversation ini bukan milik kamu');
  }

  return {
    id: conv.id,
    title: conv.title,
    created_at: conv.createdAt,
    updated_at: conv.updatedAt,
    user: { id: conv.user.id, email: conv.user.email, full_name: conv.user.fullName },
    messages: conv.messages.map(toPublicMessage),
  };
}

export async function updateConversation(
  conversationId: string,
  userId: string,
  userRole: 'peserta' | 'admin',
  input: UpdateConversationInput,
) {
  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conv) throw ApiError.notFound('Conversation tidak ditemukan');
  if (userRole === 'peserta' && conv.userId !== userId) {
    throw ApiError.forbidden('Conversation ini bukan milik kamu');
  }

  const updated = await prisma.conversation.update({
    where: { id: conversationId },
    data: { title: input.title },
  });

  return {
    id: updated.id,
    title: updated.title,
    updated_at: updated.updatedAt,
  };
}

export async function deleteConversation(
  conversationId: string,
  userId: string,
  userRole: 'peserta' | 'admin',
) {
  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conv) throw ApiError.notFound('Conversation tidak ditemukan');
  if (userRole === 'peserta' && conv.userId !== userId) {
    throw ApiError.forbidden('Conversation ini bukan milik kamu');
  }

  await prisma.conversation.delete({ where: { id: conversationId } });
}
