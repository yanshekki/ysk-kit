import type { z } from 'zod';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ContractRoute = {
  method: HttpMethod;
  path: string;
  query?: z.ZodType;
  body?: z.ZodType;
  pathParams?: z.ZodType;
};

export type ContractRouter = {
  [key: string]: ContractRoute | ContractRouter;
};

const isRoute = (value: unknown): value is ContractRoute =>
  Boolean(
    value &&
      typeof value === 'object' &&
      'method' in value &&
      'path' in value &&
      typeof (value as ContractRoute).method === 'string' &&
      typeof (value as ContractRoute).path === 'string',
  );

const walk = (
  node: ContractRouter,
  prefix: string,
  acc: { key: string; route: ContractRoute }[],
): void => {
  for (const [key, value] of Object.entries(node)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (isRoute(value)) {
      acc.push({ key: nextKey, route: value });
    } else if (value && typeof value === 'object') {
      walk(value as ContractRouter, nextKey, acc);
    }
  }
};

export const flattenContract = (
  contract: ContractRouter,
): { key: string; route: ContractRoute }[] => {
  const acc: { key: string; route: ContractRoute }[] = [];
  walk(contract, '', acc);
  return acc;
};
