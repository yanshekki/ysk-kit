import type {
  CreateTicketCommand,
  TicketListQuery,
  UpdateTicketStatusCommand,
} from '@ysk-kit/contracts';
import { AppError } from '@ysk-kit/domain-kernel';
import type { ITicketRepository } from '../domain/ticket-repository';

export const createTicketService = (repo: ITicketRepository) => {
  const requireMember = async (userId: string, organizationId: string) => {
    const membership = await repo.getMembership(userId, organizationId);
    if (!membership) throw new AppError('FORBIDDEN');
    return membership;
  };
  return {
    list: async (authorId: string, query: TicketListQuery) => {
      await requireMember(authorId, query.organizationId);
      return repo.listForOrganization(query.organizationId, query);
    },
    create: async (authorId: string, input: CreateTicketCommand) => {
      await requireMember(authorId, input.organizationId);
      return repo.create(authorId, input);
    },
    status: async (authorId: string, id: string, input: UpdateTicketStatusCommand) => {
      const row = await repo.getById(id);
      if (!row) throw new AppError('NOT_FOUND');
      const membership = await requireMember(authorId, row.organizationId);
      if (membership.role === 'MEMBER' && input.status !== 'PENDING') {
        throw new AppError('FORBIDDEN');
      }
      return repo.updateStatus(id, input.status);
    },
  };
};

export type TicketService = ReturnType<typeof createTicketService>;
