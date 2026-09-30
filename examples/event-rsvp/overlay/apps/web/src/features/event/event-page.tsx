import { CreateEventCommandSchema } from '@ysk-kit/contracts';
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
import { createEventHooks } from '@ysk-kit/web-sdk';
import { type FormEvent, useState } from 'react';
import { api } from '../../lib/client';

const hooks = createEventHooks(api);

const localDatetimeValue = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

export function EventPage() {
  const list = hooks.useList();
  const create = hooks.useCreate();
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [startsLocal, setStartsLocal] = useState(() =>
    localDatetimeValue(new Date(Date.now() + 24 * 3600_000).toISOString()),
  );
  const [capacity, setCapacity] = useState('20');
  const [formError, setFormError] = useState<string | null>(null);
  const items = list.data?.items ?? [];

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = CreateEventCommandSchema.safeParse({
      title,
      venue,
      startsAt: new Date(startsLocal).toISOString(),
      capacity: Number(capacity),
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid');
      return;
    }
    create.mutate(parsed.data, {
      onSuccess: () => {
        setTitle('');
        setVenue('');
        setFormError(null);
      },
      onError: (error) => setFormError(error.message),
    });
  };

  return (
    <section className="space-y-6">
      <PageHeader title="Events" description="Host a talk. Capacity must be a positive integer." />
      <form onSubmit={onSubmit} className="grid max-w-md gap-3" noValidate>
        <FormField label="Title" htmlFor="event-title">
          <Input
            id="event-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Venue" htmlFor="event-venue">
          <Input
            id="event-venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Starts at" htmlFor="event-starts-at">
          <Input
            id="event-starts-at"
            type="datetime-local"
            value={startsLocal}
            onChange={(e) => setStartsLocal(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Capacity" htmlFor="event-capacity">
          <Input
            id="event-capacity"
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
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
        <EmptyState title="No events" description="Create an event to populate this table." />
      ) : null}
      {items.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Starts</TableHead>
              <TableHead>Capacity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.title}</TableCell>
                <TableCell>{item.venue}</TableCell>
                <TableCell>{item.startsAt}</TableCell>
                <TableCell>{item.capacity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </section>
  );
}
