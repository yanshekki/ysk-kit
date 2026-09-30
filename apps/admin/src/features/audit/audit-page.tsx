import { Can, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@ysk-kit/ui';
import { userHooks } from '../../lib/client';

export function AuditPage() {
  const me = userHooks.useMe();
  const canRead = me.data?.role === 'ADMIN' || me.data?.role === 'OPS';
  const logs = userHooks.useAuditLogs({ limit: 20 }, canRead);

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Audit log</h1>
      <Can role={me.data?.role ?? 'USER'} permission="audit.read">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(logs.data?.items ?? []).map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.action}</TableCell>
                <TableCell>
                  {row.resourceType} {row.resourceId}
                </TableCell>
                <TableCell>{row.actorId ?? '—'}</TableCell>
                <TableCell>{row.createdAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Can>
    </section>
  );
}
