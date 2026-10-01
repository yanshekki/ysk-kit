# Changesets

Run `pnpm changeset` to record a version bump for public `@ysk-kit/*` libraries.

On push to `main`, when the `NPM_PUBLISH` repository variable is `true`, `.github/workflows/release.yml` opens a Version PR or runs `pnpm build:packages && pnpm changeset publish` to npmjs (scope `@ysk-kit`). The job sets `NPM_CONFIG_PROVENANCE` and skips publish when those versions are already on the registry. Apps and `@ysk-kit/biome`, `@ysk-kit/typescript-config`, and `@ysk-kit/examples` are ignored.

Do not publish from a local machine unless `NODE_AUTH_TOKEN` is set.
