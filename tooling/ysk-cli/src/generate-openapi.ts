import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { buildOpenApiDocument } from '@ysk-kit/api-http';
import { appContract } from '@ysk-kit/contracts';

export const generateOpenApi = (root: string): string => {
  const spec = buildOpenApiDocument(appContract);
  const out = join(root, 'docs/openapi.yaml');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, stringifyYaml(spec));
  return out;
};

const stringifyYaml = (value: unknown, indent = 0): string => {
  const pad = '  '.repeat(indent);
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return value
      .map((item) => {
        if (item && typeof item === 'object') {
          const body = stringifyYaml(item, indent + 1);
          return `${pad}- ${body.trimStart()}`;
        }
        return `${pad}- ${stringifyYaml(item)}`;
      })
      .join('\n');
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    return entries
      .map(([k, v]) => {
        const nested = stringifyYaml(v, indent + 1);
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          return `${pad}${k}:\n${nested}`;
        }
        if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object') {
          return `${pad}${k}:\n${nested}`;
        }
        return `${pad}${k}: ${nested}`;
      })
      .join('\n');
  }
  return JSON.stringify(value);
};
