export const ensureEnvKey = (source: string, key: string): { source: string; added: boolean } => {
  const re = new RegExp(`^${key}=`, 'm');
  if (re.test(source)) return { source, added: false };
  const next = source.endsWith('\n') || source.length === 0 ? source : `${source}\n`;
  return { source: `${next}${key}=\n`, added: true };
};

export const ensureJsonDep = (
  json: string,
  name: string,
  spec: string,
): { source: string; added: boolean } => {
  const pkg = JSON.parse(json) as { dependencies?: Record<string, string> };
  pkg.dependencies ??= {};
  if (pkg.dependencies[name]) return { source: json, added: false };
  pkg.dependencies[name] = spec;
  return { source: `${JSON.stringify(pkg, null, 2)}\n`, added: true };
};

export const insertAfterLastImport = (source: string, statement: string): string => {
  if (source.includes(statement.trim())) return source;
  const lines = source.split('\n');
  let lastImport = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i]?.startsWith('import ')) lastImport = i;
  }
  if (lastImport < 0) {
    return `${statement}\n${source}`;
  }
  lines.splice(lastImport + 1, 0, statement);
  return lines.join('\n');
};

export const ensureMarkerBlock = (
  source: string,
  name: string,
  body: string,
  insertBefore?: string,
): string => {
  const start = `// --- ysk-add:${name} ---`;
  if (source.includes(start)) return source;
  const block = `${start}\n${body}\n// --- ysk-add:${name}:end ---`;
  if (insertBefore && source.includes(insertBefore)) {
    return source.replace(insertBefore, `${block}\n${insertBefore}`);
  }
  const next = source.endsWith('\n') ? source : `${source}\n`;
  return `${next}${block}\n`;
};

export const insertBeforeMatch = (source: string, match: string, insert: string): string => {
  if (source.includes(insert.trim())) return source;
  const index = source.indexOf(match);
  if (index < 0) return source;
  return `${source.slice(0, index)}${insert}${source.slice(index)}`;
};
