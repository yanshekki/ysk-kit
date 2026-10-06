import { ErrSchema, type Platform } from '@ysk-kit/contracts';
import { AppError } from '@ysk-kit/domain-kernel';
import type { TokenStore } from './token-store.js';

export class HttpClient {
  private refreshing: Promise<boolean> | null = null;

  constructor(
    private readonly opts: {
      baseUrl: string;
      tokenStore: TokenStore;
      platform: Platform;
      fetchImpl?: typeof fetch;
      onRefreshed?: (access: string, refresh: string) => Promise<void>;
    },
  ) {}

  async request<T>(path: string, init: RequestInit = {}, didRefresh = false): Promise<T> {
    const fetchImpl = this.opts.fetchImpl ?? fetch;
    const token = await this.opts.tokenStore.get();
    const headers = new Headers(init.headers);
    if (!headers.has('content-type') && init.body) headers.set('content-type', 'application/json');
    headers.set('x-ysk-platform', this.opts.platform);
    if (token) headers.set('authorization', `Bearer ${token}`);

    const res = await fetchImpl(`${this.opts.baseUrl}${path}`, { ...init, headers });
    const json: unknown = await res.json().catch(() => null);
    const failed = ErrSchema.safeParse(json);
    if (
      failed.success &&
      failed.data.error.code === 'UNAUTHENTICATED' &&
      !didRefresh &&
      token &&
      !path.startsWith('/v1/auth/')
    ) {
      const ok = await this.refreshOnce();
      if (ok) return this.request<T>(path, init, true);
    }
    if (failed.success) {
      throw new AppError(
        failed.data.error.code,
        failed.data.error.message,
        res.status,
        failed.data.error.details,
      );
    }
    if (!res.ok) {
      throw new AppError('INTERNAL', `HTTP ${res.status}`, res.status);
    }
    if (typeof json === 'object' && json !== null && 'ok' in json && 'data' in json) {
      return (json as { ok: true; data: T }).data;
    }
    throw new AppError('INTERNAL', 'Malformed response', res.status);
  }

  async requestLocation(path: string): Promise<string> {
    const fetchImpl = this.opts.fetchImpl ?? fetch;
    const token = await this.opts.tokenStore.get();
    const headers = new Headers();
    headers.set('x-ysk-platform', this.opts.platform);
    if (token) headers.set('authorization', `Bearer ${token}`);
    const res = await fetchImpl(`${this.opts.baseUrl}${path}`, {
      method: 'GET',
      headers,
      redirect: 'manual',
    });
    if (res.status === 302 || res.status === 301) {
      const location = res.headers.get('location');
      if (location) return location;
    }
    const json: unknown = await res.json().catch(() => null);
    const failed = ErrSchema.safeParse(json);
    if (failed.success) {
      throw new AppError(
        failed.data.error.code,
        failed.data.error.message,
        res.status,
        failed.data.error.details,
      );
    }
    throw new AppError('NOT_FOUND', 'Invoice PDF not found', res.status);
  }

  private refreshOnce(): Promise<boolean> {
    if (!this.refreshing) {
      this.refreshing = this.doRefresh().finally(() => {
        this.refreshing = null;
      });
    }
    return this.refreshing;
  }

  private async doRefresh(): Promise<boolean> {
    const refresh = await this.opts.tokenStore.getRefresh?.();
    if (!refresh) {
      await this.opts.tokenStore.clear();
      return false;
    }
    try {
      const fetchImpl = this.opts.fetchImpl ?? fetch;
      const res = await fetchImpl(`${this.opts.baseUrl}/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-ysk-platform': this.opts.platform,
        },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      const json: unknown = await res.json();
      if (
        typeof json === 'object' &&
        json !== null &&
        'ok' in json &&
        (json as { ok: unknown }).ok === true &&
        'data' in json
      ) {
        const data = (json as { data: { accessToken: string; refreshToken: string } }).data;
        if (this.opts.tokenStore.setPair) {
          await this.opts.tokenStore.setPair(data.accessToken, data.refreshToken);
        } else {
          await this.opts.tokenStore.set(data.accessToken);
        }
        await this.opts.onRefreshed?.(data.accessToken, data.refreshToken);
        return true;
      }
    } catch {
      /* fall through */
    }
    await this.opts.tokenStore.clear();
    return false;
  }
}
