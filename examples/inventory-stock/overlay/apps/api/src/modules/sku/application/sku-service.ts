import type { CreateSkuCommand, PageQuery } from '@ysk-kit/contracts';
import { AppError } from '@ysk-kit/domain-kernel';
import type { ISkuRepository } from '../domain/sku-repository';

export const createSkuService = (repo: ISkuRepository) => ({
  list: (authorId: string, query: PageQuery) => repo.listForAuthor(authorId, query),
  create: async (authorId: string, input: CreateSkuCommand) => {
    const existing = await repo.findByAuthorCode(authorId, input.code);
    if (existing) throw new AppError('CONFLICT', 'That code already exists');
    return repo.create(authorId, input);
  },
});

export type SkuService = ReturnType<typeof createSkuService>;
