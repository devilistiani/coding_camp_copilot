import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ApiError, ErrorDetail } from '../lib/ApiError.js';

type Source = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details: ErrorDetail[] = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        issue: issue.message,
      }));
      return next(ApiError.badRequest('Validasi input gagal', details));
    }
    // overwrite dengan parsed value (sudah di-coerce/transform kalau ada)
    req[source] = result.data;
    next();
  };
}
