import { slicePage } from '@ysk/application';
import type { AppointmentDto, AppointmentStatus } from '@ysk/contracts';
import type { AppointmentRecord, IAppointmentRepository } from '../domain/appointment-repository';

const toDto = (row: AppointmentRecord): AppointmentDto => ({
  id: row.id,
  patientName: row.patientName,
  phone: row.phone,
  startsAt: row.startsAt.toISOString(),
  durationMin: row.durationMin,
  status: row.status,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const createMemoryAppointmentRepository = (): IAppointmentRepository => {
  const rows: AppointmentRecord[] = [];
  return {
    async create(authorId, input) {
      const now = new Date();
      const row: AppointmentRecord = {
        id: crypto.randomUUID(),
        patientName: input.patientName,
        phone: input.phone,
        startsAt: new Date(input.startsAt),
        durationMin: input.durationMin,
        status: 'SCHEDULED',
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
    async updateStatus(id, status: AppointmentStatus) {
      const row = rows.find((item) => item.id === id);
      if (!row) throw new Error(`appointment ${id} missing`);
      row.status = status;
      row.updatedAt = new Date();
      return toDto(row);
    },
    async listScheduledForAuthor(authorId) {
      return rows.filter((row) => row.authorId === authorId && row.status === 'SCHEDULED');
    },
  };
};
