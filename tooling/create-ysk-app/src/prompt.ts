import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { DBS, type Db, FLAVORS, type ParsedArgs, PRESETS, type Preset } from './scaffold.js';
import {
  DB_ITEMS,
  FLAVOR_ITEMS,
  formatMenu,
  LANGUAGE_NOTE,
  type MenuItem,
  PRESET_ITEMS,
} from './wizard-copy.js';

export type AskFn = (question: string) => Promise<string>;

export type ResolvedCreateOptions = {
  name: string;
  flavor: string;
  db: Db;
  preset: Preset;
  admin: boolean;
  mobile: boolean;
};

export class CreateCancelledError extends Error {
  readonly code = 'CREATE_CANCELLED' as const;
  constructor() {
    super('create cancelled');
    this.name = 'CreateCancelledError';
  }
}

export const isCreateCancelledError = (error: unknown): error is CreateCancelledError =>
  error instanceof CreateCancelledError;

const PRESET_SKIP = new Set(['php-bridge', 'static-web3']);

const matchMenuChoice = (raw: string, allowed: readonly string[]): string | undefined => {
  if (/^\d+$/.test(raw)) {
    const index = Number(raw);
    if (index >= 1 && index <= allowed.length) return allowed[index - 1];
    return undefined;
  }
  if (allowed.includes(raw)) return raw;
  return undefined;
};

const pickMenu = async (
  ask: AskFn,
  opts: {
    label: string;
    title: string;
    items: readonly MenuItem[];
    allowed: readonly string[];
    fallback: string;
    preamble?: string;
    hint: string;
  },
): Promise<string> => {
  const menu = formatMenu(opts.title, opts.items);
  const prefix = opts.preamble ? `${opts.preamble}\n\n${menu}` : menu;
  const prompt = `${prefix}${opts.hint} [${opts.fallback}]:`;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const raw = (await ask(prompt)).trim().toLowerCase();
    if (raw === '') return opts.fallback;
    const matched = matchMenuChoice(raw, opts.allowed);
    if (matched) return matched;
  }
  throw new Error(`unknown ${opts.label.toLowerCase()}`);
};

const pickYesNo = async (
  ask: AskFn,
  label: string,
  fallback: boolean,
  preamble?: string,
): Promise<boolean> => {
  const def = fallback ? 'yes' : 'no';
  const prompt = `${preamble ? `${preamble}\n` : ''}${label} (yes, no) [${def}]:`;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const raw = (await ask(prompt)).trim().toLowerCase();
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

const pickFlavor = async (ask: AskFn, fallback: string): Promise<string> =>
  pickMenu(ask, {
    label: 'Flavor',
    title: 'Flavor — product shape. Enter 1–6 or a slug.',
    items: FLAVOR_ITEMS,
    allowed: FLAVORS,
    fallback,
    hint: 'Flavor (1–6 or slug)',
  });

const pickPreset = async (ask: AskFn, fallback: string, preamble?: string): Promise<string> =>
  pickMenu(ask, {
    label: 'Preset',
    title: 'Preset — capability depth. Enter 1–2 or thin|full.',
    items: PRESET_ITEMS,
    allowed: PRESETS,
    fallback,
    hint: 'Preset (1–2 or thin|full)',
    ...(preamble ? { preamble } : {}),
  });

const pickDatabase = async (ask: AskFn, fallback: string, preamble?: string): Promise<string> =>
  pickMenu(ask, {
    label: 'Database',
    title: 'Database. Enter 1–3 or mysql|postgresql|sqlite.',
    items: DB_ITEMS,
    allowed: DBS,
    fallback,
    hint: 'Database (1–3 or mysql|postgresql|sqlite)',
    ...(preamble ? { preamble } : {}),
  });

const formatIgnored = (flavor: string, skipPresetDb: boolean, value: string): string =>
  skipPresetDb ? `ignored (${flavor})` : value;

const formatSurface = (flavor: string, value: boolean): string =>
  flavor === 'saas' ? (value ? 'yes' : 'no') : 'n/a';

const confirmCreate = async (
  ask: AskFn,
  resolved: ResolvedCreateOptions,
  skipPresetDb: boolean,
  preamble?: string,
): Promise<void> => {
  const summary = [
    'Summary — no files have been written yet.',
    `  Product:  ${resolved.name}`,
    `  Flavor:   ${resolved.flavor}`,
    `  Preset:   ${formatIgnored(resolved.flavor, skipPresetDb, resolved.preset)}`,
    `  Database: ${formatIgnored(resolved.flavor, skipPresetDb, resolved.db)}`,
    `  Admin:    ${formatSurface(resolved.flavor, resolved.admin)}`,
    `  Mobile:   ${formatSurface(resolved.flavor, resolved.mobile)}`,
    '',
    'Proceed and write files?',
  ].join('\n');
  const body = preamble ? `${preamble}\n\n${summary}` : summary;
  const proceed = await pickYesNo(ask, 'Proceed?', true, body);
  if (!proceed) throw new CreateCancelledError();
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
  const flavor = parsed.explicit.flavor ? parsed.flavor : await pickFlavor(opts.ask, 'saas');
  const skipPresetDb = PRESET_SKIP.has(flavor);
  let languageNotePending = true;
  const takeLanguageNote = (): string | undefined => {
    if (!languageNotePending) return undefined;
    languageNotePending = false;
    return LANGUAGE_NOTE;
  };

  const preset = (
    parsed.explicit.preset || skipPresetDb
      ? parsed.preset
      : await pickPreset(opts.ask, 'thin', takeLanguageNote())
  ) as Preset;
  const db = (
    parsed.explicit.db || skipPresetDb
      ? parsed.db
      : await pickDatabase(opts.ask, 'mysql', takeLanguageNote())
  ) as Db;
  const admin =
    flavor !== 'saas' || parsed.explicit.noAdmin
      ? parsed.admin
      : await pickYesNo(
          opts.ask,
          'Include admin?',
          true,
          [
            takeLanguageNote(),
            'Include the operator admin Vite app (apps/admin).',
            '  yes — copy admin for operators (default).',
            '  no  — skip apps/admin (same as --no-admin).',
          ]
            .filter((line): line is string => Boolean(line))
            .join('\n'),
        );
  const mobile =
    flavor !== 'saas' || parsed.explicit.noMobile
      ? parsed.mobile
      : await pickYesNo(
          opts.ask,
          'Include mobile?',
          true,
          [
            takeLanguageNote(),
            'Include the Expo mobile app (apps/mobile).',
            '  yes — copy Expo mobile (default).',
            '  no  — skip apps/mobile (same as --no-mobile).',
          ]
            .filter((line): line is string => Boolean(line))
            .join('\n'),
        );

  const resolved: ResolvedCreateOptions = { name, flavor, db, preset, admin, mobile };
  await confirmCreate(opts.ask, resolved, skipPresetDb, takeLanguageNote());
  return resolved;
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
