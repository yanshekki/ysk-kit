export type PrismaBlock = { name: string; block: string };

export type PrismaMergeOpts = {
  userFields?: string[];
  organizationFields?: string[];
};

export const extractEnums = (fragment: string): PrismaBlock[] => {
  const blocks: PrismaBlock[] = [];
  const re = /enum\s+(\w+)\s*\{[^}]*\}/g;
  let match = re.exec(fragment);
  while (match) {
    blocks.push({ name: match[1] ?? '', block: match[0].trim() });
    match = re.exec(fragment);
  }
  return blocks;
};

export const extractModels = (fragment: string): PrismaBlock[] => {
  const blocks: PrismaBlock[] = [];
  const re = /model\s+(\w+)\s*\{[\s\S]*?\n\}/g;
  let match = re.exec(fragment);
  while (match) {
    blocks.push({ name: match[1] ?? '', block: match[0].trim() });
    match = re.exec(fragment);
  }
  return blocks;
};

const hasEnum = (schema: string, name: string): boolean =>
  new RegExp(`enum\\s+${name}\\s*\\{`).test(schema);

const hasModel = (schema: string, name: string): boolean =>
  new RegExp(`model\\s+${name}\\s*\\{`).test(schema);

const ensureModelFields = (
  schema: string,
  model: string,
  fields: string[],
  actions: string[],
): string => {
  if (fields.length === 0) return schema;
  const header = schema.match(new RegExp(`model\\s+${model}\\s*\\{`));
  if (!header || header.index === undefined) {
    actions.push(`skipped ${model} fields (no model ${model})`);
    return schema;
  }
  const start = header.index + header[0].length;
  const end = schema.indexOf('\n}', start);
  if (end < 0) {
    actions.push(`skipped ${model} fields (unterminated model ${model})`);
    return schema;
  }
  const body = schema.slice(start, end);
  const extra: string[] = [];
  for (const field of fields) {
    const name = field.trim().split(/\s+/)[0];
    if (!name) continue;
    if (body.includes(name)) {
      actions.push(`skipped field ${model}.${name}`);
    } else {
      extra.push(`  ${field.trim()}`);
      actions.push(`added field ${model}.${name}`);
    }
  }
  if (extra.length === 0) return schema;
  return `${schema.slice(0, end)}\n${extra.join('\n')}${schema.slice(end)}`;
};

export const mergePrisma = (
  schema: string,
  fragment: string,
  opts: PrismaMergeOpts = {},
): { schema: string; actions: string[] } => {
  const actions: string[] = [];
  let next = schema;

  for (const item of extractEnums(fragment)) {
    if (hasEnum(next, item.name)) {
      actions.push(`skipped enum ${item.name}`);
      continue;
    }
    const firstModel = next.search(/model\s+\w+/);
    const at = firstModel >= 0 ? firstModel : next.length;
    const prefix = next.slice(0, at);
    const pad = prefix.endsWith('\n\n') || prefix.length === 0 ? '' : '\n';
    next = `${prefix}${pad}${item.block}\n\n${next.slice(at)}`;
    actions.push(`added enum ${item.name}`);
  }

  next = ensureModelFields(next, 'User', opts.userFields ?? [], actions);
  next = ensureModelFields(next, 'Organization', opts.organizationFields ?? [], actions);

  for (const item of extractModels(fragment)) {
    if (item.name === 'User') {
      actions.push('skipped model User');
      continue;
    }
    if (hasModel(next, item.name)) {
      actions.push(`skipped model ${item.name}`);
      continue;
    }
    const pad = next.endsWith('\n') ? '' : '\n';
    next = `${next}${pad}\n${item.block}\n`;
    actions.push(`added model ${item.name}`);
  }

  return { schema: next, actions };
};
