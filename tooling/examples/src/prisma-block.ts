export const replacePrismaModel = (schema: string, name: string, fragment: string): string => {
  const startNeedle = `model ${name} {`;
  const start = schema.indexOf(startNeedle);
  const block = `${fragment.trim()}\n`;
  if (start < 0) {
    return `${schema.trimEnd()}\n\n${block}`;
  }
  const brace = schema.indexOf('{', start);
  if (brace < 0) throw new Error(`model ${name} has no opening brace`);
  let depth = 0;
  for (let i = brace; i < schema.length; i += 1) {
    const ch = schema[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        const from = schema.lastIndexOf('\n', start - 1) + 1;
        let end = i + 1;
        while (schema[end] === '\n') end += 1;
        return `${schema.slice(0, from)}${block}\n${schema.slice(end)}`;
      }
    }
  }
  throw new Error(`unclosed model ${name}`);
};
