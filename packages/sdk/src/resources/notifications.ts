import type { NotificationDto, PaginatedNotifications } from '@ysk-kit/contracts';
import type { HttpClient } from '../http';

export const notificationsResource = (http: HttpClient) => ({
  list: () => http.request<PaginatedNotifications>('/v1/notifications'),
  markRead: (id: string) =>
    http.request<{ read: true }>(`/v1/notifications/${id}/read`, {
      method: 'POST',
      body: '{}',
    }),
  unread: async (): Promise<NotificationDto[]> => {
    const page = await http.request<PaginatedNotifications>('/v1/notifications');
    return page.items.filter((item) => item.readAt === null);
  },
});
