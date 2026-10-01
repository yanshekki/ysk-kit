# @ysk-kit/ui-logic

## 1.0.2

### Patch Changes

- Refresh safe dependency ranges (Biome 2.5.15, Turborepo 2.11.6, Vitest 5.0.3, Vite 8.3.2 on web/admin, React 19.2.8, Expo 57.0.26, Electron 44.5.1). pnpm overrides patch transitive `deepmerge-ts` 8.0.2, `mariadb` 3.4.7, and `mysql2` 3.24.5. TypeScript stays 6.0.3, Prisma stays 7.10.0, desktop stays on Vite 7, and `@ts-rest/core` stays on 3.53.0-rc.1.
- Updated dependencies
  - @ysk-kit/contracts@1.0.2

## 1.0.1

### Patch Changes

- CLI command is `ysk-kit` with alias `yskk`. The `ysk` binary is removed.
- Updated dependencies
  - @ysk-kit/contracts@1.0.1

## 1.0.0

### Major Changes

- First public release. Packages publish to npmjs as `@ysk-kit/*`. `create-ysk-app` from the registry downloads the matching GitHub tag of `yanshekki/ysk-kit`.

### Patch Changes

- Updated dependencies
  - @ysk-kit/contracts@1.0.0
