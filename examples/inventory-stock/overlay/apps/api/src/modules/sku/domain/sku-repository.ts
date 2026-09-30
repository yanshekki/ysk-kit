import type { CreateSkuCommand, PageQuery, PaginatedSku, SkuDto } from '@ysk-kit/contracts';

export type SkuRecord = {
  id: string;
  code: string;
  name: string;
  qtyOnHand: number;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface ISkuRepository {
  create(authorId: string, input: CreateSkuCommand): Promise<SkuDto>;
  listForAuthor(authorId: string, query: PageQuery): Promise<PaginatedSku>;
  getById(id: string): Promise<SkuRecord | null>;
  findByAuthorCode(authorId: string, code: string): Promise<SkuRecord | null>;
}
