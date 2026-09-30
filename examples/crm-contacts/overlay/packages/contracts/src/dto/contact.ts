import { z } from 'zod';
import { PaginatedSchema } from './user';

export const ContactStatus = {
  LEAD: 'LEAD',
  ACTIVE: 'ACTIVE',
  CHURNED: 'CHURNED',
} as const;

export type ContactStatus = (typeof ContactStatus)[keyof typeof ContactStatus];
export const CONTACT_STATUS_VALUES = Object.values(ContactStatus) as [
  ContactStatus,
  ...ContactStatus[],
];
export const ContactStatusSchema = z.enum(CONTACT_STATUS_VALUES);

export const ContactDtoSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(80),
  email: z.string().email(),
  phone: z.string().max(20).nullable(),
  company: z.string().max(80).nullable(),
  status: ContactStatusSchema,
  authorId: z.string().uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type ContactDto = z.infer<typeof ContactDtoSchema>;

export const PaginatedContactSchema = PaginatedSchema(ContactDtoSchema);
export type PaginatedContact = z.infer<typeof PaginatedContactSchema>;

export const CreateContactCommandSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  company: z.string().max(80).optional(),
});
export type CreateContactCommand = z.infer<typeof CreateContactCommandSchema>;

export const UpdateContactStatusCommandSchema = z.object({
  status: ContactStatusSchema,
});
export type UpdateContactStatusCommand = z.infer<typeof UpdateContactStatusCommandSchema>;
