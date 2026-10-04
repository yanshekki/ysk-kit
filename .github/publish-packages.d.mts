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
