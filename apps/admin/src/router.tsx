import { createRootRoute, createRoute, createRouter, Link, Outlet } from '@tanstack/react-router';
import { AppShell, PageHeader } from '@ysk-kit/ui';
import { ApiKeysPage } from './features/api-keys/api-keys-page';
import { AuditPage } from './features/audit/audit-page';
import { LoginPage } from './features/auth/login-page';
import { QueuesPage } from './features/queues/queues-page';
import { UsersPage } from './features/users/users-page';
import { userHooks } from './lib/client';

const navClass = 'text-zinc-600 hover:text-zinc-900';

function Shell() {
  const me = userHooks.useMe();
  const logout = userHooks.useLogout();
  return (
    <AppShell
      brand={
        <Link to="/" className="font-semibold">
          YSK Admin
        </Link>
      }
      nav={
        <>
          <Link to="/users" className={navClass}>
            Users
          </Link>
          <Link to="/audit" className={navClass}>
            Audit
          </Link>
          <Link to="/api-keys" className={navClass}>
            API keys
          </Link>
          <Link to="/queues" className={navClass}>
            Queues
          </Link>
        </>
      }
      trailing={
        me.data ? (
          <button type="button" className={navClass} onClick={() => logout.mutate()}>
            Logout
          </button>
        ) : (
          <Link to="/login" className={navClass}>
            Sign in
          </Link>
        )
      }
    >
      <Outlet />
    </AppShell>
  );
}

const rootRoute = createRootRoute({ component: Shell });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <PageHeader title="Admin" description="Sign in to manage users, audit, API keys, and queues." />
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
