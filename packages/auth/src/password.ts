import argon2 from 'argon2';

const testCost = () => process.env.NODE_ENV === 'test';

export const hashPassword = (password: string): Promise<string> =>
  argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: testCost() ? 4096 : 65536,
    timeCost: testCost() ? 2 : 3,
  });

export const verifyPassword = (hash: string, password: string): Promise<boolean> =>
  argon2.verify(hash, password);
