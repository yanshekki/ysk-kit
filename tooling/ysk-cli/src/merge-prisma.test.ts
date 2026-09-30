import { describe, expect, it } from 'vitest';
import { extractEnums, extractModels, mergePrisma } from './merge-prisma';

const fragment = `
enum OrgRole {
  OWNER
  ADMIN
  MEMBER
}

model Organization {
  id String @id
}

model Membership {
  id String @id
}
`;

describe('mergePrisma', () => {
  it('extracts enum and model blocks', () => {
    expect(extractEnums(fragment).map((row) => row.name)).toEqual(['OrgRole']);
    expect(extractModels(fragment).map((row) => row.name)).toEqual(['Organization', 'Membership']);
  });

  it('inserts missing enum, User field, and models', () => {
    const { schema, actions } = mergePrisma(
      `generator client { provider = "prisma-client-js" }\n\nmodel User {\n  id String @id\n}\n`,
      fragment,
      { userFields: ['memberships Membership[]'] },
    );
    expect(schema).toContain('enum OrgRole');
    expect(schema).toContain('memberships Membership[]');
    expect(schema).toContain('model Organization');
    expect(actions).toContain('added enum OrgRole');
    expect(actions).toContain('added field User.memberships');
    expect(actions).toContain('added model Organization');
  });

  it('inserts Organization fields', () => {
    const { schema, actions } = mergePrisma(`model Organization {\n  id String @id\n}\n`, '', {
      organizationFields: ['stripeCustomerId String?', 'subscription Subscription?'],
    });
    expect(schema).toContain('stripeCustomerId String?');
    expect(schema).toContain('subscription Subscription?');
    expect(actions).toContain('added field Organization.stripeCustomerId');
    expect(actions).toContain('added field Organization.subscription');
  });

  it('skips existing enum, model, and User field', () => {
    const living = `enum OrgRole {\n  OWNER\n}\n\nmodel User {\n  id String @id\n  memberships Membership[]\n}\n\nmodel Organization {\n  id String @id\n}\n`;
    const { schema, actions } = mergePrisma(living, fragment, {
      userFields: ['memberships Membership[]'],
    });
    expect(schema.match(/model Organization/g)).toHaveLength(1);
    expect(schema.match(/enum OrgRole/g)).toHaveLength(1);
    expect(actions).toContain('skipped enum OrgRole');
    expect(actions).toContain('skipped model Organization');
    expect(actions).toContain('skipped field User.memberships');
  });

  it('strips @db native types when the dest provider is sqlite', () => {
    const { schema } = mergePrisma(
      `datasource db {\n  provider = "sqlite"\n}\n\nmodel User {\n  id String @id\n}\n`,
      `model Device {\n  id String @id\n  token String @db.VarChar(512)\n}\n`,
    );
    expect(schema).toContain('model Device');
    expect(schema).toContain('token String');
    expect(schema).not.toContain('@db.');
  });
});
