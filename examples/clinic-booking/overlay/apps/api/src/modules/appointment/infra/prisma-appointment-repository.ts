import { slicePage } from '@ysk/application';
import type { AppointmentDto, AppointmentStatus } from '@ysk/contracts';
import type { PrismaClient } from '../../../generated/prisma/client';
import type { IAppointmentRepository } from '../domain/appointment-repository';

const toDto = (row: {
  id: string;
  patientName: string;
  phone: string;
  startsAt: Date;
  durationMin: number;
  status: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}): AppointmentDto => ({
  id: row.id,
  patientName: row.patientName,
  phone: row.phone,
  startsAt: row.startsAt.toISOString(),
  durationMin: row.durationMin,
  status: row.status as AppointmentStatus,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const createPrismaAppointmentRepository = (
  prisma: PrismaClient,
): IAppointmentRepository => ({
  async create(authorId, input) {
    const row = await prisma.appointment.create({
      data: {
        patientName: input.patientName,
        phone: input.phone,
        startsAt: new Date(input.startsAt),
        durationMin: input.durationMin,
        status: 'SCHEDULED',
        authorId,
      },
    });
    return toDto(row);
  },
  async listForAuthor(authorId, query) {
    const rows = await prisma.appointment.findMany({
      where: { authorId },
      orderBy: { startsAt: 'asc' },
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const page = slicePage(rows, query.limit);
    return { items: page.items.map(toDto), nextCursor: page.nextCursor };
  },
  async getById(id) {
    const row = await prisma.appointment.findUnique({ where: { id } });
    if (!row) return null;
    return {
      ...row,
      status: row.status as AppointmentStatus,
    };
  },
  async updateStatus(id, status) {
    const row = await prisma.appointment.update({
      where: { id },
      data: { status },
    });
    return toDto(row);
  },
  async listScheduledForAuthor(authorId) {
    const rows = await prisma.appointment.findMany({
      where: { authorId, status: 'SCHEDULED' },
    });
    return rows.map((row) => ({ ...row, status: row.status as AppointmentStatus }));
  },
});
