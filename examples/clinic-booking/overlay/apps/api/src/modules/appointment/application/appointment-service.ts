import type { AppointmentStatus, CreateAppointmentCommand, PageQuery } from '@ysk-kit/contracts';
import { AppError } from '@ysk-kit/domain-kernel';
import type { IAppointmentRepository } from '../domain/appointment-repository';

const addMinutes = (date: Date, minutes: number): Date =>
  new Date(date.getTime() + minutes * 60_000);

export const slotsOverlap = (aStart: Date, aMin: number, bStart: Date, bMin: number): boolean => {
  const aEnd = addMinutes(aStart, aMin);
  const bEnd = addMinutes(bStart, bMin);
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
};

export const createAppointmentService = (
  repo: IAppointmentRepository,
  opts?: { now?: () => Date },
) => {
  const now = opts?.now ?? (() => new Date());
  const requireOwnScheduled = async (authorId: string, id: string, next: AppointmentStatus) => {
    const row = await repo.getById(id);
    if (!row || row.authorId !== authorId) throw new AppError('NOT_FOUND');
    if (row.status !== 'SCHEDULED')
      throw new AppError('CONFLICT', 'Only SCHEDULED rows can change');
    return repo.updateStatus(id, next);
  };
  return {
    list: (authorId: string, query: PageQuery) => repo.listForAuthor(authorId, query),
    create: async (authorId: string, input: CreateAppointmentCommand) => {
      const startsAt = new Date(input.startsAt);
      if (Number.isNaN(startsAt.getTime())) {
        throw new AppError('VALIDATION_FAILED', 'startsAt must be an ISO datetime');
      }
      if (startsAt.getTime() < now().getTime()) {
        throw new AppError('VALIDATION_FAILED', 'startsAt must be in the future');
      }
      const scheduled = await repo.listScheduledForAuthor(authorId);
      const clash = scheduled.some((row) =>
        slotsOverlap(startsAt, input.durationMin, row.startsAt, row.durationMin),
      );
      if (clash) throw new AppError('CONFLICT', 'That slot overlaps an existing appointment');
      return repo.create(authorId, input);
    },
    cancel: (authorId: string, id: string) => requireOwnScheduled(authorId, id, 'CANCELLED'),
    complete: (authorId: string, id: string) => requireOwnScheduled(authorId, id, 'DONE'),
  };
};

export type AppointmentService = ReturnType<typeof createAppointmentService>;
