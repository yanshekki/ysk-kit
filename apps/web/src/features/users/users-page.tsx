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
import { userStatusLabel } from '@ysk/ui-logic';
import { type FormEvent, useState } from 'react';
import { userHooks } from '../../lib/client';

export function UsersPage() {
  const me = userHooks.useMe();
  const users = userHooks.useUsers();
  const createUser = userHooks.useCreateUser();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = CreateUserCommandSchema.safeParse({ email, displayName });
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
      <h1 className="text-2xl font-semibold">Users</h1>
      <Can role={me.data?.role ?? 'USER'} permission="user.create">
        <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-sm" htmlFor="web-user-email">
            Email
            <Input
              id="web-user-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </label>
          <label className="grid gap-1 text-sm" htmlFor="web-user-name">
            Display name
            <Input
              id="web-user-name"
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
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(users.data?.items ?? []).map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.displayName}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{userStatusLabel(user.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
