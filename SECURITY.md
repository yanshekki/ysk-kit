# Security

Language: [中文](SECURITY.zh.md) · English

Report a vulnerability in YSK Kit to [email@ysk.hk](mailto:email@ysk.hk). Please include the package, version, and a reproduction. Do not open a public GitHub issue for an unfixed vulnerability.

## Supported versions

| Version | Status |
|---|---|
| 1.0.x | Supported |

## What we expect in production

- `NODE_ENV=production`
- `JWT_SECRET` at least 32 characters, and not `change-me-in-dev-only`
- `TWILIO_*` when phone OTP is enabled, and `CRYPTO_MASTER_KEY` when field encryption is enabled
- `ALLOW_SEED=1` only for a deliberate seed

The IP rate limit is in-memory on a single process. Set `REDIS_URL` to share one Redis fixed window across API processes. `/health`, `/ready`, and `/metrics` are not counted.

`create-ysk-app`, when installed from npm, resolves the Git tag to a commit SHA and downloads that commit's archive, then checks the extracted `package.json` name and version.

## Supply chain

GitHub Actions are pinned to commit SHAs. npm publish from `.github/workflows/release.yml` uses npm Trusted Publishing (OIDC) only and requests provenance. The workflow does not pass a static npm credential. Dependabot opens weekly update PRs for npm, Actions, and Docker.
