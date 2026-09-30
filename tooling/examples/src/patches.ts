import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { exampleRoot } from './paths';

export type DestPatch = {
  file: string;
  find: string;
  replace: string;
};

const isSafeRel = (file: string): boolean =>
  file.length > 0 && !file.startsWith('/') && !file.includes('..') && !file.includes('\\');

export const parseDestPatches = (raw: unknown): DestPatch[] => {
  if (!Array.isArray(raw)) throw new Error('patches.json must be an array');
  return raw.map((item, index) => {
    if (
      typeof item !== 'object' ||
      item === null ||
      typeof (item as DestPatch).file !== 'string' ||
      typeof (item as DestPatch).find !== 'string' ||
      typeof (item as DestPatch).replace !== 'string'
    ) {
      throw new Error(`patches.json[${index}] needs file, find, and replace strings`);
    }
    const patch = item as DestPatch;
    if (!isSafeRel(patch.file)) throw new Error(`unsafe patch file ${patch.file}`);
    if (patch.find.length === 0) throw new Error(`patches.json[${index}] find is empty`);
    return { file: patch.file, find: patch.find, replace: patch.replace };
  });
};

export const loadDestPatches = (slug: string): DestPatch[] => {
  const path = join(exampleRoot(slug), 'patches.json');
  if (!existsSync(path)) return [];
  return parseDestPatches(JSON.parse(readFileSync(path, 'utf8')) as unknown);
};

export const applyDestPatches = (dest: string, patches: readonly DestPatch[]): string[] => {
  const logs: string[] = [];
  for (const patch of patches) {
    const path = join(dest, patch.file);
    if (!existsSync(path)) throw new Error(`patch target missing: ${patch.file}`);
    const src = readFileSync(path, 'utf8');
    if (!src.includes(patch.find)) {
      throw new Error(`patch find not found in ${patch.file}: ${patch.find}`);
    }
    writeFileSync(path, src.replace(patch.find, patch.replace));
    logs.push(`patched ${patch.file}`);
  }
  return logs;
};
