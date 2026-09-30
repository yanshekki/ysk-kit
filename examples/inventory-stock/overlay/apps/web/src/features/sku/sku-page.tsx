import { CreateSkuCommandSchema } from '@ysk/contracts';
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
import { createSkuHooks } from '@ysk/web-sdk';
import { type FormEvent, useState } from 'react';
import { api } from '../../lib/client';

const hooks = createSkuHooks(api);

export function SkuPage() {
  const list = hooks.useList();
  const create = hooks.useCreate();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const items = list.data?.items ?? [];

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = CreateSkuCommandSchema.safeParse({
      code,
      name,
      qtyOnHand: Number(qty),
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid');
      return;
    }
    create.mutate(parsed.data, {
      onSuccess: () => {
        setCode('');
        setName('');
        setQty('');
        setFormError(null);
      },
      onError: (error) => setFormError(error.message),
    });
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title="Skus"
        description="Stock keeping units. Code is unique per signed-in account."
      />
      <form onSubmit={onSubmit} className="grid max-w-md gap-3" noValidate>
        <FormField label="Code" htmlFor="sku-code">
          <Input id="sku-code" value={code} onChange={(e) => setCode(e.target.value)} required />
        </FormField>
        <FormField label="Name" htmlFor="sku-name">
          <Input id="sku-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </FormField>
        <FormField label="Quantity on hand" htmlFor="sku-qty">
          <Input
            id="sku-qty"
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
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
        <EmptyState title="No skus" description="Create a sku to populate this table." />
      ) : null}
      {items.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Quantity on hand</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.code}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.qtyOnHand}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </section>
  );
}
