import { initContract } from '@ts-rest/core';
import { PaginatedAuditLogsSchema } from '../dto/audit.js';
import { PageQuerySchema } from '../dto/user.js';
import { ErrSchema, OkSchema } from '../errors/envelope.js';

const c = initContract();

export const auditContract = c.router({
  list: {
    method: 'GET',
    path: '/v1/audit-logs',
    query: PageQuerySchema,
    responses: {
      200: OkSchema(PaginatedAuditLogsSchema),
      401: ErrSchema,
      403: ErrSchema,
    },
    summary: 'List audit logs',
  },
});
