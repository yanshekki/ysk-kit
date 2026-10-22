export type SemVer = { major: number; minor: number; patch: number };

export const parseVer = (raw: string): SemVer | undefined => {
  const match = raw.trim().match(/v?(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match?.[1]) return undefined;
  return {
    major: Number(match[1]),
    minor: Number(match[2] ?? 0),
    patch: Number(match[3] ?? 0),
  };
};

export const cmpVer = (a: SemVer, b: SemVer): number =>
  a.major - b.major || a.minor - b.minor || a.patch - b.patch;

/** Satisfies a small engines range: comparisons, exact versions, space-separated AND, and `||`. */
export const satisfiesRange = (version: string, range: string): boolean => {
  const ver = parseVer(version);
  if (!ver) return false;
  const parts = range
    .split('||')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (parts.length === 0) return false;
  return parts.some((part) => {
    if (part === '*' || part === 'x') return true;
    const clauses = part.match(/(>=|<=|>|<|=)?\s*v?\d+(?:\.\d+){0,2}/g);
    if (!clauses || clauses.length === 0) return false;
    return clauses.every((clause) => {
      const match = clause.trim().match(/^(>=|<=|>|<|=)?\s*(v?\d+(?:\.\d+){0,2})$/);
      if (!match?.[2]) return false;
      const bound = parseVer(match[2]);
      if (!bound) return false;
      const op = match[1] ?? '=';
      const order = cmpVer(ver, bound);
      if (op === '>=') return order >= 0;
      if (op === '<=') return order <= 0;
      if (op === '>') return order > 0;
      if (op === '<') return order < 0;
      return order === 0;
    });
  });
};

/** True when `range` allows any candidate strictly below `min` (same major when possible). */
export const rangeAllowsBelow = (range: string, min: string): boolean => {
  const floor = parseVer(min);
  if (!floor) return false;
  const candidates: string[] = [];
  if (floor.patch > 0) candidates.push(`${floor.major}.${floor.minor}.${floor.patch - 1}`);
  candidates.push(`${floor.major}.0.0`);
  if (floor.minor > 0) candidates.push(`${floor.major}.${floor.minor - 1}.0`);
  for (const cand of candidates) {
    const ver = parseVer(cand);
    if (!ver || cmpVer(ver, floor) >= 0) continue;
    if (satisfiesRange(cand, range)) return true;
  }
  return false;
};
