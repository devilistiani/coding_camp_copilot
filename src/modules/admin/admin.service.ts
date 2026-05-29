import { Prisma, UserRole } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { ListUsersQuery, UpdateUserInput } from './admin.schema.js';

export interface PublicUserAdmin {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  chat_count: number;
  joined_at: Date;
  updated_at: Date;
}

export async function listUsers(query: ListUsersQuery) {
  const where: Prisma.UserWhereInput = {
    ...(query.q && {
      OR: [
        { email: { contains: query.q, mode: 'insensitive' } },
        { fullName: { contains: query.q, mode: 'insensitive' } },
      ],
    }),
    ...(query.status === 'aktif' && { isActive: true }),
    ...(query.status === 'nonaktif' && { isActive: false }),
    ...(query.role && { role: query.role }),
  };

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: { _count: { select: { conversations: true } } },
    }),
    prisma.user.count({ where }),
  ]);

  const items: PublicUserAdmin[] = rows.map((u) => ({
    id: u.id,
    email: u.email,
    full_name: u.fullName,
    role: u.role,
    is_active: u.isActive,
    chat_count: u._count.conversations,
    joined_at: u.createdAt,
    updated_at: u.updatedAt,
  }));

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      total_pages: Math.ceil(total / query.limit),
    },
  };
}

export async function updateUser(
  currentAdminId: string,
  targetUserId: string,
  input: UpdateUserInput,
): Promise<PublicUserAdmin> {
  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) throw ApiError.notFound('User tidak ditemukan');

  if (currentAdminId === targetUserId) {
    if (input.is_active === false) {
      throw ApiError.badRequest('Tidak bisa menonaktifkan akun sendiri');
    }
    if (input.role !== undefined && input.role !== 'admin') {
      throw ApiError.badRequest('Tidak bisa mengubah role akun sendiri');
    }
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      ...(input.full_name !== undefined && { fullName: input.full_name }),
      ...(input.is_active !== undefined && { isActive: input.is_active }),
      ...(input.role !== undefined && { role: input.role }),
    },
    include: { _count: { select: { conversations: true } } },
  });

  if (input.is_active === false) {
    await prisma.refreshToken.updateMany({
      where: { userId: targetUserId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  return {
    id: updated.id,
    email: updated.email,
    full_name: updated.fullName,
    role: updated.role,
    is_active: updated.isActive,
    chat_count: updated._count.conversations,
    joined_at: updated.createdAt,
    updated_at: updated.updatedAt,
  };
}

export async function deleteUser(currentAdminId: string, targetUserId: string): Promise<void> {
  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) throw ApiError.notFound('User tidak ditemukan');

  if (currentAdminId === targetUserId) {
    throw ApiError.badRequest('Tidak bisa menghapus akun sendiri');
  }

  await prisma.user.delete({ where: { id: targetUserId } });
}

export interface AnalyticsSummary {
  generated_at: string;
  users: {
    total: number;
    active: number;
    inactive: number;
    by_role: Record<UserRole, number>;
    new_last_7_days: number;
  };
  conversations: {
    total: number;
    new_today: number;
    new_last_7_days: number;
  };
  messages: {
    total: number;
    by_sender: Record<'user' | 'ai', number>;
    new_today: number;
    new_last_7_days: number;
  };
  ai: {
    avg_confidence: number | null;
    by_category: Array<{ category: string; count: number }>;
    by_urgency: Record<'low' | 'medium' | 'high', number>;
  };
  daily_trend_last_30_days: Array<{ date: string; conversations: number; messages: number }>;
}

function startOfTodayUtc(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const today = startOfTodayUtc();
  const sevenDaysAgo = daysAgo(7);
  const thirtyDaysAgo = daysAgo(30);

  const [
    totalUsers,
    activeUsers,
    usersByRoleRaw,
    newUsersLast7,
    totalConversations,
    newConvToday,
    newConvLast7,
    totalMessages,
    msgBySenderRaw,
    newMsgToday,
    newMsgLast7,
    avgConfidenceAgg,
    msgByCategoryRaw,
    msgByUrgencyRaw,
    dailyTrendRaw,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.conversation.count(),
    prisma.conversation.count({ where: { createdAt: { gte: today } } }),
    prisma.conversation.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.message.count(),
    prisma.message.groupBy({ by: ['senderType'], _count: { _all: true } }),
    prisma.message.count({ where: { createdAt: { gte: today } } }),
    prisma.message.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.message.aggregate({
      _avg: { confidence: true },
      where: { senderType: 'ai' },
    }),
    prisma.message.groupBy({
      by: ['category'],
      _count: { _all: true },
      where: { category: { not: null } },
      orderBy: { _count: { category: 'desc' } },
      take: 10,
    }),
    prisma.message.groupBy({
      by: ['urgency'],
      _count: { _all: true },
      where: { urgency: { not: null } },
    }),
    prisma.$queryRaw<Array<{ date: Date; conversations: bigint; messages: bigint }>>`
      SELECT
        d.date::date AS date,
        COALESCE(c.cnt, 0) AS conversations,
        COALESCE(m.cnt, 0) AS messages
      FROM generate_series(${thirtyDaysAgo}::timestamptz, NOW()::timestamptz, '1 day'::interval) AS d(date)
      LEFT JOIN (
        SELECT DATE(created_at AT TIME ZONE 'UTC') AS date, COUNT(*) AS cnt
        FROM conversations
        WHERE created_at >= ${thirtyDaysAgo}
        GROUP BY DATE(created_at AT TIME ZONE 'UTC')
      ) c ON c.date = d.date::date
      LEFT JOIN (
        SELECT DATE(created_at AT TIME ZONE 'UTC') AS date, COUNT(*) AS cnt
        FROM messages
        WHERE created_at >= ${thirtyDaysAgo}
        GROUP BY DATE(created_at AT TIME ZONE 'UTC')
      ) m ON m.date = d.date::date
      ORDER BY d.date
    `,
  ]);

  const usersByRole: Record<UserRole, number> = { peserta: 0, admin: 0 };
  for (const row of usersByRoleRaw) {
    usersByRole[row.role] = row._count._all;
  }

  const msgBySender: Record<'user' | 'ai', number> = { user: 0, ai: 0 };
  for (const row of msgBySenderRaw) {
    msgBySender[row.senderType] = row._count._all;
  }

  const msgByUrgency: Record<'low' | 'medium' | 'high', number> = {
    low: 0,
    medium: 0,
    high: 0,
  };
  for (const row of msgByUrgencyRaw) {
    if (row.urgency) msgByUrgency[row.urgency] = row._count._all;
  }

  const byCategory = msgByCategoryRaw
    .filter((r) => r.category !== null)
    .map((r) => ({ category: r.category as string, count: r._count._all }));

  const dailyTrend = dailyTrendRaw.map((r) => ({
    date: r.date.toISOString().slice(0, 10),
    conversations: Number(r.conversations),
    messages: Number(r.messages),
  }));

  return {
    generated_at: new Date().toISOString(),
    users: {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
      by_role: usersByRole,
      new_last_7_days: newUsersLast7,
    },
    conversations: {
      total: totalConversations,
      new_today: newConvToday,
      new_last_7_days: newConvLast7,
    },
    messages: {
      total: totalMessages,
      by_sender: msgBySender,
      new_today: newMsgToday,
      new_last_7_days: newMsgLast7,
    },
    ai: {
      avg_confidence: avgConfidenceAgg._avg.confidence
        ? Number(avgConfidenceAgg._avg.confidence)
        : null,
      by_category: byCategory,
      by_urgency: msgByUrgency,
    },
    daily_trend_last_30_days: dailyTrend,
  };
}
