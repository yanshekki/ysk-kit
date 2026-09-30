import { describe, expect, it } from 'vitest';
import { createStockMoveService } from '../application/stock-move-service';
import { createMemoryStockMoveRepository } from './memory-stock-move-repository';

describe('stock-move HTTP placeholder', () => {
  it('lists nothing on an empty memory repo', async () => {
    const service = createStockMoveService(createMemoryStockMoveRepository());
    const page = await service.list('11111111-1111-1111-1111-111111111111', { limit: 20 });
    expect(page.items).toHaveLength(0);
  });
});
