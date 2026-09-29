export type EnvelopeOk<T> = { ok: true; data: T };
export type EnvelopeErr = { ok: false; error: { code: string; message: string } };
export type Envelope<T> = EnvelopeOk<T> | EnvelopeErr;

export class YskApiError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'YskApiError';
  }
}

export const unwrapEnvelope = <T>(json: Envelope<T>): T => {
  if (json.ok) return json.data;
  throw new YskApiError(json.error.code, json.error.message);
};

export const createClient = (opts: {
  baseUrl: string;
  getToken?: () => string | undefined;
  platform?: string;
  fetchImpl?: typeof fetch;
}) => {
  const baseUrl = opts.baseUrl.replace(/\/$/, '');
  const fetchImpl = opts.fetchImpl ?? fetch;
  const platform = opts.platform ?? 'web';

  const request = async <T>(
    method: string,
    path: string,
    body?: unknown,
    token?: string,
  ): Promise<T> => {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'x-ysk-platform': platform,
    };
    const bearer = token ?? opts.getToken?.();
    if (bearer) headers.authorization = `Bearer ${bearer}`;
    const init: RequestInit = { method, headers };
    if (body !== undefined) {
      headers['content-type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
    const res = await fetchImpl(`${baseUrl}${path}`, init);
    const json = (await res.json()) as Envelope<T>;
    return unwrapEnvelope(json);
  };

  return {
    request,
    health: () => request<{ status: string }>('GET', '/health'),
    login: (email: string, password: string) =>
      request<{ accessToken: string; refreshToken: string }>('POST', '/v1/auth/login', {
        email,
        password,
      }),
  };
};
