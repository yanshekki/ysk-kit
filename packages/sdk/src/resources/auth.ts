import type {
  LoginPasswordCommand,
  RefreshCommand,
  RegisterCommand,
  RequestAdminOtpCommand,
  RequestOtpCommand,
  TokenPairDto,
  UserDto,
  VerifyAdminOtpCommand,
  VerifyOtpCommand,
} from '@ysk-kit/contracts';
import type { HttpClient } from '../http';
import type { TokenStore } from '../token-store';

const persist = async (store: TokenStore, pair: TokenPairDto) => {
  if (store.setPair) await store.setPair(pair.accessToken, pair.refreshToken);
  else await store.set(pair.accessToken);
};

export const authResource = (http: HttpClient, store: TokenStore) => ({
  register: async (body: RegisterCommand) => {
    const pair = await http.request<TokenPairDto>('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    await persist(store, pair);
    return pair;
  },
  login: async (body: LoginPasswordCommand) => {
    const pair = await http.request<TokenPairDto>('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    await persist(store, pair);
    return pair;
  },
  requestOtp: (body: RequestOtpCommand) =>
    http.request<{ sent: true }>('/v1/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  verifyOtp: async (body: VerifyOtpCommand) => {
    const pair = await http.request<TokenPairDto>('/v1/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    await persist(store, pair);
    return pair;
  },
  refresh: async (body: RefreshCommand) => {
    const pair = await http.request<TokenPairDto>('/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    await persist(store, pair);
    return pair;
  },
  logout: async () => {
    try {
      await http.request<{ revoked: true }>('/v1/auth/logout', { method: 'POST', body: '{}' });
    } finally {
      await store.clear();
    }
  },
  me: () => http.request<UserDto>('/v1/me'),
  requestAdminOtp: (body: RequestAdminOtpCommand) =>
    http.request<{ sent: true }>('/v1/auth/admin/otp/request', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  verifyAdminOtp: async (body: VerifyAdminOtpCommand) => {
    const pair = await http.request<TokenPairDto>('/v1/auth/admin/otp/verify', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    await persist(store, pair);
    return pair;
  },
  forgot: (body: { email: string }) =>
    http.request<{ accepted: true }>('/v1/auth/forgot', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  reset: (body: { token: string; password: string }) =>
    http.request<{ accepted: true }>('/v1/auth/reset', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
});
