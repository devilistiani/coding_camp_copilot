export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export interface ErrorDetail {
  field?: string;
  issue: string;
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: ErrorDetail[];

  constructor(statusCode: number, code: ErrorCode, message: string, details?: ErrorDetail[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: ErrorDetail[]) {
    return new ApiError(400, 'VALIDATION_ERROR', message, details);
  }

  static unauthorized(message = 'Token tidak valid atau sudah expired') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Tidak punya hak akses untuk resource ini') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Resource tidak ditemukan') {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(message: string) {
    return new ApiError(409, 'CONFLICT', message);
  }

  static internal(message = 'Terjadi kesalahan internal') {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }
}
