import { CreateWorkOrderCommandSchema } from '@ysk/contracts';
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
import { createWorkOrderHooks } from '@ysk/web-sdk';
import { type FormEvent, useState } from 'react';
import { api } from '../../lib/client';

const hooks = createWorkOrderHooks(api);

export function WorkOrderPage() {
  const list = hooks.useList();
  const create = hooks.useCreate();
  const assign = hooks.useAssign();
  const complete = hooks.useComplete();
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const items = list.data?.items ?? [];

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = CreateWorkOrderCommandSchema.safeParse({ title, address });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid');
      return;
    }
    create.mutate(parsed.data, {
      onSuccess: () => {
        setTitle('');
        setAddress('');
        setFormError(null);
      },
      onError: (error) => setFormError(error.message),
    });
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title="Work orders"
        description="NEW rows can be assigned. ASSIGNED rows can be completed. Assign also writes Inbox."
      />
      <form onSubmit={onSubmit} className="grid max-w-md gap-3" noValidate>
        <FormField label="Title" htmlFor="work-order-title">
          <Input
            id="work-order-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Address" htmlFor="work-order-address">
          <Input
            id="work-order-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
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
          title="No work orders"
          description="Create a work order to populate this table."
        />
      ) : null}
      {items.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.title}</TableCell>
                <TableCell>{item.address}</TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell>
                  {item.status === 'NEW' ? (
                    <Button type="button" size="sm" onClick={() => assign.mutate(item.id)}>
                      Assign
                    </Button>
                  ) : null}
                  {item.status === 'ASSIGNED' ? (
                    <Button type="button" size="sm" onClick={() => complete.mutate(item.id)}>
                      Complete
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
