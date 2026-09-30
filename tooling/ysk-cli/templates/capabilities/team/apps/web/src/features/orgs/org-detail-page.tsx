import { useNavigate } from '@tanstack/react-router';
import { InviteMemberCommandSchema } from '@ysk-kit/contracts';
import {
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ysk-kit/ui';
import { orgRoleCan } from '@ysk-kit/ui-logic';
import { createOrganizationHooks } from '@ysk-kit/web-sdk';
import { type FormEvent, useState } from 'react';
import { api, userHooks } from '../../lib/client';

const orgHooks = createOrganizationHooks(api);

export function OrgDetailPage({ organizationId }: { organizationId: string }) {
  const me = userHooks.useMe();
  const org = orgHooks.useOrganization(organizationId);
  const members = orgHooks.useOrganizationMembers(organizationId);
  const myRole = members.data?.find((row) => row.userId === me.data?.id)?.role;
  const canInvite = myRole ? orgRoleCan(myRole, 'org.invite') : false;
  const canRemove = myRole ? orgRoleCan(myRole, 'org.member.remove') : false;
  const canBill = myRole ? orgRoleCan(myRole, 'org.billing') : false;
  const invites = orgHooks.useOrganizationInvites(organizationId, canInvite);
  const invite = orgHooks.useInviteMember(organizationId);
  const removeMember = orgHooks.useRemoveMember(organizationId);
  const leave = orgHooks.useLeaveOrganization();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const onInvite = (event: FormEvent) => {
    event.preventDefault();
    const parsed = InviteMemberCommandSchema.safeParse({ email, role: 'MEMBER' });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid');
      return;
    }
    setFormError(null);
    invite.mutate(parsed.data, {
      onSuccess: () => setEmail(''),
      onError: (error) => setFormError(error.message),
    });
  };

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">{org.data?.name ?? 'Organization'}</h1>
      {canBill ? (
        <a
          href={`/orgs/${organizationId}/billing`}
          className="text-sm text-zinc-600 hover:text-zinc-900"
        >
          Billing
        </a>
      ) : null}
      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
      {canInvite ? (
        <form onSubmit={onInvite} className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-sm" htmlFor="invite-email">
            Invite email
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <Button type="submit" disabled={invite.isPending}>
            Invite
          </Button>
        </form>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {(members.data ?? []).map((member) => (
            <TableRow key={member.id}>
              <TableCell>{member.displayName}</TableCell>
              <TableCell>{member.email}</TableCell>
              <TableCell>{member.role}</TableCell>
              <TableCell>
                {canRemove && member.userId !== me.data?.id ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeMember.mutate(member.userId)}
                  >
                    Remove
                  </Button>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {canInvite && (invites.data?.length ?? 0) > 0 ? (
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Pending invites</h2>
          <ul className="text-sm text-zinc-600">
            {(invites.data ?? []).map((row) => (
              <li key={row.id}>
                {row.email} · {row.role}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          leave.mutate(organizationId, {
            onSuccess: () => {
              void navigate({ to: '/orgs' });
            },
            onError: (error) => setFormError(error.message),
          })
        }
      >
        Leave
      </Button>
    </section>
  );
}
