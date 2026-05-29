import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  q: z.string().optional(),
  status: z.enum(['aktif', 'nonaktif']).optional(),
  role: z.enum(['peserta', 'admin']).optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid('id harus UUID valid'),
});

export const updateUserSchema = z
  .object({
    full_name: z
      .string()
      .min(2, 'Nama minimal 2 karakter')
      .max(150, 'Nama maksimal 150 karakter')
      .transform((s) => s.trim())
      .optional(),
    is_active: z.boolean().optional(),
    role: z.enum(['peserta', 'admin']).optional(),
  })
  .refine(
    (d) => d.full_name !== undefined || d.is_active !== undefined || d.role !== undefined,
    { message: 'Minimal satu field (full_name, is_active, atau role) harus diisi' },
  );

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
