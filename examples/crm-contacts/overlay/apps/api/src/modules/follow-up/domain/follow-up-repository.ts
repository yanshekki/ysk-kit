import type {
  CreateFollowUpCommand,
  FollowUpDto,
  PageQuery,
  PaginatedFollowUp,
} from '@ysk-kit/contracts';

export type FollowUpRecord = {
  id: string;
  contactId: string;
  dueAt: Date;
  note: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type FollowUpContactRef = { id: string; authorId: string };

export interface IFollowUpRepository {
  create(authorId: string, input: CreateFollowUpCommand): Promise<FollowUpDto>;
  listForAuthor(authorId: string, query: PageQuery): Promise<PaginatedFollowUp>;
  getContact(id: string): Promise<FollowUpContactRef | null>;
}
