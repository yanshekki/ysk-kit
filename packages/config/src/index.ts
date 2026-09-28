import { z } from 'zod';

export const PublicConfigSchema = z.object({
  apiPublicUrl: z.string().url(),
  webPublicUrl: z.string().url(),
  adminPublicUrl: z.string().url(),
});

export type PublicConfig = z.infer<typeof PublicConfigSchema>;

export const defaultPublicConfig = (): PublicConfig =>
  PublicConfigSchema.parse({
    apiPublicUrl: process.env.API_PUBLIC_URL ?? 'http://localhost:3001',
    webPublicUrl: process.env.WEB_PUBLIC_URL ?? 'http://localhost:5173',
    adminPublicUrl: process.env.ADMIN_PUBLIC_URL ?? 'http://localhost:5174',
  });
