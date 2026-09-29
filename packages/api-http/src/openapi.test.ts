import { appContract } from '@ysk/contracts';
import { describe, expect, it } from 'vitest';
import { buildOpenApiDocument, scalarDocsHtml } from './openapi';

describe('buildOpenApiDocument', () => {
  it('emits OpenAPI 3.1 paths from the app contract', () => {
    const spec = buildOpenApiDocument(appContract);
    expect(spec.openapi).toBe('3.1.0');
    expect(spec.paths['/health']).toBeDefined();
    expect(spec.paths['/v1/billing/plans']).toBeDefined();
    expect(scalarDocsHtml()).toContain('api-reference');
    expect(scalarDocsHtml()).toContain('/openapi.json');
  });
});
