import { z } from 'zod';
import { InviteOrgRoleSchema, OrgRoleSchema } from '../enums/org-role';

export const OrganizationDtoSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(80),
  createdAt: z.iso.datetime(),
});
export type OrganizationDto = z.infer<typeof OrganizationDtoSchema>;

export const MembershipDtoSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  email: z.string().email().nullable(),
  displayName: z.string().min(1).max(80),
  role: OrgRoleSchema,
  createdAt: z.iso.datetime(),
});
export type MembershipDto = z.infer<typeof MembershipDtoSchema>;

export const OrgInviteDtoSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  email: z.string().email(),
  role: InviteOrgRoleSchema,
  createdAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
});
export type OrgInviteDto = z.infer<typeof OrgInviteDtoSchema>;

export const CreateOrganizationCommandSchema = z.object({
  name: z.string().min(1).max(80),
});
export type CreateOrganizationCommand = z.infer<typeof CreateOrganizationCommandSchema>;

export const UpdateOrganizationCommandSchema = z.object({
  name: z.string().min(1).max(80),
});
export type UpdateOrganizationCommand = z.infer<typeof UpdateOrganizationCommandSchema>;

export const InviteMemberCommandSchema = z.object({
  email: z.string().email(),
  role: InviteOrgRoleSchema,
});
export type InviteMemberCommand = z.infer<typeof InviteMemberCommandSchema>;

export const AcceptInviteCommandSchema = z.object({
  token: z.string().min(16),
  password: z.string().min(8).max(128).optional(),
  displayName: z.string().min(1).max(80).optional(),
});
export type AcceptInviteCommand = z.infer<typeof AcceptInviteCommandSchema>;

export const AcceptedInviteDtoSchema = z.object({
  accepted: z.literal(true),
});
export type AcceptedInviteDto = z.infer<typeof AcceptedInviteDtoSchema>;
