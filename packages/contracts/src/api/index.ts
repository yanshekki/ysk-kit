import { initContract } from '@ts-rest/core';
import { apiKeysContract } from './api-keys';
import { auditContract } from './audit';
import { authContract } from './auth';
import { billingContract } from './billing';
import { devicesContract } from './devices';
import { filesContract } from './files';
import { healthContract } from './health';
import { llmContract } from './llm';
import { notificationsContract } from './notifications';
import { organizationsContract } from './organizations';
import { usersContract } from './users';

const c = initContract();

export const appContract = c.router({
  health: healthContract,
  auth: authContract,
  users: usersContract,
  audit: auditContract,
  files: filesContract,
  notifications: notificationsContract,
  llm: llmContract,
  devices: devicesContract,
  organizations: organizationsContract,
  apiKeys: apiKeysContract,
  billing: billingContract,
});

export type AppContract = typeof appContract;

export * from './api-keys';
export * from './audit';
export * from './auth';
export * from './billing';
export * from './devices';
export * from './files';
export * from './health';
export * from './llm';
export * from './notifications';
export * from './organizations';
export * from './users';
