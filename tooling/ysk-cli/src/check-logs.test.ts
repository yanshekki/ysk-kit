import { describe, expect, it } from 'vitest';
import { checkLogs, formatLogReport } from './check-logs.js';
import { HELP } from './help.js';

describe('ysk-kit check logs', () => {
  it('help documents check logs', () => {
    expect(HELP).toContain('check logs');
  });

  it('fails on secret literals and missing requestId', () => {
    const report = checkLogs(
      [
        '{"level":50,"code":"INTERNAL","msg":"request failed"}',
        '{"level":50,"requestId":"rid-1","code":"INTERNAL","msg":"sk_test_abc123leak"}',
        'pretty not json',
        '{"level":30,"msg":"ok"}',
      ].join('\n'),
    );
    expect(report.internalCount).toBe(2);
    expect(report.errorCount).toBe(2);
    expect(report.skippedNonJson).toBe(1);
    expect(report.findings.map((item) => item.rule).sort()).toEqual([
      'error-missing-request-id',
      'secret-in-log',
    ]);
    expect(formatLogReport(report)).toContain('secret-in-log');
  });

  it('accepts reqId and redacted otp', () => {
    const report = checkLogs(
      '{"level":50,"reqId":"abc","code":"INTERNAL","otp":"[Redacted]","msg":"request failed"}\n',
    );
    expect(report.findings).toEqual([]);
    expect(report.internalCount).toBe(1);
    expect(formatLogReport(report)).toContain('ok');
  });
});
