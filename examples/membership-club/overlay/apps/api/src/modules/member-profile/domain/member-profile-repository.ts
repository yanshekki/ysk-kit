import type {
  CreateMemberProfileCommand,
  MemberProfileDto,
  OrgRole,
  PageQuery,
  PaginatedMemberProfile,
} from '@ysk/contracts';

export type MemberProfileRecord = {
  id: string;
  displayName: string;
  organizationId: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface IMemberProfileRepository {
  create(authorId: string, input: CreateMemberProfileCommand): Promise<MemberProfileDto>;
  listForAuthor(authorId: string, query: PageQuery): Promise<PaginatedMemberProfile>;
  findByAuthorOrg(authorId: string, organizationId: string): Promise<MemberProfileRecord | null>;
  getMembership(userId: string, organizationId: string): Promise<{ role: OrgRole } | null>;
}
