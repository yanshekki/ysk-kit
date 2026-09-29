import { describe, expect, it } from 'vitest';
import { securityHeaders } from './security-headers';

describe('securityHeaders', () => {
  it('sets nosniff and deny framing on JSON routes', () => {
    const headers = securityHeaders({ production: false });
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['Content-Security-Policy']).toContain("default-src 'none'");
    expect(headers['Strict-Transport-Security']).toBeUndefined();
  });

  it('adds HSTS in production and relaxes CSP for Scalar docs', () => {
    const prod = securityHeaders({ production: true });
    expect(prod['Strict-Transport-Security']).toContain('max-age=31536000');
    const docs = securityHeaders({ production: false, docs: true });
    expect(docs['Content-Security-Policy']).toContain('cdn.jsdelivr.net');
  });
});
