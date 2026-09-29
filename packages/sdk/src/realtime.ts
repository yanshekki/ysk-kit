import type { Platform } from '@ysk/contracts';
import { io, type Socket } from 'socket.io-client';
import type { TokenStore } from './token-store';

export const connectRealtime = async (opts: {
  baseUrl: string;
  platform: Platform;
  tokenStore: TokenStore;
}): Promise<{
  on: (event: string, handler: (payload: unknown) => void) => void;
  close: () => void;
}> => {
  const token = await opts.tokenStore.get();
  const socket: Socket = io(opts.baseUrl, {
    auth: { token, platform: opts.platform },
    transports: ['websocket', 'polling'],
  });
  return {
    on: (event, handler) => {
      socket.on(event, handler);
    },
    close: () => {
      socket.close();
    },
  };
};
