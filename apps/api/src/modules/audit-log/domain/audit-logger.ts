import type { AuditAction, PageQuery, PaginatedAuditLogs } from '@ysk-kit/contracts';

export type AuditRecordInput = {
  actorId: string | null;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  diff?: unknown;
  requestId?: string | undefined;
};

export interface IAuditLogger {
  record(input: AuditRecordInput): Promise<void>;
  list(query: PageQuery): Promise<PaginatedAuditLogs>;
}
