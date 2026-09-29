import { createRootRoute, createRoute, createRouter, Link, Outlet } from '@tanstack/react-router';
import { ApiKeysPage } from './features/api-keys/api-keys-page';
import { AuditPage } from './features/audit/audit-page';
import { LoginPage } from './features/auth/login-page';
import { QueuesPage } from './features/queues/queues-page';
import { UsersPage } from './features/users/users-page';
import { userHooks } from './lib/client';

function Shell() {
  const me = userHooks.useMe();
  const logout = userHooks.useLogout();
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <nav className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3 text-sm">
          <Link to="/" className="font-semibold">
            YSK Admin
          </Link>
          <Link to="/users" className="text-zinc-600 hover:text-zinc-900">
            Users
          </Link>
          <Link to="/audit" className="text-zinc-600 hover:text-zinc-900">
            Audit
          </Link>
          <Link to="/api-keys" className="text-zinc-600 hover:text-zinc-900">
            API keys
          </Link>
          <Link to="/queues" className="text-zinc-600 hover:text-zinc-900">
            Queues
          </Link>
          <span className="ml-auto" />
          {me.data ? (
            <button
              type="button"
              className="text-zinc-600 hover:text-zinc-900"
              onClick={() => logout.mutate()}
            >
              Logout
            </button>
          ) : (
            <Link to="/login" className="text-zinc-600 hover:text-zinc-900">
              Sign in
            </Link>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

const rootRoute = createRootRoute({ component: Shell });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold">YSK Kit Admin</h1>
      <p className="text-zinc-600">Sign in. Create is gated by canAct(role, user.create).</p>
    </section>
  ),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  component: UsersPage,
});

const auditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/audit',
  component: AuditPage,
});

const apiKeysRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/api-keys',
  component: ApiKeysPage,
});

const queuesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/queues',
  component: QueuesPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  usersRoute,
  auditRoute,
  apiKeysRoute,
  queuesRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
