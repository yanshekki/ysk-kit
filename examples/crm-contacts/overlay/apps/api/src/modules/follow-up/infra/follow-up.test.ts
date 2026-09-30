import { describe, expect, it } from 'vitest';
import { createFollowUpService } from '../application/follow-up-service';
import { createMemoryFollowUpRepository } from './memory-follow-up-repository';

describe('follow-up HTTP placeholder', () => {
  it('lists nothing on an empty memory repo', async () => {
    const service = createFollowUpService(createMemoryFollowUpRepository());
    const page = await service.list('11111111-1111-1111-1111-111111111111', { limit: 20 });
    expect(page.items).toHaveLength(0);
  });
});
