export function publicPackages(): { name: string; version: string; dir: string }[];
export function versionIsInstallable(
  packument: { versions?: Record<string, unknown> } | null | undefined,
  version: string,
): boolean;
export function pendingChangesetFiles(root?: string): string[];
export function shouldSkipRelease(unpublishedCount: number, pendingCount: number): boolean;
