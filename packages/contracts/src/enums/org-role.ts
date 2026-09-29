import { z } from 'zod';

export const OrgRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;

export type OrgRole = (typeof OrgRole)[keyof typeof OrgRole];
export const ORG_ROLE_VALUES = Object.values(OrgRole) as [OrgRole, ...OrgRole[]];
export const OrgRoleSchema = z.enum(ORG_ROLE_VALUES);

export const InviteOrgRole = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;
export type InviteOrgRole = (typeof InviteOrgRole)[keyof typeof InviteOrgRole];
export const INVITE_ORG_ROLE_VALUES = Object.values(InviteOrgRole) as [
  InviteOrgRole,
  ...InviteOrgRole[],
];
export const InviteOrgRoleSchema = z.enum(INVITE_ORG_ROLE_VALUES);

export const OrgAction = {
  UPDATE: 'org.update',
  INVITE: 'org.invite',
  MEMBER_REMOVE: 'org.member.remove',
  MEMBER_LIST: 'org.member.list',
  BILLING: 'org.billing',
} as const;
export type OrgAction = (typeof OrgAction)[keyof typeof OrgAction];
export const ORG_ACTION_VALUES = Object.values(OrgAction) as [OrgAction, ...OrgAction[]];

export const ORG_ROLE_PERMISSIONS: Record<OrgRole, readonly OrgAction[]> = {
  OWNER: [
    OrgAction.UPDATE,
    OrgAction.INVITE,
    OrgAction.MEMBER_REMOVE,
    OrgAction.MEMBER_LIST,
    OrgAction.BILLING,
  ],
  ADMIN: [OrgAction.INVITE, OrgAction.MEMBER_REMOVE, OrgAction.MEMBER_LIST, OrgAction.BILLING],
  MEMBER: [OrgAction.MEMBER_LIST],
};

export const orgRoleCan = (role: OrgRole, action: OrgAction): boolean =>
  ORG_ROLE_PERMISSIONS[role].includes(action);

export const ORG_ROLE_LABELS: Record<OrgRole, { 'zh-HK': string; en: string }> = {
  OWNER: { 'zh-HK': '擁有人', en: 'Owner' },
  ADMIN: { 'zh-HK': '管理員', en: 'Admin' },
  MEMBER: { 'zh-HK': '成員', en: 'Member' },
};
