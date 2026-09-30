import type {
  CreateStockMoveCommand,
  PageQuery,
  PaginatedStockMove,
  StockMoveDto,
} from '@ysk-kit/contracts';

export type StockMoveRecord = {
  id: string;
  skuId: string;
  delta: number;
  reason: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type StockMoveSkuRef = { id: string; authorId: string; qtyOnHand: number };

export interface IStockMoveRepository {
  create(authorId: string, input: CreateStockMoveCommand): Promise<StockMoveDto>;
  listForAuthor(authorId: string, query: PageQuery): Promise<PaginatedStockMove>;
  getSku(id: string): Promise<StockMoveSkuRef | null>;
  applyQty(id: string, nextQty: number): Promise<void>;
}
