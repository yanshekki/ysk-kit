import { createRootRoute, createRoute, createRouter, Link, Outlet } from '@tanstack/react-router';
import { ForgotPage } from './features/auth/forgot-page';
import { LoginPage } from './features/auth/login-page';
import { RegisterPage } from './features/auth/register-page';
import { ResetPage } from './features/auth/reset-page';
import { LlmPage } from './features/llm/llm-page';
import { NotificationsPage } from './features/notifications/notifications-page';
import { BillingPage } from './features/orgs/billing-page';
import { InvitePage } from './features/orgs/invite-page';
import { OrgDetailPage } from './features/orgs/org-detail-page';
import { OrgsPage } from './features/orgs/orgs-page';
import { UsersPage } from './features/users/users-page';
import { userHooks } from './lib/client';

function Shell() {
  const me = userHooks.useMe();
  const logout = userHooks.useLogout();
  userHooks.useNotificationsLive();
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <nav className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3 text-sm">
          <Link to="/" className="font-semibold">
            YSK Kit
          </Link>
          <Link to="/users" className="text-zinc-600 hover:text-zinc-900">
            Users
          </Link>
          <Link to="/notifications" className="text-zinc-600 hover:text-zinc-900">
            Inbox
          </Link>
          <Link to="/llm" className="text-zinc-600 hover:text-zinc-900">
            LLM
          </Link>
          <Link to="/orgs" className="text-zinc-600 hover:text-zinc-900">
            Orgs
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
      <h1 className="text-2xl font-semibold">YSK Kit Web</h1>
      <p className="text-zinc-600">Register or sign in, then open Users.</p>
    </section>
  ),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
});

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  component: UsersPage,
});

const forgotRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot',
  component: ForgotPage,
});

const resetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reset',
  component: ResetPage,
});

const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/notifications',
  component: NotificationsPage,
});

const llmRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/llm',
  component: LlmPage,
});

const orgsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orgs',
  component: OrgsPage,
});

const orgDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orgs/$organizationId',
  component: function OrgDetailRoute() {
    const { organizationId } = orgDetailRoute.useParams();
    return <OrgDetailPage organizationId={organizationId} />;
  },
});

const orgBillingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orgs/$organizationId/billing',
  component: function OrgBillingRoute() {
    const { organizationId } = orgBillingRoute.useParams();
    return <BillingPage organizationId={organizationId} />;
  },
});

const inviteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/invite',
  component: InvitePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  forgotRoute,
  resetRoute,
  usersRoute,
  notificationsRoute,
  llmRoute,
  orgsRoute,
  orgDetailRoute,
  orgBillingRoute,
  inviteRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
