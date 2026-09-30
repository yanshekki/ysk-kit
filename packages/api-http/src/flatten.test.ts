import { appContract } from '@ysk-kit/contracts';
import { describe, expect, it } from 'vitest';
import { flattenContract } from './flatten';

describe('flattenContract', () => {
  it('flattens nested ts-rest routers', () => {
    const routes = flattenContract(appContract);
    const paths = routes.map((r) => `${r.route.method} ${r.route.path}`);
    expect(paths).toContain('GET /health');
    expect(paths).toContain('GET /v1/users');
    expect(paths).toContain('POST /v1/users');
  });
});
