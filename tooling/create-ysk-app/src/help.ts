export const HELP = `create-ysk-app — scaffold a product from YSK Kit

Usage:
  pnpm --filter @ysk-kit/create-app start <name> [options]
  pnpm create @ysk-kit/app <name> [options]
  npm create @ysk-kit/app <name> [options]

  There is no unscoped create-ysk-app package on npm. The published
  package is @ysk-kit/create-app; its bin name is create-ysk-app.

Options:
  --preset thin|full
      Default: thin. Copies this kit then strips llm, billing, organizations,
      and devices (push). Use full to keep the living demonstration.
  --db mysql|postgresql|sqlite
      Default: mysql. Rewrites Prisma provider, driver adapter, and Compose.
  --flavor saas|desktop|gateway|php-bridge|trading|static-web3
      Default: saas. Selects which apps are copied.
  --no-admin
      Skip apps/admin (ignored by gateway, php-bridge, trading, static-web3,
      desktop).
  --no-mobile
      Skip apps/mobile (ignored by flavors that already omit mobile).
  --yes, -y
      Accept defaults (or flags already passed). Never prompt.

On a TTY, omitted name / flavor / preset / db / admin / mobile are prompted.
Non-TTY (CI, pipes) never prompts.

php-bridge and static-web3 ignore --preset.

Flavors:
  saas          API + web + admin + mobile (flags can drop admin/mobile)
  desktop       API + Electron desktop
  gateway       API + admin (machine API keys)
  php-bridge    OpenAPI + TypeScript/PHP clients only (no Node apps)
  trading       API + web + worker (no admin/mobile/desktop)
  static-web3   Vite web only (no API)

Manual: docs/cli/create-ysk-app.md
Chinese: docs/cli/create-ysk-app.zh.md
`;
