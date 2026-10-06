export const NODE_SHEBANG: string;
export function extraPeerDependencies(): Record<string, string>;
export function extraPeerNames(): string[];
export function cliBinPackages(): { name: string; bin: string }[];
export function productTag(version: string): string;
export function lockstepVersion(pkgs: readonly { version: string }[]): string;
export function relativeSpecifierNeedsJs(spec: string): boolean;
export function resolveRelativeJs(fromFile: string, spec: string): string | null;
export function rewriteRelativeSpecifier(fromFile: string, spec: string): string;
export function rewriteRelativeSpecifiersInSource(fromFile: string, source: string): string;
export function relativeSpecifiersInSource(source: string): string[];
export function hasNodeShebang(source: string): boolean;
export function publicPackageSrcFiles(root: string): string[];
export function extensionlessRelativeImports(root: string): string[];
export function changelogSection(markdown: string, version: string): string;
export function tagPlan(input: {
  headSha: string;
  existingTarget: string | null;
}): 'create' | 'exists';
export function postPublishPlan(input: {
  pendingCount: number;
  allInstallable: boolean;
}): 'version-pr' | 'not-published' | 'tag';
export function npmPackFileName(name: string, version: string): string;
