import type {
  ContactStatus,
  CreateContactCommand,
  PageQuery,
  UpdateContactStatusCommand,
} from '@ysk/contracts';
import { AppError } from '@ysk/domain-kernel';
import type { IContactRepository } from '../domain/contact-repository';

export const createContactService = (repo: IContactRepository) => ({
  list: (authorId: string, query: PageQuery) => repo.listForAuthor(authorId, query),
  create: async (authorId: string, input: CreateContactCommand) => {
    const existing = await repo.findByAuthorEmail(authorId, input.email);
    if (existing) throw new AppError('CONFLICT', 'That email already exists');
    return repo.create(authorId, input);
  },
  status: async (authorId: string, id: string, input: UpdateContactStatusCommand) => {
    const row = await repo.getById(id);
    if (!row || row.authorId !== authorId) throw new AppError('NOT_FOUND');
    return repo.updateStatus(id, input.status as ContactStatus);
  },
});

export type ContactService = ReturnType<typeof createContactService>;
