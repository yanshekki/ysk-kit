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
import { RegisterCommandSchema } from '@ysk/contracts';
import { describe, expect, it } from 'vitest';
import { RegisterPage } from './register-page';

const renderRegister = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const route = createRoute({
    getParentRoute: () => rootRoute,
    path: '/register',
    component: RegisterPage,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([route]),
    history: createMemoryHistory({ initialEntries: ['/register'] }),
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

describe('RegisterPage', () => {
  it('shows a schema issue for an invalid email', async () => {
    const user = userEvent.setup();
    const { router } = renderRegister();
    await router.load();
    const parsed = RegisterCommandSchema.safeParse({
      email: 'bad',
      password: 'password1',
      displayName: 'Ki',
    });
    const expected = parsed.success ? 'Invalid' : (parsed.error.issues[0]?.message ?? 'Invalid');
    await user.type(await screen.findByLabelText('Display name'), 'Ki');
    await user.type(screen.getByLabelText('Email'), 'bad');
    await user.type(screen.getByLabelText('Password'), 'password1');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByText(expected)).toBeDefined();
  });
});
