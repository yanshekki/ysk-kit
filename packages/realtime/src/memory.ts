import type { IRealtimePort } from './port.js';

export type MemoryRealtime = IRealtimePort & {
  events: Array<{ userId: string; event: string; payload: unknown }>;
};

export const createMemoryRealtime = (): MemoryRealtime => {
  const events: MemoryRealtime['events'] = [];
  return {
    events,
    async emitToUser(userId, event, payload) {
      events.push({ userId, event, payload });
    },
    async close() {},
  };
};
