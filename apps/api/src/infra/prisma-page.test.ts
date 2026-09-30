import { describe, expect, it } from 'vitest';
import { prismaIdCursor } from './prisma-page';

describe('prismaIdCursor', () => {
  it('omits the cursor when absent', () => {
    expect(prismaIdCursor(undefined)).toEqual({});
  });

  it('skips the matched row when a cursor is set', () => {
    expect(prismaIdCursor('abc')).toEqual({ cursor: { id: 'abc' }, skip: 1 });
  });
});
