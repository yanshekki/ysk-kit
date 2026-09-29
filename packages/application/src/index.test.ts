import { describe, expect, it } from 'vitest';
import { parsePageQuery, slicePage } from './index';

describe('application pagination', () => {
  it('defaults limit to 20', () => {
    expect(parsePageQuery({})).toEqual({ cursor: undefined, limit: 20 });
  });

  it('returns a next cursor when extra rows exist', () => {
    const rows = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    expect(slicePage(rows, 2)).toEqual({ items: [{ id: 'a' }, { id: 'b' }], nextCursor: 'b' });
    expect(slicePage(rows, 5).nextCursor).toBeNull();
  });
});
