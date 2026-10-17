export type LogRule = 'secret-in-log' | 'error-missing-request-id';

export type LogFinding = {
  rule: LogRule;
  line: number;
  detail: string;
};

export type LogCheckReport = {
  findings: LogFinding[];
  internalCount: number;
  errorCount: number;
  skippedNonJson: number;
};

const SECRET_RE =
  /sk_live_[A-Za-z0-9]+|sk_test_[A-Za-z0-9]+|rk_live_[A-Za-z0-9]+|rk_test_[A-Za-z0-9]+|whsec_[A-Za-z0-9]+|"otp"\s*:\s*"(?!\[Redacted\])/i;

const isErrorLevel = (parsed: Record<string, unknown>): boolean => {
  const level = parsed.level;
  return level === 'error' || level === 50;
};

const requestIdOf = (parsed: Record<string, unknown>): string | undefined => {
  for (const key of ['requestId', 'reqId'] as const) {
    const value = parsed[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return undefined;
};

const codeOf = (parsed: Record<string, unknown>): string | undefined => {
  if (typeof parsed.code === 'string') return parsed.code;
  const err = parsed.err;
  if (typeof err === 'object' && err !== null && 'code' in err && typeof err.code === 'string') {
    return err.code;
  }
  return undefined;
};

export const checkLogs = (text: string): LogCheckReport => {
  const findings: LogFinding[] = [];
  let internalCount = 0;
  let errorCount = 0;
  let skippedNonJson = 0;
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i] ?? '';
    if (raw.trim().length === 0) continue;
    if (SECRET_RE.test(raw)) {
      findings.push({
        rule: 'secret-in-log',
        line: i + 1,
        detail: 'secret literal in log line',
      });
    }
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      skippedNonJson += 1;
      continue;
    }
    if (!isErrorLevel(parsed)) continue;
    errorCount += 1;
    if (codeOf(parsed) === 'INTERNAL') internalCount += 1;
    if (!requestIdOf(parsed)) {
      findings.push({
        rule: 'error-missing-request-id',
        line: i + 1,
        detail: 'ERROR line missing requestId/reqId',
      });
    }
  }
  return { findings, internalCount, errorCount, skippedNonJson };
};

export const formatLogReport = (report: LogCheckReport): string => {
  const summary = [
    `ysk-kit check logs: errors=${report.errorCount} INTERNAL=${report.internalCount} skippedNonJson=${report.skippedNonJson}`,
  ];
  if (report.findings.length === 0) {
    summary[0] = `${summary[0]} ok`;
    return summary.join('\n');
  }
  const width = Math.max(...report.findings.map((item) => item.rule.length));
  return [
    summary[0],
    ...report.findings.map(
      (item) => `${item.rule.padEnd(width)}  line ${item.line}  ${item.detail}`,
    ),
  ].join('\n');
};
