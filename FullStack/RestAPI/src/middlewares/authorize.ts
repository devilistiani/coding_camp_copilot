import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../lib/ApiError.js';

type Role = 'peserta' | 'admin';

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Belum terautentikasi'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Role '${req.user.role}' tidak punya akses`));
    }
    next();
  };
}
