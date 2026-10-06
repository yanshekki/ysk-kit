export type GitRun = (
  command: string,
  args: readonly string[],
  options?: object,
) => { status: number | null; stdout: string; stderr: string };

export function gitShow(sha: string, path: string, runFn?: GitRun): string;
export function gitLsTree(sha: string, path: string, runFn?: GitRun): string[];
export function versionBumpCommit(version: string, runFn?: GitRun): string | null;
export function treeAtSha(
  sha: string,
  runFn?: GitRun,
): {
  listDir: (rel: string) => string[];
  readJson: (rel: string) => { name?: string; version?: string; private?: boolean };
  readText: (rel: string) => string;
};
