import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt.js';
import { ApiError } from '../lib/ApiError.js';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('Authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Authorization header tidak ada atau format salah'));
  }
  const token = header.slice(7).trim();
  if (!token) return next(ApiError.unauthorized('Access token kosong'));

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    next(err);
  }
}
