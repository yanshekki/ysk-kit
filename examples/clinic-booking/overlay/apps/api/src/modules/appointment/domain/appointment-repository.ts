import type {
  AppointmentDto,
  AppointmentStatus,
  CreateAppointmentCommand,
  PageQuery,
  PaginatedAppointment,
} from '@ysk-kit/contracts';

export type AppointmentRecord = {
  id: string;
  patientName: string;
  phone: string;
  startsAt: Date;
  durationMin: number;
  status: AppointmentStatus;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface IAppointmentRepository {
  create(authorId: string, input: CreateAppointmentCommand): Promise<AppointmentDto>;
  listForAuthor(authorId: string, query: PageQuery): Promise<PaginatedAppointment>;
  getById(id: string): Promise<AppointmentRecord | null>;
  updateStatus(id: string, status: AppointmentStatus): Promise<AppointmentDto>;
  listScheduledForAuthor(authorId: string): Promise<AppointmentRecord[]>;
}
