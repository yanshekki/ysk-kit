import { slicePage } from '@ysk/application';
import type { FollowUpDto } from '@ysk/contracts';
import type {
  FollowUpContactRef,
  FollowUpRecord,
  IFollowUpRepository,
} from '../domain/follow-up-repository';

const toDto = (row: FollowUpRecord): FollowUpDto => ({
  id: row.id,
  contactId: row.contactId,
  dueAt: row.dueAt.toISOString(),
  note: row.note,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export type ContactLookup = {
  getById: (id: string) => Promise<FollowUpContactRef | null>;
};

export const createMemoryFollowUpRepository = (contacts?: ContactLookup): IFollowUpRepository => {
  const rows: FollowUpRecord[] = [];
  const local: FollowUpContactRef[] = [];
  return {
    async create(authorId, input) {
      const now = new Date();
      const row: FollowUpRecord = {
        id: crypto.randomUUID(),
        contactId: input.contactId,
        dueAt: new Date(input.dueAt),
        note: input.note,
        authorId,
        createdAt: now,
        updatedAt: now,
      };
      rows.unshift(row);
      return toDto(row);
    },
    async listForAuthor(authorId, query) {
      const mine = rows.filter((row) => row.authorId === authorId);
      const page = slicePage(mine, query.limit);
      return { items: page.items.map(toDto), nextCursor: page.nextCursor };
    },
    async getContact(id) {
      if (contacts) return contacts.getById(id);
      return local.find((row) => row.id === id) ?? null;
    },
  };
};
