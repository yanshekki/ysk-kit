import { z } from 'zod';
import { AuditActionSchema } from '../enums/audit-action';
import { PaginatedSchema } from './user';

export const AuditLogDtoSchema = z.object({
  id: z.string().uuid(),
  actorId: z.string().uuid().nullable(),
  action: AuditActionSchema,
  resourceType: z.string(),
  resourceId: z.string(),
  createdAt: z.iso.datetime(),
});
export type AuditLogDto = z.infer<typeof AuditLogDtoSchema>;

export const PaginatedAuditLogsSchema = PaginatedSchema(AuditLogDtoSchema);
export type PaginatedAuditLogs = z.infer<typeof PaginatedAuditLogsSchema>;
