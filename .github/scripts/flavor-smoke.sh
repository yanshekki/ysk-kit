#!/usr/bin/env bash
# Generate one flavor and preset, then install, typecheck, test, and build.
# php-bridge is not a pnpm workspace: install and compile the TypeScript client,
# assert envelope unwrapping, and syntax-check the PHP client.
set -euo pipefail

export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
export TURBO_TELEMETRY_DISABLED=1

FLAVOR="${1:?flavor}"
PRESET="${2:?preset}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEST="/tmp/ysk-smoke-${FLAVOR}-${PRESET}"

rm -rf "$DEST"
cd "$ROOT"
pnpm --filter @ysk-kit/create-app start "$DEST" \
  --flavor "$FLAVOR" \
  --preset "$PRESET" \
  --db sqlite \
  --yes

if [[ "$FLAVOR" != "php-bridge" ]]; then
  for rel in \
    AGENTS.md \
    CLAUDE.md \
    GEMINI.md \
    .agents/skills/security-review/SKILL.md \
    .agents/skills/db-migration/SKILL.md \
    .agents/skills/webhook-handling/SKILL.md \
    .agents/skills/desktop-electron/SKILL.md \
    .cursor/rules/security.mdc \
    .cursor/rules/desktop.mdc \
    docs/plans/_template.md \
    docs/plans/_template.zh.md \
    .agents/skills/add-module/SKILL.md \
    .agents/skills/plan-feature/SKILL.md \
    .agents/skills/test-plan/SKILL.md \
    .agents/skills/write-tests/SKILL.md \
    .agents/skills/ui-design/SKILL.md \
    .agents/skills/ui-review/SKILL.md \
    .claude/skills/add-module/SKILL.md \
    .github/copilot-instructions.md \
    .gemini/settings.json \
    .cursor/rules/ysk-kit.mdc \
    .cursor/rules/contracts.mdc \
    .cursor/rules/tests.mdc \
    .cursor/rules/ui.mdc
  do
    if [[ ! -f "$DEST/$rel" ]]; then
      echo "missing agent guidance file: $rel"
      exit 1
    fi
  done
  grep -q AGENTS.md "$DEST/CLAUDE.md"
  grep -q AGENTS.md "$DEST/.gemini/settings.json"
  grep -q '## Current state and reuse' "$DEST/docs/plans/_template.md"
  grep -q '## Assumptions' "$DEST/docs/plans/_template.md"
  grep -q '## Options considered' "$DEST/docs/plans/_template.md"
  grep -q '## 現況與重用' "$DEST/docs/plans/_template.zh.md"
  grep -q '## 假設' "$DEST/docs/plans/_template.zh.md"
  grep -q '## 考慮過的方案' "$DEST/docs/plans/_template.zh.md"
fi

if [[ "$FLAVOR" == "php-bridge" ]]; then
  pnpm install --dir "$DEST/ts"
  pnpm exec tsc --pretty false --noEmit --esModuleInterop --module nodenext --moduleResolution nodenext --target es2022 \
    "$DEST/ts/src/client.ts"
  node --experimental-strip-types --input-type=module <<EOF
import { pathToFileURL } from 'node:url';
const { unwrapEnvelope, YskApiError } = await import(pathToFileURL('${DEST}/ts/src/client.ts').href);
const data = unwrapEnvelope({ ok: true, data: { status: 'ok' } });
if (data.status !== 'ok') process.exit(1);
let threw = false;
try {
  unwrapEnvelope({ ok: false, error: { code: 'NOPE', message: 'no' } });
} catch (error) {
  threw = error instanceof YskApiError && error.code === 'NOPE';
}
if (!threw) process.exit(1);
EOF
  pnpm exec tsc --pretty false --declaration --outDir "$DEST/ts/dist" --esModuleInterop --module nodenext --moduleResolution nodenext --target es2022 \
    "$DEST/ts/src/client.ts"
  if ! command -v php >/dev/null 2>&1; then
    sudo apt-get update -y
    sudo apt-get install -y php-cli
  fi
  php -l "$DEST/php/src/YskClient.php"
  exit 0
fi

cd "$DEST"
pnpm install
cp .env.example .env
if [[ -f apps/api/prisma/schema.prisma ]]; then
  pnpm db:generate
fi
pnpm typecheck
pnpm test
pnpm build
