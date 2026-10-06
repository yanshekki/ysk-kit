export type GitRun = (
  command: string,
  args: readonly string[],
  options?: object,
) => { status: number | null; stdout: string; stderr: string };

export function gitShow(sha: string, path: string, runFn?: GitRun): string;
export function gitLsTree(sha: string, path: string, runFn?: GitRun): string[];
export function versionBumpCommit(version: string, runFn?: GitRun): string | null;
export function provenanceGitCommit(bundle: unknown): string | null;
export function isAncestorOfMain(sha: string, runFn?: GitRun): boolean;
export function resolvePublishSha(input: {
  version: string;
  runFn?: GitRun;
  fetchImpl?: typeof fetch;
  contractsName?: string;
}): Promise<{ sha: string | null; source: 'provenance' | 'heuristic' | 'none' }>;
export function treeAtSha(
  sha: string,
  runFn?: GitRun,
): {
  listDir: (rel: string) => string[];
  readJson: (rel: string) => { name?: string; version?: string; private?: boolean };
  readText: (rel: string) => string;
};
