import { describe, expect, it } from 'vitest';
import { expandCaptureValue, loadCaptureScript, parseCaptureScript } from './capture-script';
import { parseDestPatches } from './patches';
import { listExampleSlugs } from './spec';

describe('capture script', () => {
  it('expands future tokens to local calendar values', () => {
    const now = () => new Date('2030-01-15T08:00:00.000Z');
    expect(expandCaptureValue('$futureLocal', now)).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(expandCaptureValue('$futureDate', now)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(expandCaptureValue('chan@ysk.hk', now)).toBe('chan@ysk.hk');
  });

  it('parses the clinic-booking walk', () => {
    const script = loadCaptureScript('clinic-booking');
    expect(script.steps[0]).toEqual({ login: true });
    expect(
      script.steps.some((step) => 'docs' in step && step.docs.path === '/v1/appointment'),
    ).toBe(true);
    expect(script.steps.some((step) => 'shot' in step && step.shot === '02-empty.png')).toBe(true);
  });

  it('parses every catalogue capture.json', () => {
    for (const slug of listExampleSlugs()) {
      const script = loadCaptureScript(slug);
      expect(script.steps[0]).toEqual({ login: true });
      expect(script.steps.some((step) => 'shot' in step)).toBe(true);
      expect(script.steps.some((step) => 'docs' in step)).toBe(true);
    }
  });

  it('rejects an unknown step', () => {
    expect(() => parseCaptureScript({ steps: [{ nope: true }] })).toThrow(/no recognised action/);
  });

  it('rejects a missing find in patches.json', () => {
    expect(() => parseDestPatches([{ file: 'apps/api/src/composition.ts', find: '' }])).toThrow(
      /file, find, and replace/,
    );
  });

  it('parses a composition patch', () => {
    const patches = parseDestPatches([
      {
        file: 'apps/api/src/composition.ts',
        find: 'createWorkOrderService(createPrismaWorkOrderRepository(prisma));',
        replace: 'createWorkOrderService(createPrismaWorkOrderRepository(prisma), queue);',
      },
    ]);
    expect(patches).toHaveLength(1);
    expect(patches[0]?.file).toBe('apps/api/src/composition.ts');
  });
});
