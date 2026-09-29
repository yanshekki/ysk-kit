import { CreateUserCommandSchema } from '@ysk/contracts';
import {
  Button,
  Can,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ysk/ui';
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
      <h1 className="text-2xl font-semibold">Admin · Users</h1>
      <Can role={me.data?.role ?? 'USER'} permission="user.create">
        <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-sm" htmlFor="admin-user-email">
            Email
            <Input
              id="admin-user-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </label>
          <label className="grid gap-1 text-sm" htmlFor="admin-user-name">
            Display name
            <Input
              id="admin-user-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </label>
          <Button type="submit" disabled={createUser.isPending}>
            Create
          </Button>
        </form>
      </Can>
      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
      {users.error ? <p className="text-sm text-red-600">{users.error.message}</p> : null}
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
          {(users.data?.items ?? []).map((user) => (
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
    </section>
  );
}
