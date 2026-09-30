import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPasswordCommandSchema } from '@ysk-kit/contracts';
import { describe, expect, it } from 'vitest';
import { LoginPage } from './login-page';

const renderLogin = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    component: LoginPage,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([loginRoute]),
    history: createMemoryHistory({ initialEntries: ['/login'] }),
    defaultPendingMs: 0,
    defaultPendingMinMs: 0,
  });
  return {
    router,
    ...render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router as never} />
      </QueryClientProvider>,
    ),
  };
};

describe('Admin LoginPage', () => {
  it('shows a schema issue for an invalid email', async () => {
    const user = userEvent.setup();
    const { router } = renderLogin();
    await router.load();
    const parsed = LoginPasswordCommandSchema.safeParse({
      email: 'not-an-email',
      password: 'password1',
    });
    const expected = parsed.success ? 'Invalid' : (parsed.error.issues[0]?.message ?? 'Invalid');
    await user.type(await screen.findByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'password1');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByText(expected)).toBeDefined();
  });
});
