import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { exampleRoot } from './paths';

export type CaptureClickRole = 'link' | 'button';

export type CaptureStep =
  | { login: true }
  | { goto: string }
  | { click: { role: CaptureClickRole; name: string } }
  | { fill: { label: string; value: string } }
  | { submit: string }
  | { waitText: string }
  | { waitCell: string }
  | { waitAlert: true }
  | { waitUrl: string }
  | { waitHeading: string }
  | { shot: string; fullPage?: boolean }
  | { docs: { path: string; shot?: string } };

export type CaptureScript = { steps: CaptureStep[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseClick = (value: unknown): CaptureStep => {
  if (!isRecord(value) || (value.role !== 'link' && value.role !== 'button')) {
    throw new Error('click.role must be link or button');
  }
  if (typeof value.name !== 'string' || value.name.length === 0) {
    throw new Error('click.name is required');
  }
  return { click: { role: value.role, name: value.name } };
};

const parseFill = (value: unknown): CaptureStep => {
  if (!isRecord(value) || typeof value.label !== 'string' || typeof value.value !== 'string') {
    throw new Error('fill needs label and value strings');
  }
  return { fill: { label: value.label, value: value.value } };
};

const parseDocs = (value: unknown): CaptureStep => {
  if (!isRecord(value) || typeof value.path !== 'string' || value.path.length === 0) {
    throw new Error('docs.path is required');
  }
  return {
    docs: {
      path: value.path,
      ...(typeof value.shot === 'string' ? { shot: value.shot } : {}),
    },
  };
};

export const parseCaptureStep = (raw: unknown, index: number): CaptureStep => {
  if (!isRecord(raw)) throw new Error(`capture step ${index} must be an object`);
  if (raw.login === true) return { login: true };
  if (typeof raw.goto === 'string') return { goto: raw.goto };
  if ('click' in raw) return parseClick(raw.click);
  if ('fill' in raw) return parseFill(raw.fill);
  if (typeof raw.submit === 'string') return { submit: raw.submit };
  if (typeof raw.waitText === 'string') return { waitText: raw.waitText };
  if (typeof raw.waitCell === 'string') return { waitCell: raw.waitCell };
  if (raw.waitAlert === true) return { waitAlert: true };
  if (typeof raw.waitUrl === 'string') return { waitUrl: raw.waitUrl };
  if (typeof raw.waitHeading === 'string') return { waitHeading: raw.waitHeading };
  if (typeof raw.shot === 'string') {
    return {
      shot: raw.shot,
      ...(raw.fullPage === false ? { fullPage: false } : { fullPage: true }),
    };
  }
  if ('docs' in raw) return parseDocs(raw.docs);
  throw new Error(`capture step ${index} has no recognised action`);
};

export const parseCaptureScript = (raw: unknown): CaptureScript => {
  if (!isRecord(raw) || !Array.isArray(raw.steps)) {
    throw new Error('capture.json needs a steps array');
  }
  return { steps: raw.steps.map((step, index) => parseCaptureStep(step, index)) };
};

export const loadCaptureScript = (slug: string): CaptureScript => {
  const path = join(exampleRoot(slug), 'capture.json');
  if (!existsSync(path)) throw new Error(`missing ${path}`);
  return parseCaptureScript(JSON.parse(readFileSync(path, 'utf8')) as unknown);
};

export const expandCaptureValue = (value: string, now = (): Date => new Date()): string => {
  if (value !== '$futureLocal' && value !== '$futureDate') return value;
  const starts = new Date(now().getTime() + 7 * 24 * 3600_000);
  const local = new Date(starts.getTime() - starts.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, value === '$futureDate' ? 10 : 16);
  return local;
};
