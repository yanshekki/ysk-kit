import { CreateApiKeyCommandSchema } from '@ysk/contracts';
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
import { type FormEvent, useState } from 'react';
import { userHooks } from '../../lib/client';

export function ApiKeysPage() {
  const keys = userHooks.useApiKeys();
  const createKey = userHooks.useCreateApiKey();
  const revoke = userHooks.useRevokeApiKey();
  const [name, setName] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const onCreate = (event: FormEvent) => {
    event.preventDefault();
    const parsed = CreateApiKeyCommandSchema.safeParse({
      name,
      permissions: ['file.upload'],
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid');
      return;
    }
    setFormError(null);
    createKey.mutate(parsed.data, {
      onSuccess: (created) => {
        setName('');
        setToken(created.token);
      },
      onError: (error) => setFormError(error.message),
    });
  };

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">API keys</h1>
      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
      {token ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
          Copy this token now. It is shown once: <code>{token}</code>
        </p>
      ) : null}
      <form onSubmit={onCreate} className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm" htmlFor="api-key-name">
          Name
          <Input
            id="api-key-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <Button type="submit" disabled={createKey.isPending}>
          Create
        </Button>
      </form>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Prefix</TableHead>
            <TableHead>Last 4</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {(keys.data ?? []).map((key) => (
            <TableRow key={key.id}>
              <TableCell>{key.name}</TableCell>
              <TableCell>{key.prefix}</TableCell>
              <TableCell>{key.last4}</TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => revoke.mutate(key.id)}
                >
                  Revoke
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
