import { CreateFollowUpCommandSchema } from '@ysk/contracts';
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
import { createContactHooks, createFollowUpHooks } from '@ysk/web-sdk';
import { type FormEvent, useState } from 'react';
import { api } from '../../lib/client';

const contactHooks = createContactHooks(api);
const followUpHooks = createFollowUpHooks(api);

const selectClass =
  'flex h-9 w-full rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm shadow-sm outline-none focus:border-zinc-500';

const localDatetimeValue = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

export function FollowUpPage() {
  const contacts = contactHooks.useList();
  const list = followUpHooks.useList();
  const create = followUpHooks.useCreate();
  const [contactId, setContactId] = useState('');
  const [dueLocal, setDueLocal] = useState(() =>
    localDatetimeValue(new Date(Date.now() + 24 * 3600_000).toISOString()),
  );
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const items = list.data?.items ?? [];
  const people = contacts.data?.items ?? [];

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = CreateFollowUpCommandSchema.safeParse({
      contactId,
      dueAt: new Date(dueLocal).toISOString(),
      note,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid');
      return;
    }
    create.mutate(parsed.data, {
      onSuccess: () => {
        setNote('');
        setFormError(null);
      },
      onError: (error) => setFormError(error.message),
    });
  };

  return (
    <section className="space-y-6">
      <PageHeader title="Follow-ups" description="A follow-up must point at a contact you own." />
      <form onSubmit={onSubmit} className="grid max-w-md gap-3" noValidate>
        <FormField label="Contact" htmlFor="follow-up-contact">
          <select
            id="follow-up-contact"
            className={selectClass}
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            required
          >
            <option value="">Select…</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Due at" htmlFor="follow-up-due">
          <Input
            id="follow-up-due"
            type="datetime-local"
            value={dueLocal}
            onChange={(e) => setDueLocal(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Note" htmlFor="follow-up-note">
          <Input
            id="follow-up-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
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
        <EmptyState title="No follow-ups" description="Create a follow-up from an owned contact." />
      ) : null}
      {items.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Note</TableHead>
              <TableHead>Due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.note}</TableCell>
                <TableCell>{item.dueAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </section>
  );
}
