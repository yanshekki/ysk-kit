import { describe, expect, it } from 'vitest';
import { CreateCancelledError, resolveCreateOptions } from './prompt.js';
import { FLAVORS, parseArgs } from './scaffold.js';
import { FLAVOR_ITEMS, LANGUAGE_NOTE } from './wizard-copy.js';

const scriptedAsk = (answers: string[]) => {
  const calls: string[] = [];
  const ask = async (question: string): Promise<string> => {
    calls.push(question);
    const next = answers.shift();
    if (next === undefined) throw new Error(`unexpected ask: ${question}`);
    return next;
  };
  return { ask, calls };
};

const hasLanguageNote = (calls: string[]): boolean =>
  calls.some((question) =>
    question.includes('Tauri, Flutter, and Kotlin Multiplatform are deferred'),
  );

const asked = (calls: string[], needle: string): boolean =>
  calls.some((question) => question.includes(needle));

describe('wizard copy', () => {
  it('keeps flavor menu ids in FLAVORS order', () => {
    expect(FLAVOR_ITEMS.map((item) => item.id)).toEqual([...FLAVORS]);
  });
});

describe('parseArgs explicit flags', () => {
  it('marks flavor explicit and db implicit', () => {
    const parsed = parseArgs(['app', '--flavor', 'desktop']);
    expect(parsed.explicit.flavor).toBe(true);
    expect(parsed.explicit.db).toBe(false);
    expect(parsed.flavor).toBe('desktop');
    expect(parsed.db).toBe('mysql');
    expect(parsed.yes).toBe(false);
  });

  it('detects --yes and -y', () => {
    expect(parseArgs(['app', '--yes']).yes).toBe(true);
    expect(parseArgs(['app', '-y']).yes).toBe(true);
    expect(parseArgs(['-y', 'app']).name).toBe('app');
  });

  it('detects equals-form flags', () => {
    const parsed = parseArgs(['app', '--db=sqlite', '--preset=full']);
    expect(parsed.explicit.db).toBe(true);
    expect(parsed.explicit.preset).toBe(true);
    expect(parsed.db).toBe('sqlite');
    expect(parsed.preset).toBe('full');
  });
});

describe('resolveCreateOptions', () => {
  it('does not ask when tty is false', async () => {
    const { ask, calls } = scriptedAsk([]);
    const resolved = await resolveCreateOptions(parseArgs(['clinic']), { tty: false, ask });
    expect(calls).toEqual([]);
    expect(resolved).toEqual({
      name: 'clinic',
      flavor: 'saas',
      db: 'mysql',
      preset: 'thin',
      admin: true,
      mobile: true,
    });
  });

  it('does not ask when --yes', async () => {
    const { ask, calls } = scriptedAsk(['should-not-run']);
    const resolved = await resolveCreateOptions(
      parseArgs(['clinic', '--yes', '--flavor', 'desktop']),
      {
        tty: true,
        ask,
      },
    );
    expect(calls).toEqual([]);
    expect(resolved.flavor).toBe('desktop');
    expect(resolved.db).toBe('mysql');
    expect(resolved.preset).toBe('thin');
  });

  it('asks flavor, preset, and db for gateway and skips admin/mobile', async () => {
    const { ask, calls } = scriptedAsk(['gateway', 'full', 'sqlite', 'yes']);
    const resolved = await resolveCreateOptions(parseArgs(['clinic']), { tty: true, ask });
    expect(resolved).toEqual({
      name: 'clinic',
      flavor: 'gateway',
      db: 'sqlite',
      preset: 'full',
      admin: true,
      mobile: true,
    });
    expect(asked(calls, 'Include admin?')).toBe(false);
    expect(asked(calls, 'Include mobile?')).toBe(false);
    expect(asked(calls, 'Proceed?')).toBe(true);
    expect(hasLanguageNote(calls)).toBe(true);
  });

  it('skips preset and db prompts for php-bridge', async () => {
    const { ask, calls } = scriptedAsk(['php-bridge', 'yes']);
    const resolved = await resolveCreateOptions(parseArgs(['bridge']), { tty: true, ask });
    expect(resolved.flavor).toBe('php-bridge');
    expect(resolved.preset).toBe('thin');
    expect(resolved.db).toBe('mysql');
    expect(calls).toHaveLength(2);
    expect(asked(calls, 'Preset (1–2 or thin|full)')).toBe(false);
    expect(asked(calls, 'Database (1–3 or mysql|postgresql|sqlite)')).toBe(false);
    expect(hasLanguageNote(calls)).toBe(true);
  });

  it('asks admin and mobile for saas', async () => {
    const { ask } = scriptedAsk(['saas', 'thin', 'mysql', 'n', 'yes', 'yes']);
    const resolved = await resolveCreateOptions(parseArgs(['clinic']), { tty: true, ask });
    expect(resolved.admin).toBe(false);
    expect(resolved.mobile).toBe(true);
  });

  it('does not re-ask explicit flavor', async () => {
    const { ask, calls } = scriptedAsk(['full', 'postgresql', '']);
    const resolved = await resolveCreateOptions(parseArgs(['clinic', '--flavor', 'desktop']), {
      tty: true,
      ask,
    });
    expect(resolved.flavor).toBe('desktop');
    expect(resolved.preset).toBe('full');
    expect(resolved.db).toBe('postgresql');
    expect(asked(calls, 'Flavor (1–6 or slug)')).toBe(false);
    expect(hasLanguageNote(calls)).toBe(true);
  });

  it('prompts for a missing name on tty', async () => {
    const { ask } = scriptedAsk(['my-clinic', 'saas', '', '', '', '', '']);
    const resolved = await resolveCreateOptions(parseArgs([]), { tty: true, ask });
    expect(resolved.name).toBe('my-clinic');
    expect(resolved.preset).toBe('thin');
    expect(resolved.db).toBe('mysql');
    expect(resolved.admin).toBe(true);
    expect(resolved.mobile).toBe(true);
  });

  it('aborts without resolved options when Proceed is no', async () => {
    const { ask, calls } = scriptedAsk(['saas', 'thin', 'mysql', 'yes', 'yes', 'no']);
    await expect(
      resolveCreateOptions(parseArgs(['clinic']), { tty: true, ask }),
    ).rejects.toBeInstanceOf(CreateCancelledError);
    expect(asked(calls, 'Proceed?')).toBe(true);
  });

  it('maps flavor number 4 to php-bridge', async () => {
    const { ask, calls } = scriptedAsk(['4', 'yes']);
    const resolved = await resolveCreateOptions(parseArgs(['bridge']), { tty: true, ask });
    expect(resolved.flavor).toBe('php-bridge');
    expect(asked(calls, 'Best for:')).toBe(true);
    expect(asked(calls, 'Avoid when:')).toBe(true);
  });

  it('maps flavor number 1 and preset/db numbers', async () => {
    const { ask } = scriptedAsk(['1', '2', '3', 'yes', 'n', 'yes']);
    const resolved = await resolveCreateOptions(parseArgs(['clinic']), { tty: true, ask });
    expect(resolved).toEqual({
      name: 'clinic',
      flavor: 'saas',
      preset: 'full',
      db: 'sqlite',
      admin: true,
      mobile: false,
    });
  });

  it('accepts flavor slugs at the numbered menu', async () => {
    const { ask } = scriptedAsk(['trading', 'thin', 'mysql', 'yes']);
    const resolved = await resolveCreateOptions(parseArgs(['venue']), { tty: true, ask });
    expect(resolved.flavor).toBe('trading');
    expect(resolved.preset).toBe('thin');
  });

  it('skips preset and db for static-web3', async () => {
    const { ask, calls } = scriptedAsk(['6', 'yes']);
    const resolved = await resolveCreateOptions(parseArgs(['site']), { tty: true, ask });
    expect(resolved.flavor).toBe('static-web3');
    expect(asked(calls, 'Preset (1–2 or thin|full)')).toBe(false);
    expect(asked(calls, 'Database (1–3 or mysql|postgresql|sqlite)')).toBe(false);
  });

  it('rejects unknown flavor numbers after three attempts', async () => {
    const { ask } = scriptedAsk(['0', '7', 'saasx']);
    await expect(resolveCreateOptions(parseArgs(['clinic']), { tty: true, ask })).rejects.toThrow(
      'unknown flavor',
    );
  });

  it('includes the language note even when --flavor is explicit', async () => {
    const { ask, calls } = scriptedAsk(['yes']);
    const resolved = await resolveCreateOptions(parseArgs(['bridge', '--flavor', 'php-bridge']), {
      tty: true,
      ask,
    });
    expect(resolved.flavor).toBe('php-bridge');
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain(LANGUAGE_NOTE);
    expect(asked(calls, 'ignored (php-bridge)')).toBe(true);
  });
});
