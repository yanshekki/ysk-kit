import { CreateTicketCommandSchema } from '@ysk/contracts';
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
} from '@ysk/ui';
import { createOrganizationHooks, createTicketHooks } from '@ysk/web-sdk';
import { type FormEvent, useState } from 'react';
import { api } from '../../lib/client';

const orgHooks = createOrganizationHooks(api);
const hooks = createTicketHooks(api);

const selectClass =
  'flex h-9 w-full rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm shadow-sm outline-none focus:border-zinc-500';

export function TicketPage() {
  const orgs = orgHooks.useOrganizations();
  const [organizationId, setOrganizationId] = useState('');
  const list = hooks.useList(organizationId || undefined);
  const create = hooks.useCreate();
  const status = hooks.useStatus();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const items = list.data?.items ?? [];
  const orgRows = orgs.data ?? [];
  const listReady = Boolean(organizationId);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = CreateTicketCommandSchema.safeParse({ title, body, organizationId });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid');
      return;
    }
    create.mutate(parsed.data, {
      onSuccess: () => {
        setTitle('');
        setBody('');
        setFormError(null);
      },
      onError: (error) => setFormError(error.message),
    });
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title="Tickets"
        description="Members may open a ticket and set PENDING. Owners and admins may RESOLVED."
      />
      <form onSubmit={onSubmit} className="grid max-w-md gap-3" noValidate>
        <FormField label="Organization" htmlFor="ticket-org">
          <select
            id="ticket-org"
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
        <FormField label="Title" htmlFor="ticket-title">
          <Input
            id="ticket-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Body" htmlFor="ticket-body">
          <Input id="ticket-body" value={body} onChange={(e) => setBody(e.target.value)} />
        </FormField>
        <Button type="submit" disabled={create.isPending}>
          Create
        </Button>
      </form>
      {formError ? <ErrorBanner message={formError} /> : null}
      {listReady && list.error ? <ErrorBanner message={list.error.message} /> : null}
      {listReady && list.isPending ? <Spinner /> : null}
      {!listReady || (!list.isPending && !list.error && items.length === 0) ? (
        <EmptyState title="No tickets" description="Create a ticket to populate this table." />
      ) : null}
      {items.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Body</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.title}</TableCell>
                <TableCell>{item.body}</TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell>
                  {item.status === 'OPEN' ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => status.mutate({ id: item.id, status: 'PENDING' })}
                    >
                      Set PENDING
                    </Button>
                  ) : null}
                  {item.status === 'PENDING' ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => status.mutate({ id: item.id, status: 'RESOLVED' })}
                    >
                      Set RESOLVED
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </section>
  );
}
