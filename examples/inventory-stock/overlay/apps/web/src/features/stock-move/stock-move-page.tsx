import { CreateStockMoveCommandSchema, STOCK_MOVE_REASON_VALUES } from '@ysk-kit/contracts';
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
import { createSkuHooks, createStockMoveHooks } from '@ysk-kit/web-sdk';
import { type FormEvent, useState } from 'react';
import { api } from '../../lib/client';

const skuHooks = createSkuHooks(api);
const stockMoveHooks = createStockMoveHooks(api);

const selectClass =
  'flex h-9 w-full rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm shadow-sm outline-none focus:border-zinc-500';

export function StockMovePage() {
  const skus = skuHooks.useList();
  const list = stockMoveHooks.useList();
  const create = stockMoveHooks.useCreate();
  const [skuId, setSkuId] = useState('');
  const [reason, setReason] = useState('');
  const [delta, setDelta] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const items = list.data?.items ?? [];
  const catalog = skus.data?.items ?? [];

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = CreateStockMoveCommandSchema.safeParse({
      skuId,
      reason,
      delta: Number(delta),
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid');
      return;
    }
    create.mutate(parsed.data, {
      onSuccess: () => {
        setDelta('');
        setFormError(null);
      },
      onError: (error) => setFormError(error.message),
    });
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title="Stock moves"
        description="IN adds, OUT subtracts, ADJUST sets on-hand. Quantity cannot go below zero."
      />
      <form onSubmit={onSubmit} className="grid max-w-md gap-3" noValidate>
        <FormField label="Sku" htmlFor="stock-move-sku">
          <select
            id="stock-move-sku"
            className={selectClass}
            value={skuId}
            onChange={(e) => setSkuId(e.target.value)}
            required
          >
            <option value="">Select…</option>
            {catalog.map((item) => (
              <option key={item.id} value={item.id}>
                {item.code}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Reason" htmlFor="stock-move-reason">
          <select
            id="stock-move-reason"
            className={selectClass}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          >
            <option value="">Select…</option>
            {STOCK_MOVE_REASON_VALUES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Delta" htmlFor="stock-move-delta">
          <Input
            id="stock-move-delta"
            type="number"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
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
        <EmptyState title="No stock-moves" description="Create a stock move from an owned sku." />
      ) : null}
      {items.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sku</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Delta</TableHead>
              <TableHead>Quantity on hand</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const sku = catalog.find((row) => row.id === item.skuId);
              return (
                <TableRow key={item.id}>
                  <TableCell>{sku?.code ?? item.skuId}</TableCell>
                  <TableCell>{item.reason}</TableCell>
                  <TableCell>{item.delta}</TableCell>
                  <TableCell>{sku?.qtyOnHand ?? ''}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : null}
    </section>
  );
}
