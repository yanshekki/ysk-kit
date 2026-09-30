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

export const EXPRESS_ERROR_HANDLER = '  app.use(errorHandler);';
export const EXPRESS_RETURN_APP = '  return app;';

/** Express only maps `next(error)` for routers registered before `errorHandler`. */
export const expressRouteInsertBefore = (source: string): string =>
  source.includes(EXPRESS_ERROR_HANDLER) ? EXPRESS_ERROR_HANDLER : EXPRESS_RETURN_APP;

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

export const ensureNamedImport = (source: string, moduleName: string, names: string[]): string => {
  const escaped = moduleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`import\\s+(type\\s+)?\\{([^}]*)\\}\\s+from\\s+['"]${escaped}['"]`);
  const match = re.exec(source);
  if (!match || match.index === undefined) {
    return insertAfterLastImport(source, `import { ${names.join(', ')} } from '${moduleName}';`);
  }
  const existing = (match[2] ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const hasName = (name: string) =>
    existing.some((item) => item === name || item === `type ${name}` || item.endsWith(` ${name}`));
  const missing = names.filter((name) => !hasName(name));
  if (missing.length === 0) return source;
  const rebuilt = `import ${match[1] ?? ''}{ ${[...existing, ...missing].join(', ')} } from '${moduleName}'`;
  return `${source.slice(0, match.index)}${rebuilt}${source.slice(match.index + match[0].length)}`;
};
