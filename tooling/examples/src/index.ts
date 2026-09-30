import { applyExample } from './apply';
import { captureExample } from './capture';
import { HELP } from './help';
import { EXAMPLE_DBS, type ExampleDb } from './spec';

const args = process.argv.slice(2);

const flagValue = (name: string): string | undefined => {
  const eq = args.find((arg) => arg.startsWith(`--${name}=`));
  if (eq) return eq.slice(`--${name}=`.length);
  const idx = args.indexOf(`--${name}`);
  if (idx >= 0) return args[idx + 1];
  return undefined;
};

const hasFlag = (name: string): boolean => args.includes(`--${name}`) || args.includes(`-${name}`);

const main = async (): Promise<void> => {
  const cmd = args[0];
  if (cmd !== 'apply' && cmd !== 'capture') {
    console.log(HELP);
    process.exit(cmd ? 1 : 0);
  }
  const slug = args[1];
  if (!slug || slug.startsWith('-')) {
    console.log(HELP);
    process.exit(1);
  }
  const dest = flagValue('dest');
  if (cmd === 'apply') {
    const dbRaw = flagValue('db');
    if (dbRaw && !EXAMPLE_DBS.includes(dbRaw as ExampleDb)) {
      throw new Error('--db must be sqlite, mysql, or postgresql');
    }
    const result = applyExample({
      slug,
      ...(dest ? { dest } : {}),
      ...(dbRaw ? { db: dbRaw as ExampleDb } : {}),
      force: hasFlag('force'),
      skipInstall: hasFlag('skip-install'),
      skipVerify: hasFlag('skip-verify'),
    });
    console.log(`applied ${slug} → ${result.dest}`);
    return;
  }
  const written = await captureExample({ slug, ...(dest ? { dest } : {}) });
  for (const path of written) console.log(`wrote ${path}`);
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
