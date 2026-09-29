import { type PageQuery, PageQuerySchema } from '@ysk/contracts';

export const parsePageQuery = (raw: unknown): PageQuery => PageQuerySchema.parse(raw);

export const slicePage = <T extends { id: string }>(
  rows: T[],
  limit: number,
): { items: T[]; nextCursor: string | null } => {
  const extra = rows.length > limit;
  const items = extra ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];
  return { items, nextCursor: extra && last ? last.id : null };
};
