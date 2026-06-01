import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { ApiError } from './ApiError.js';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: 'peserta' | 'admin';
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  } catch {
    throw ApiError.unauthorized('Access token tidak valid atau expired');
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch {
    throw ApiError.unauthorized('Refresh token tidak valid atau expired');
  }
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function expiresAtFromDuration(duration: string): Date {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Format duration tidak valid: ${duration}`);
  const [, n, unit] = match;
  const num = Number(n);
  const ms = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit as 's' | 'm' | 'h' | 'd'];
  return new Date(Date.now() + num * ms);
}

export function durationToSeconds(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Format duration tidak valid: ${duration}`);
  const [, n, unit] = match;
  const num = Number(n);
  const sec = { s: 1, m: 60, h: 3600, d: 86_400 }[unit as 's' | 'm' | 'h' | 'd'];
  return num * sec;
}
