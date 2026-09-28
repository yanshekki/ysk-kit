export const UserRole = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  OPS: 'OPS',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export const USER_ROLE_VALUES = Object.values(UserRole) as [UserRole, ...UserRole[]];
