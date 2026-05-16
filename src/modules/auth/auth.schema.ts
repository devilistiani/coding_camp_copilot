import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Format email tidak valid').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Za-z]/, 'Password harus mengandung huruf')
    .regex(/[0-9]/, 'Password harus mengandung angka'),
  full_name: z.string().min(2, 'Nama minimal 2 karakter').max(150, 'Nama maksimal 150 karakter'),
});

export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid').toLowerCase(),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const refreshSchema = z.object({
  refresh_token: z.string().min(10, 'Refresh token tidak valid'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
