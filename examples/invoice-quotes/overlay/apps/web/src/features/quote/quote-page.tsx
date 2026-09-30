import { CreateQuoteCommandSchema } from '@ysk-kit/contracts';
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
import { formatHkd } from '@ysk-kit/ui-logic';
import { createQuoteHooks } from '@ysk-kit/web-sdk';
import { type FormEvent, useState } from 'react';
import { api } from '../../lib/client';

const hooks = createQuoteHooks(api);

export function QuotePage() {
  const list = hooks.useList();
  const create = hooks.useCreate();
  const send = hooks.useSend();
  const accept = hooks.useAccept();
  const [clientName, setClientName] = useState('');
  const [amountHkd, setAmountHkd] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const items = list.data?.items ?? [];

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = CreateQuoteCommandSchema.safeParse({
      clientName,
      amountHkd: Number(amountHkd),
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid');
      return;
    }
    create.mutate(parsed.data, {
      onSuccess: () => {
        setClientName('');
        setAmountHkd('');
        setFormError(null);
      },
      onError: (error) => setFormError(error.message),
    });
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title="Quotes"
        description="Amounts are stored in cents. Send a DRAFT, then Accept a SENT row."
      />
      <form onSubmit={onSubmit} className="grid max-w-md gap-3" noValidate>
        <FormField label="Client name" htmlFor="quote-client">
          <Input
            id="quote-client"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Amount (cents)" htmlFor="quote-amount">
          <Input
            id="quote-amount"
            type="number"
            min={1}
            value={amountHkd}
            onChange={(e) => setAmountHkd(e.target.value)}
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
        <EmptyState title="No quotes" description="Create a quote to populate this table." />
      ) : null}
      {items.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.clientName}</TableCell>
                <TableCell>{formatHkd(item.amountHkd / 100)}</TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell>
                  <span className="flex gap-2">
                    {item.status === 'DRAFT' ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => send.mutate(item.id)}
                      >
                        Send
                      </Button>
                    ) : null}
                    {item.status === 'SENT' ? (
                      <Button type="button" size="sm" onClick={() => accept.mutate(item.id)}>
                        Accept
                      </Button>
                    ) : null}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </section>
  );
}
