export type PushResult = 'ok' | 'invalid-token' | 'error';

export type PushMessage = {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string> | undefined;
};

export interface IPushPort {
  send(message: PushMessage): Promise<PushResult>;
}
