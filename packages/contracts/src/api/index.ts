import { initContract } from '@ts-rest/core';
import { apiKeysContract } from './api-keys.js';
import { auditContract } from './audit.js';
import { authContract } from './auth.js';
import { billingContract } from './billing.js';
import { devicesContract } from './devices.js';
import { filesContract } from './files.js';
import { healthContract } from './health.js';
import { llmContract } from './llm.js';
import { notificationsContract } from './notifications.js';
import { organizationsContract } from './organizations.js';
import { usersContract } from './users.js';

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

export * from './api-keys.js';
export * from './audit.js';
export * from './auth.js';
export * from './billing.js';
export * from './devices.js';
export * from './files.js';
export * from './health.js';
export * from './llm.js';
export * from './notifications.js';
export * from './organizations.js';
export * from './users.js';
