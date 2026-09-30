import type {
  CreateQuoteCommand,
  PageQuery,
  PaginatedQuote,
  QuoteDto,
  QuoteStatus,
} from '@ysk/contracts';

export type QuoteRecord = {
  id: string;
  clientName: string;
  amountHkd: number;
  status: QuoteStatus;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface IQuoteRepository {
  create(authorId: string, input: CreateQuoteCommand): Promise<QuoteDto>;
  listForAuthor(authorId: string, query: PageQuery): Promise<PaginatedQuote>;
  getById(id: string): Promise<QuoteRecord | null>;
  updateStatus(id: string, status: QuoteStatus): Promise<QuoteDto>;
}
