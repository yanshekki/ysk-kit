import { CreateUserCommandSchema } from '@ysk-kit/contracts';
import {
  Button,
  Can,
  EmptyState,
  ErrorBanner,
  FormField,
  Input,
  PageHeader,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ysk-kit/ui';
import { type FormEvent, useState } from 'react';
import { userHooks } from '../../lib/client';

export function UsersPage() {
  const me = userHooks.useMe();
  const users = userHooks.useUsers();
  const createUser = userHooks.useCreateUser();
  const suspendUser = userHooks.useSuspendUser();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const items = users.data?.items ?? [];

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = CreateUserCommandSchema.safeParse({ email, displayName, role: 'USER' });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid');
      return;
    }
    setFormError(null);
    createUser.mutate(parsed.data, {
      onSuccess: () => {
        setEmail('');
        setDisplayName('');
      },
      onError: (error) => setFormError(error.message),
    });
  };

  return (
    <section className="space-y-6">
      <PageHeader title="Users" description="Create and suspend accounts." />
      <Can role={me.data?.role ?? 'USER'} permission="user.create">
        <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
          <FormField label="Email" htmlFor="admin-user-email">
            <Input
              id="admin-user-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </FormField>
          <FormField label="Display name" htmlFor="admin-user-name">
            <Input
              id="admin-user-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </FormField>
          <Button type="submit" disabled={createUser.isPending}>
            Create
          </Button>
        </form>
      </Can>
      {formError ? <ErrorBanner message={formError} /> : null}
      {users.error ? <ErrorBanner message={users.error.message} /> : null}
      {users.isPending ? <Spinner /> : null}
      {!users.isPending && !users.error && items.length === 0 ? (
        <EmptyState title="No users" description="Create a user to populate this table." />
      ) : null}
      {!users.isPending && items.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.status}</TableCell>
                <TableCell>
                  <Can role={me.data?.role ?? 'USER'} permission="user.suspend">
                    {user.status !== 'SUSPENDED' && user.id !== me.data?.id ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (window.confirm('Suspend this user?')) suspendUser.mutate(user.id);
                        }}
                      >
                        Suspend
                      </Button>
                    ) : null}
                  </Can>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </section>
  );
}
