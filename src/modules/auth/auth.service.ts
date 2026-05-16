import crypto from 'node:crypto';
import { User, UserRole } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashRefreshToken,
  expiresAtFromDuration,
  durationToSeconds,
} from '../../lib/jwt.js';
import { ApiError } from '../../lib/ApiError.js';
import { env } from '../../config/env.js';
import { LoginInput, RegisterInput } from './auth.schema.js';

export interface AuthTokens {
  token: string;
  refresh_token: string;
  expires_in: number;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.fullName,
    role: user.role,
  };
}

async function issueTokens(user: User): Promise<AuthTokens> {
  const jti = crypto.randomUUID();
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = signRefreshToken({ sub: user.id, jti });

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: expiresAtFromDuration(env.JWT_REFRESH_EXPIRES_IN),
    },
  });

  return {
    token: accessToken,
    refresh_token: refreshToken,
    expires_in: durationToSeconds(env.JWT_ACCESS_EXPIRES_IN),
  };
}

export async function register(input: RegisterInput): Promise<{ user: PublicUser }> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw ApiError.conflict('Email sudah terdaftar');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      fullName: input.full_name,
      role: UserRole.user, // default register sebagai user biasa
    },
  });

  return { user: toPublicUser(user) };
}

export async function login(
  input: LoginInput,
): Promise<{ user: PublicUser; tokens: AuthTokens }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  // pesan generik supaya gak bocor info "email tidak ada"
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Email atau password salah');
  }

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) {
    throw ApiError.unauthorized('Email atau password salah');
  }

  const tokens = await issueTokens(user);
  return { user: toPublicUser(user), tokens };
}

export async function refresh(refreshToken: string): Promise<{ tokens: AuthTokens }> {
  const payload = verifyRefreshToken(refreshToken);

  // Cek token masih ada di DB & belum di-revoke
  const tokenRow = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashRefreshToken(refreshToken) },
  });
  if (!tokenRow || tokenRow.revokedAt || tokenRow.expiresAt < new Date()) {
    throw ApiError.unauthorized('Refresh token tidak valid atau sudah dicabut');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('User tidak ditemukan atau dinonaktifkan');
  }

  // Rotate: revoke yang lama, terbitkan yang baru
  await prisma.refreshToken.update({
    where: { id: tokenRow.id },
    data: { revokedAt: new Date() },
  });

  const tokens = await issueTokens(user);
  return { tokens };
}

export async function logout(refreshToken: string): Promise<void> {
  const tokenRow = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashRefreshToken(refreshToken) },
  });
  if (tokenRow && !tokenRow.revokedAt) {
    await prisma.refreshToken.update({
      where: { id: tokenRow.id },
      data: { revokedAt: new Date() },
    });
  }
  // gak throw error walaupun token gak ditemukan — idempotent
}

export async function getMe(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('User tidak ditemukan');
  return toPublicUser(user);
}
