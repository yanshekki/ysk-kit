export interface IRealtimePort {
  emitToUser(userId: string, event: string, payload: unknown): Promise<void>;
  close(): Promise<void>;
}

export const SOCKET_IO_REDIS_KEY = 'ysk-socket.io';
