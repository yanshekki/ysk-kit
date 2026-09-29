import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@ysk/ui';
import { userHooks } from '../../lib/client';

export function NotificationsPage() {
  const list = userHooks.useNotifications();
  const markRead = userHooks.useMarkNotificationRead();

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      {list.error ? <p className="text-sm text-red-600">{list.error.message}</p> : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Body</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {(list.data?.items ?? []).map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.title}</TableCell>
              <TableCell>{item.body}</TableCell>
              <TableCell>
                {item.readAt ? null : (
                  <Button size="sm" variant="outline" onClick={() => markRead.mutate(item.id)}>
                    Mark read
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
