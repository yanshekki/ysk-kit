export const HELP = `YSK Kit worked examples

Usage:
  pnpm --filter @ysk-kit/examples start apply <slug> [options]
  pnpm --filter @ysk-kit/examples start capture <slug> [options]

apply
  Scaffold a product from this kit, add the example modules, copy the overlay,
  then verify the destination.

  --dest <path>     Product root (default: examples/.runs/<slug>)
  --yes / -y        Required; passed to create-ysk-app (never prompt)
  --db sqlite|mysql|postgresql
                    Override spec.json
  --force           Delete a non-empty destination first
  --skip-install    Skip pnpm install, env, generate, migrate, seed
  --skip-verify     Skip dest layers / typecheck / test / openapi / check agent

capture
  Start the applied dest on ports 13001 (API) and 15173 (web), walk
  examples/<slug>/capture.json, and write PNG files into screenshots/.

  --dest <path>     Applied product root (default: examples/.runs/<slug>)

Manual: examples/README.md
`;
