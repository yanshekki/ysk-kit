import { z } from 'zod';
import { HkPhoneSchema, PaginatedSchema } from './user.js';

export const AppointmentStatus = {
  SCHEDULED: 'SCHEDULED',
  CANCELLED: 'CANCELLED',
  DONE: 'DONE',
} as const;

export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];
export const APPOINTMENT_STATUS_VALUES = Object.values(AppointmentStatus) as [
  AppointmentStatus,
  ...AppointmentStatus[],
];
export const AppointmentStatusSchema = z.enum(APPOINTMENT_STATUS_VALUES);

export const AppointmentDtoSchema = z.object({
  id: z.string().uuid(),
  patientName: z.string().min(1).max(80),
  phone: HkPhoneSchema,
  startsAt: z.iso.datetime(),
  durationMin: z.number().int().min(15).max(180),
  status: AppointmentStatusSchema,
  authorId: z.string().uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type AppointmentDto = z.infer<typeof AppointmentDtoSchema>;

export const PaginatedAppointmentSchema = PaginatedSchema(AppointmentDtoSchema);
export type PaginatedAppointment = z.infer<typeof PaginatedAppointmentSchema>;

export const CreateAppointmentCommandSchema = z.object({
  patientName: z.string().min(1).max(80),
  phone: HkPhoneSchema,
  startsAt: z.iso.datetime(),
  durationMin: z.number().int().min(15).max(180).default(30),
});
export type CreateAppointmentCommand = z.infer<typeof CreateAppointmentCommandSchema>;
