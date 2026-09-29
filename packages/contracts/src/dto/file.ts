import { z } from 'zod';

export const PresignUploadCommandSchema = z.object({
  mime: z.string().min(1).max(120),
  byteSize: z
    .number()
    .int()
    .positive()
    .max(20 * 1024 * 1024),
  filename: z.string().min(1).max(180),
});
export type PresignUploadCommand = z.infer<typeof PresignUploadCommandSchema>;

export const PresignDtoSchema = z.object({
  fileId: z.string().uuid(),
  uploadUrl: z.string(),
  headers: z.record(z.string(), z.string()),
});
export type PresignDto = z.infer<typeof PresignDtoSchema>;
