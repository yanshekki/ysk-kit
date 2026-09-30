import type { CreateRsvpCommand, PageQuery, PaginatedRsvp, RsvpDto } from '@ysk-kit/contracts';

export type RsvpRecord = {
  id: string;
  eventId: string;
  attendeeName: string;
  email: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type RsvpEventRef = { id: string; capacity: number };

export interface IRsvpRepository {
  create(authorId: string, input: CreateRsvpCommand): Promise<RsvpDto>;
  listForAuthor(authorId: string, query: PageQuery): Promise<PaginatedRsvp>;
  getEvent(id: string): Promise<RsvpEventRef | null>;
  countForEvent(eventId: string): Promise<number>;
  findByEventEmail(eventId: string, email: string): Promise<RsvpRecord | null>;
}
