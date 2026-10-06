import { describe, expect, it } from 'vitest';
import { resolveCreateOptions } from './prompt.js';
import { parseArgs } from './scaffold.js';

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
    const { ask, calls } = scriptedAsk(['gateway', 'full', 'sqlite']);
    const resolved = await resolveCreateOptions(parseArgs(['clinic']), { tty: true, ask });
    expect(resolved).toEqual({
      name: 'clinic',
      flavor: 'gateway',
      db: 'sqlite',
      preset: 'full',
      admin: true,
      mobile: true,
    });
    expect(calls.some((q) => q.startsWith('Include admin'))).toBe(false);
    expect(calls.some((q) => q.startsWith('Include mobile'))).toBe(false);
  });

  it('skips preset and db prompts for php-bridge', async () => {
    const { ask, calls } = scriptedAsk(['php-bridge']);
    const resolved = await resolveCreateOptions(parseArgs(['bridge']), { tty: true, ask });
    expect(resolved.flavor).toBe('php-bridge');
    expect(resolved.preset).toBe('thin');
    expect(resolved.db).toBe('mysql');
    expect(calls).toHaveLength(1);
  });

  it('asks admin and mobile for saas', async () => {
    const { ask } = scriptedAsk(['saas', 'thin', 'mysql', 'n', 'yes']);
    const resolved = await resolveCreateOptions(parseArgs(['clinic']), { tty: true, ask });
    expect(resolved.admin).toBe(false);
    expect(resolved.mobile).toBe(true);
  });

  it('does not re-ask explicit flavor', async () => {
    const { ask, calls } = scriptedAsk(['full', 'postgresql']);
    const resolved = await resolveCreateOptions(parseArgs(['clinic', '--flavor', 'desktop']), {
      tty: true,
      ask,
    });
    expect(resolved.flavor).toBe('desktop');
    expect(resolved.preset).toBe('full');
    expect(resolved.db).toBe('postgresql');
    expect(calls.some((q) => q.startsWith('Flavor'))).toBe(false);
  });

  it('prompts for a missing name on tty', async () => {
    const { ask } = scriptedAsk(['my-clinic', 'saas', '', '', '', '']);
    const resolved = await resolveCreateOptions(parseArgs([]), { tty: true, ask });
    expect(resolved.name).toBe('my-clinic');
    expect(resolved.preset).toBe('thin');
    expect(resolved.db).toBe('mysql');
    expect(resolved.admin).toBe(true);
    expect(resolved.mobile).toBe(true);
  });
});
