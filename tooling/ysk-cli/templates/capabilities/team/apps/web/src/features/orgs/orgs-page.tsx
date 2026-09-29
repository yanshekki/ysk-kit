import { Link } from '@tanstack/react-router';
import { CreateOrganizationCommandSchema } from '@ysk/contracts';
import {
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ysk/ui';
import { createOrganizationHooks } from '@ysk/web-sdk';
import { type FormEvent, useState } from 'react';
import { api } from '../../lib/client';

const orgHooks = createOrganizationHooks(api);

export function OrgsPage() {
  const orgs = orgHooks.useOrganizations();
  const createOrg = orgHooks.useCreateOrganization();
  const [name, setName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = CreateOrganizationCommandSchema.safeParse({ name });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid');
      return;
    }
    setFormError(null);
    createOrg.mutate(parsed.data, {
      onSuccess: () => setName(''),
      onError: (error) => setFormError(error.message),
    });
  };

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Organizations</h1>
      <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm" htmlFor="org-name">
          Name
          <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <Button type="submit" disabled={createOrg.isPending}>
          Create
        </Button>
      </form>
      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
      {orgs.error ? <p className="text-sm text-red-600">{orgs.error.message}</p> : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(orgs.data ?? []).map((org) => (
            <TableRow key={org.id}>
              <TableCell>
                <Link to="/orgs/$organizationId" params={{ organizationId: org.id }}>
                  {org.name}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
