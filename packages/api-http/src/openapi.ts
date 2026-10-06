import { z } from 'zod';
import { type ContractRouter, flattenContract } from './flatten.js';

const toJsonSchema = (schema: z.ZodType): Record<string, unknown> => {
  try {
    return z.toJSONSchema(schema) as Record<string, unknown>;
  } catch {
    return { type: 'object' };
  }
};

export type OpenApiDocument = {
  openapi: string;
  info: { title: string; version: string };
  paths: Record<string, Record<string, unknown>>;
};

export const buildOpenApiDocument = (contract: ContractRouter): OpenApiDocument => {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const { key, route } of flattenContract(contract)) {
    const path = route.path.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
    const method = route.method.toLowerCase();
    const operation: Record<string, unknown> = {
      operationId: key,
      responses: {
        '200': { description: 'OK' },
      },
    };
    if (route.body) {
      operation.requestBody = {
        required: true,
        content: { 'application/json': { schema: toJsonSchema(route.body) } },
      };
    }
    if (route.query) {
      operation.parameters = [
        {
          in: 'query',
          name: 'query',
          schema: toJsonSchema(route.query),
        },
      ];
    }
    paths[path] ??= {};
    paths[path][method] = operation;
  }
  return {
    openapi: '3.1.0',
    info: { title: 'YSK Kit API', version: '0.1.0' },
    paths,
  };
};

export const scalarDocsHtml = (specUrl = '/openapi.json'): string => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>YSK Kit API</title>
</head>
<body>
  <script id="api-reference" data-url="${specUrl}"></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>
`;
