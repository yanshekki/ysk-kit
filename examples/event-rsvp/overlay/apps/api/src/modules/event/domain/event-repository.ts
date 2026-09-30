import type { CreateEventCommand, EventDto, PageQuery, PaginatedEvent } from '@ysk/contracts';

export type EventRecord = {
  id: string;
  title: string;
  venue: string;
  startsAt: Date;
  capacity: number;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface IEventRepository {
  create(authorId: string, input: CreateEventCommand): Promise<EventDto>;
  listForAuthor(authorId: string, query: PageQuery): Promise<PaginatedEvent>;
  getById(id: string): Promise<EventRecord | null>;
}
