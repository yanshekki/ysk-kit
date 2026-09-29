import type { HttpHandler } from '@ysk/api-http';

export const healthHandlers = (pingReady: () => Promise<boolean>): Record<string, HttpHandler> => ({
  get: {
    handle: async () => ({ status: 200, body: { ok: true, data: { status: 'ok' } } }),
  },
  ready: {
    handle: async () => {
      try {
        await pingReady();
        return { status: 200, body: { ok: true, data: { status: 'ready' } } };
      } catch {
        return {
          status: 503,
          body: { ok: false, error: { code: 'INTERNAL', message: 'not ready' } },
        };
      }
    },
  },
});
