import { ORG_ROLE_VALUES, USER_ROLE_VALUES, USER_STATUS_VALUES } from '@ysk-kit/contracts';

export const parsePrismaEnum = (schema: string, name: string): string[] => {
  const block = schema.match(new RegExp(`enum\\s+${name}\\s*\\{([^}]+)\\}`));
  if (!block?.[1]) return [];
  return block[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('//') && !line.startsWith('@@'));
};

const sameSet = (left: readonly string[], right: readonly string[]): boolean => {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((value) => rightSet.has(value));
};

export const assertPrismaEnumsMatchContracts = (schema: string): void => {
  const status = parsePrismaEnum(schema, 'UserStatus');
  const role = parsePrismaEnum(schema, 'UserRole');
  const orgRole = parsePrismaEnum(schema, 'OrgRole');
  if (!sameSet(status, USER_STATUS_VALUES)) {
    throw new Error(
      `Prisma UserStatus ${JSON.stringify(status)} != contracts ${JSON.stringify(USER_STATUS_VALUES)}`,
    );
  }
  if (!sameSet(role, USER_ROLE_VALUES)) {
    throw new Error(
      `Prisma UserRole ${JSON.stringify(role)} != contracts ${JSON.stringify(USER_ROLE_VALUES)}`,
    );
  }
  if (orgRole.length > 0 && !sameSet(orgRole, ORG_ROLE_VALUES)) {
    throw new Error(
      `Prisma OrgRole ${JSON.stringify(orgRole)} != contracts ${JSON.stringify(ORG_ROLE_VALUES)}`,
    );
  }
};
