import type { CreateMemberProfileCommand, PageQuery } from '@ysk-kit/contracts';
import { AppError } from '@ysk-kit/domain-kernel';
import type { IMemberProfileRepository } from '../domain/member-profile-repository';

export const createMemberProfileService = (repo: IMemberProfileRepository) => ({
  list: (authorId: string, query: PageQuery) => repo.listForAuthor(authorId, query),
  create: async (authorId: string, input: CreateMemberProfileCommand) => {
    const membership = await repo.getMembership(authorId, input.organizationId);
    if (!membership) throw new AppError('FORBIDDEN');
    const existing = await repo.findByAuthorOrg(authorId, input.organizationId);
    if (existing) throw new AppError('CONFLICT', 'A profile already exists for this organization');
    return repo.create(authorId, input);
  },
});

export type MemberProfileService = ReturnType<typeof createMemberProfileService>;
