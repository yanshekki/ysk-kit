# Changesets

Run `pnpm changeset` to record a version bump for public `@ysk-kit/*` libraries.

On push to `main`, when the `NPM_PUBLISH` repository variable is `true`, `.github/workflows/release.yml` opens a Version PR or runs `pnpm release:publish` to npmjs (scope `@ysk-kit`). The version script also copies `@ysk-kit/create-app`'s version into the root `package.json`. Publish runs `pnpm publish --provenance` per package, keeps `NODE_AUTH_TOKEN` as the fallback behind OIDC, sets `create-github-releases: false` and `push-git-tags: false` (one product tag `vX.Y.Z`, not a release per package), and fails unless `npm view` can see every published version. Apps and `@ysk-kit/biome`, `@ysk-kit/typescript-config`, and `@ysk-kit/examples` are ignored. Public packages ship one version together: a minor changeset on each of them is what cuts 1.1.0.

Do not publish from a local machine unless `NODE_AUTH_TOKEN` is set.
