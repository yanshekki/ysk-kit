#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, normalize, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const skipDir = new Set(['node_modules', 'dist', 'coverage', '.git', 'generated', '.runs']);

const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    if (skipDir.has(name)) continue;
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path, out);
    else if (name.endsWith('.md')) out.push(path);
  }
  return out;
};

const slug = (heading) =>
  heading
    .replace(/`([^`]*)`/g, '$1')
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s_-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');

const headings = (markdown) => {
  const body = markdown.replace(/```[\s\S]*?```/g, '');
  return new Set(
    [...body.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => slug(match[1] ?? '')).filter(Boolean),
  );
};

const stripFences = (markdown) => markdown.replace(/```[\s\S]*?```/g, '');

const failures = [];
for (const file of walk(root)) {
  const text = readFileSync(file, 'utf8');
  const own = headings(text);
  const body = stripFences(text);
  for (const match of body.matchAll(/!?\[[^\]]*]\(([^)\s]+)\)/g)) {
    const raw = match[1] ?? '';
    if (/^(https?:|mailto:|data:)/i.test(raw)) continue;
    const [pathPart, hash] = raw.split('#');
    const targetPath = pathPart && pathPart.length > 0 ? pathPart : file;
    const absolute =
      pathPart && pathPart.length > 0
        ? resolve(dirname(file), decodeURIComponent(pathPart.split('?')[0] ?? ''))
        : file;
    if (!normalize(absolute).startsWith(root)) {
      failures.push(`${file}: link escapes the repo (${raw})`);
      continue;
    }
    if (pathPart && pathPart.length > 0 && !existsSync(absolute)) {
      failures.push(`${file}: missing ${raw}`);
      continue;
    }
    if (!hash) continue;
    const linked = absolute.endsWith('.md') ? headings(readFileSync(absolute, 'utf8')) : own;
    if (!linked.has(hash.toLowerCase())) {
      failures.push(`${file}: missing heading #${hash} (${targetPath})`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`checked markdown links in ${walk(root).length} files`);
