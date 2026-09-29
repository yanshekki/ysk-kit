import { createRootRoute, createRoute, createRouter, Link, Outlet } from '@tanstack/react-router';
import { AppShell, PageHeader } from '@ysk/ui';
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

const navClass = 'text-zinc-600 hover:text-zinc-900';

function Shell() {
  const me = userHooks.useMe();
  const logout = userHooks.useLogout();
  userHooks.useNotificationsLive();
  return (
    <AppShell
      brand={
        <Link to="/" className="font-semibold">
          YSK Kit
        </Link>
      }
      nav={
        <>
          <Link to="/users" className={navClass}>
            Users
          </Link>
          <Link to="/notifications" className={navClass}>
            Inbox
          </Link>
          <Link to="/llm" className={navClass}>
            LLM
          </Link>
          <Link to="/orgs" className={navClass}>
            Orgs
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
    <PageHeader title="Home" description="Sign in to manage users, inbox, and your organization." />
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
