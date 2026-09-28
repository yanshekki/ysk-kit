import { AppError } from '@ysk/domain-kernel';
import { ErrSchema, type Platform } from '@ysk/contracts';
import type { TokenStore } from './token-store';

export class HttpClient {
  constructor(
    private readonly opts: {
      baseUrl: string;
      tokenStore: TokenStore;
      platform: Platform;
      fetchImpl?: typeof fetch;
    },
  ) {}

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const fetchImpl = this.opts.fetchImpl ?? fetch;
    const token = await this.opts.tokenStore.get();
    const headers = new Headers(init.headers);
    headers.set('content-type', 'application/json');
    headers.set('x-ysk-platform', this.opts.platform);
    if (token) headers.set('authorization', `Bearer ${token}`);

    const res = await fetchImpl(`${this.opts.baseUrl}${path}`, { ...init, headers });
    const json: unknown = await res.json();
    const failed = ErrSchema.safeParse(json);
    if (failed.success) {
      throw new AppError(failed.data.error.code, failed.data.error.message, res.status, failed.data.error.details);
    }
    if (!res.ok) {
      throw new AppError('INTERNAL', `HTTP ${res.status}`, res.status);
    }
    const envelope = json as { ok: true; data: T };
    return envelope.data;
  }
}
