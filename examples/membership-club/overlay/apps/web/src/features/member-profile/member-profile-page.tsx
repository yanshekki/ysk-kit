import { CreateMemberProfileCommandSchema } from '@ysk-kit/contracts';
import {
  Button,
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
import { createMemberProfileHooks, createOrganizationHooks } from '@ysk-kit/web-sdk';
import { type FormEvent, useState } from 'react';
import { api } from '../../lib/client';

const orgHooks = createOrganizationHooks(api);
const hooks = createMemberProfileHooks(api);

const selectClass =
  'flex h-9 w-full rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm shadow-sm outline-none focus:border-zinc-500';

export function MemberProfilePage() {
  const orgs = orgHooks.useOrganizations();
  const list = hooks.useList();
  const create = hooks.useCreate();
  const [organizationId, setOrganizationId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const items = list.data?.items ?? [];
  const orgRows = orgs.data ?? [];
  const orgName = (id: string): string => orgRows.find((org) => org.id === id)?.name ?? id;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = CreateMemberProfileCommandSchema.safeParse({ displayName, organizationId });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid');
      return;
    }
    create.mutate(parsed.data, {
      onSuccess: () => {
        setDisplayName('');
        setFormError(null);
      },
      onError: (error) => setFormError(error.message),
    });
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title="Member profiles"
        description="One display name per organization. You must be a member of the org."
      />
      <form onSubmit={onSubmit} className="grid max-w-md gap-3" noValidate>
        <FormField label="Organization" htmlFor="member-profile-org">
          <select
            id="member-profile-org"
            className={selectClass}
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            required
          >
            <option value="">Select…</option>
            {orgRows.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Display name" htmlFor="member-profile-display-name">
          <Input
            id="member-profile-display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </FormField>
        <Button type="submit" disabled={create.isPending}>
          Create
        </Button>
      </form>
      {formError ? <ErrorBanner message={formError} /> : null}
      {list.error ? <ErrorBanner message={list.error.message} /> : null}
      {list.isPending ? <Spinner /> : null}
      {!list.isPending && !list.error && items.length === 0 ? (
        <EmptyState
          title="No member profiles"
          description="Create a profile in an organization you belong to."
        />
      ) : null}
      {items.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Display name</TableHead>
              <TableHead>Organization</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.displayName}</TableCell>
                <TableCell>{orgName(item.organizationId)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </section>
  );
}
