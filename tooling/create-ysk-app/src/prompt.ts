import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { DBS, type Db, FLAVORS, type ParsedArgs, PRESETS, type Preset } from './scaffold';

export type AskFn = (question: string) => Promise<string>;

export type ResolvedCreateOptions = {
  name: string;
  flavor: string;
  db: Db;
  preset: Preset;
  admin: boolean;
  mobile: boolean;
};

const PRESET_SKIP = new Set(['php-bridge', 'static-web3']);

const pick = async (
  ask: AskFn,
  label: string,
  allowed: readonly string[],
  fallback: string,
): Promise<string> => {
  const list = allowed.join(', ');
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const raw = (await ask(`${label} (${list}) [${fallback}]:`)).trim().toLowerCase();
    if (raw === '') return fallback;
    if (allowed.includes(raw)) return raw;
  }
  throw new Error(`unknown ${label.toLowerCase()}`);
};

const pickYesNo = async (ask: AskFn, label: string, fallback: boolean): Promise<boolean> => {
  const def = fallback ? 'yes' : 'no';
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const raw = (await ask(`${label} (yes, no) [${def}]:`)).trim().toLowerCase();
    if (raw === '') return fallback;
    if (raw === 'yes' || raw === 'y') return true;
    if (raw === 'no' || raw === 'n') return false;
  }
  throw new Error(`unknown ${label.toLowerCase()}`);
};

const pickName = async (ask: AskFn): Promise<string> => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const raw = (await ask('Product name:')).trim();
    if (raw.length > 0) return raw;
  }
  throw new Error('product name required');
};

export const resolveCreateOptions = async (
  parsed: ParsedArgs,
  opts: { tty: boolean; ask: AskFn },
): Promise<ResolvedCreateOptions> => {
  if (!opts.tty || parsed.yes) {
    return {
      name: parsed.name ?? '',
      flavor: parsed.flavor,
      db: parsed.db,
      preset: parsed.preset,
      admin: parsed.admin,
      mobile: parsed.mobile,
    };
  }

  const name = parsed.name && parsed.name.length > 0 ? parsed.name : await pickName(opts.ask);
  const flavor = parsed.explicit.flavor
    ? parsed.flavor
    : await pick(opts.ask, 'Flavor', FLAVORS, 'saas');
  const skipPresetDb = PRESET_SKIP.has(flavor);
  const preset = (
    parsed.explicit.preset || skipPresetDb
      ? parsed.preset
      : await pick(opts.ask, 'Preset', PRESETS, 'thin')
  ) as Preset;
  const db = (
    parsed.explicit.db || skipPresetDb ? parsed.db : await pick(opts.ask, 'Database', DBS, 'mysql')
  ) as Db;
  const admin =
    flavor !== 'saas' || parsed.explicit.noAdmin
      ? parsed.admin
      : await pickYesNo(opts.ask, 'Include admin?', true);
  const mobile =
    flavor !== 'saas' || parsed.explicit.noMobile
      ? parsed.mobile
      : await pickYesNo(opts.ask, 'Include mobile?', true);

  return { name, flavor, db, preset, admin, mobile };
};

export const withReadlineAsk = async <T>(fn: (ask: AskFn) => Promise<T>): Promise<T> => {
  const rl = createInterface({ input, output });
  try {
    const ask: AskFn = async (question) => rl.question(`${question} `);
    return await fn(ask);
  } finally {
    rl.close();
  }
};
