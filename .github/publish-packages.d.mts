export function describeAuth(env: NodeJS.ProcessEnv): { oidc: boolean };
export function formatAuth(auth: { oidc: boolean }): string;
export function assertOidc(auth: { oidc: boolean }): void;
export function staticCredentialNames(): string[];
export function assertNoStaticCredential(env: NodeJS.ProcessEnv): void;
export function registryAuthConfigured(values: readonly string[]): boolean;
export function publishPlan(input: {
  installable: boolean;
  accepted: boolean;
}): 'skip' | 'wait' | 'publish';
export const DEFAULT_NPM_VIEW_WAIT_MS: number;
export const DEFAULT_NPM_VIEW_INTERVAL_MS: number;
export const DEFAULT_NPM_VIEW_INTERVAL_MAX_MS: number;
export const NPM_VIEW_BACKOFF: number;
export function npmViewWaitConfig(env?: NodeJS.ProcessEnv): {
  waitMs: number;
  intervalMs: number;
  maxIntervalMs: number;
  backoff: number;
};
export function nextVerifyDelayMs(input: {
  attempt: number;
  intervalMs: number;
  maxIntervalMs: number;
  remainingMs: number;
  backoff?: number;
}): number;
export function verifyOutcome(input: {
  missingCount: number;
  acceptedCount: number;
}): 'ok' | 'warn' | 'fail';
export function versionAccepted(name: string, version: string): Promise<boolean>;
