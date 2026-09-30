import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createUserHooks } from './index';

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('createUserHooks', () => {
  it('loads users through the client', async () => {
    const list = vi.fn().mockResolvedValue({ items: [], nextCursor: null });
    const hooks = createUserHooks({ users: { list } } as never);
    const { result } = renderHook(() => hooks.useUsers({ limit: 10 }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(list).toHaveBeenCalledWith({ limit: 10 });
  });

  it('logs in through the client', async () => {
    const login = vi.fn().mockResolvedValue({ accessToken: 'a' });
    const hooks = createUserHooks({ auth: { login } } as never);
    const { result } = renderHook(() => hooks.useLogin(), { wrapper });
    result.current.mutate({ email: 'a@ysk.hk', password: 'password1' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(login).toHaveBeenCalled();
  });
});
