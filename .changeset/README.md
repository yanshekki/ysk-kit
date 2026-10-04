# Changesets

Run `pnpm changeset` to record a version bump for public `@ysk-kit/*` libraries.

On push to `main`, when the `NPM_PUBLISH` repository variable is `true`, `.github/workflows/release.yml` opens a Version PR or runs `pnpm release:publish` to npmjs (scope `@ysk-kit`). The version script also copies `@ysk-kit/create-app`'s version into the root `package.json`. Publish runs `pnpm publish --provenance` per package through npm Trusted Publishing (GitHub OIDC only), sets `create-github-releases: false` and `push-git-tags: false` (one product tag `vX.Y.Z`, not a release per package), and fails unless `npm view` can see every published version. The publish script exits if the OIDC token is unavailable. Apps and `@ysk-kit/biome`, `@ysk-kit/typescript-config`, and `@ysk-kit/examples` are ignored. Public packages ship one version together.

Do not publish from a local machine. npm Trusted Publishing only exchanges a token inside this GitHub Actions workflow.
