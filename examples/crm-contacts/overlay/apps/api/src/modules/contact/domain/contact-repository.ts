import type {
  ContactDto,
  ContactStatus,
  CreateContactCommand,
  PageQuery,
  PaginatedContact,
} from '@ysk-kit/contracts';

export type ContactRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  status: ContactStatus;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface IContactRepository {
  create(authorId: string, input: CreateContactCommand): Promise<ContactDto>;
  listForAuthor(authorId: string, query: PageQuery): Promise<PaginatedContact>;
  getById(id: string): Promise<ContactRecord | null>;
  findByAuthorEmail(authorId: string, email: string): Promise<ContactRecord | null>;
  updateStatus(id: string, status: ContactStatus): Promise<ContactDto>;
}
