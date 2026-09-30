import { slicePage } from '@ysk/application';
import type { ContactDto, ContactStatus } from '@ysk/contracts';
import type { ContactRecord, IContactRepository } from '../domain/contact-repository';

const toDto = (row: ContactRecord): ContactDto => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  company: row.company,
  status: row.status,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const createMemoryContactRepository = (): IContactRepository => {
  const rows: ContactRecord[] = [];
  return {
    async create(authorId, input) {
      const now = new Date();
      const row: ContactRecord = {
        id: crypto.randomUUID(),
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        company: input.company ?? null,
        status: 'LEAD',
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
    async getById(id) {
      return rows.find((row) => row.id === id) ?? null;
    },
    async findByAuthorEmail(authorId, email) {
      return rows.find((row) => row.authorId === authorId && row.email === email) ?? null;
    },
    async updateStatus(id, status: ContactStatus) {
      const row = rows.find((item) => item.id === id);
      if (!row) throw new Error(`contact ${id} missing`);
      row.status = status;
      row.updatedAt = new Date();
      return toDto(row);
    },
  };
};
