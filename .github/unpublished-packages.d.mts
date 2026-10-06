export type PublicPackage = { name: string; version: string; dir: string };
export type PackageJsonLike = { name?: string; version?: string; private?: boolean };
export type PackageTree = {
  listDir: (rel: string) => string[];
  readJson: (rel: string) => PackageJsonLike;
  resolveDir?: (dir: string, name: string) => string;
};

export function publicPackagesFromTree(tree: PackageTree): PublicPackage[];
export function pendingChangesetFilesFromTree(tree: {
  listDir: (rel: string) => string[];
}): string[];
export function publicPackages(root?: string): PublicPackage[];
export function versionIsInstallable(
  packument: { versions?: Record<string, unknown> } | null | undefined,
  version: string,
): boolean;
export function pendingChangesetFiles(root?: string): string[];
export function shouldSkipRelease(unpublishedCount: number, pendingCount: number): boolean;
export function recoverPlan(input: {
  pendingCount: number;
  unpublishedCount: number;
  tagExists: boolean;
  releaseExists: boolean;
}): 'none' | 'recover';
export function productTagExists(
  tag: string,
  runFn?: (args: readonly string[]) => { status: number | null; stdout: string },
): boolean;
export function githubReleaseExists(
  tag: string,
  runFn?: (args: readonly string[]) => { status: number | null; stdout: string },
): boolean;
