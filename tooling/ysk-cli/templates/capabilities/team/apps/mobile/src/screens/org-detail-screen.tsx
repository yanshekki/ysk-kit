import {
  InviteMemberCommandSchema,
  type MembershipDto,
  type OrganizationDto,
  type OrgInviteDto,
  type UserDto,
} from '@ysk-kit/contracts';
import { orgRoleCan } from '@ysk-kit/ui-logic';
import { useEffect, useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import { api } from '../lib/client';

const fetchOrgDetail = (organizationId: string) =>
  Promise.all([
    api.auth.me(),
    api.organizations.get(organizationId),
    api.organizations.members(organizationId),
  ]).then(([meUser, orgDto, memberList]) => {
    const role = memberList.find((row) => row.userId === meUser.id)?.role;
    if (role && orgRoleCan(role, 'org.invite')) {
      return api.organizations.invites(organizationId).then((inviteList) => ({
        me: meUser,
        org: orgDto,
        members: memberList,
        invites: inviteList,
      }));
    }
    return {
      me: meUser,
      org: orgDto,
      members: memberList,
      invites: [] as OrgInviteDto[],
    };
  });

export function OrgDetailScreen({
  organizationId,
  onBack,
}: {
  organizationId: string;
  onBack: () => void;
}) {
  const [me, setMe] = useState<UserDto | null>(null);
  const [org, setOrg] = useState<OrganizationDto | null>(null);
  const [members, setMembers] = useState<MembershipDto[]>([]);
  const [invites, setInvites] = useState<OrgInviteDto[]>([]);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const myRole = members.find((row) => row.userId === me?.id)?.role;
  const canInvite = myRole ? orgRoleCan(myRole, 'org.invite') : false;
  const canRemove = myRole ? orgRoleCan(myRole, 'org.member.remove') : false;

  const apply = (row: {
    me: UserDto;
    org: OrganizationDto;
    members: MembershipDto[];
    invites: OrgInviteDto[];
  }) => {
    setMe(row.me);
    setOrg(row.org);
    setMembers(row.members);
    setInvites(row.invites);
  };

  useEffect(() => {
    fetchOrgDetail(organizationId)
      .then((row) => {
        setMe(row.me);
        setOrg(row.org);
        setMembers(row.members);
        setInvites(row.invites);
      })
      .catch((err: Error) => setError(err.message));
  }, [organizationId]);

  const reload = () => {
    fetchOrgDetail(organizationId)
      .then(apply)
      .catch((err: Error) => setError(err.message));
  };

  const invite = () => {
    const parsed = InviteMemberCommandSchema.safeParse({ email, role: 'MEMBER' });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid');
      return;
    }
    setError(null);
    api.organizations
      .invite(organizationId, parsed.data)
      .then(() => {
        setEmail('');
        reload();
      })
      .catch((err: Error) => setError(err.message));
  };

  return (
    <View>
      <Button title="Back" onPress={onBack} />
      <Text>{org?.name ?? 'Organization'}</Text>
      {error ? <Text>{error}</Text> : null}
      {canInvite ? (
        <View>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            value={email}
          />
          <Button title="Invite" onPress={invite} />
        </View>
      ) : null}
      {members.map((member) => (
        <View key={member.id}>
          <Text>
            {member.displayName} · {member.email ?? '—'} · {member.role}
          </Text>
          {canRemove && member.userId !== me?.id ? (
            <Button
              title="Remove"
              onPress={() => {
                api.organizations
                  .removeMember(organizationId, member.userId)
                  .then(() => reload())
                  .catch((err: Error) => setError(err.message));
              }}
            />
          ) : null}
        </View>
      ))}
      {canInvite && invites.length > 0 ? (
        <View>
          <Text>Pending invites</Text>
          {invites.map((row) => (
            <Text key={row.id}>
              {row.email} · {row.role}
            </Text>
          ))}
        </View>
      ) : null}
      <Button
        title="Leave"
        onPress={() => {
          api.organizations
            .leave(organizationId)
            .then(() => onBack())
            .catch((err: Error) => setError(err.message));
        }}
      />
    </View>
  );
}
