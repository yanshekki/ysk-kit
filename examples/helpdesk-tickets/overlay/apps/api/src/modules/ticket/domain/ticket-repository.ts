import type {
  CreateTicketCommand,
  OrgRole,
  PageQuery,
  PaginatedTicket,
  TicketDto,
  TicketStatus,
} from '@ysk-kit/contracts';

export type TicketRecord = {
  id: string;
  title: string;
  body: string;
  organizationId: string;
  status: TicketStatus;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface ITicketRepository {
  create(authorId: string, input: CreateTicketCommand): Promise<TicketDto>;
  listForOrganization(organizationId: string, query: PageQuery): Promise<PaginatedTicket>;
  getById(id: string): Promise<TicketRecord | null>;
  updateStatus(id: string, status: TicketStatus): Promise<TicketDto>;
  getMembership(userId: string, organizationId: string): Promise<{ role: OrgRole } | null>;
}
