# Changesets

Run `pnpm changeset` to record a version bump for public `@ysk-kit/*` libraries.

On push to `main`, `.github/workflows/release.yml` opens a Version PR or runs `pnpm build:packages && pnpm changeset publish` to GitHub Packages (`https://npm.pkg.github.com`, scope `@ysk`, restricted). Apps and `@ysk-kit/biome` / `@ysk-kit/typescript-config` are ignored.

The GitHub owner/org should match the `@ysk` scope. Do not publish from a local machine unless `NODE_AUTH_TOKEN` is set.
