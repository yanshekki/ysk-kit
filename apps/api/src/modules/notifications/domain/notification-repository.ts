import type { NotificationType, PageQuery, PaginatedNotifications } from '@ysk-kit/contracts';

export type NotificationRecord = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
};

export interface INotificationRepository {
  create(input: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
  }): Promise<NotificationRecord>;
  listForUser(userId: string, query: PageQuery): Promise<PaginatedNotifications>;
  markRead(id: string, userId: string, at: Date): Promise<boolean>;
}
