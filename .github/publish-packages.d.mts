export function describeAuth(env: NodeJS.ProcessEnv): { oidc: boolean; token: boolean };
export function formatAuth(auth: { oidc: boolean; token: boolean }): string;
export function publishPlan(input: {
  installable: boolean;
  accepted: boolean;
}): 'skip' | 'wait' | 'publish';
