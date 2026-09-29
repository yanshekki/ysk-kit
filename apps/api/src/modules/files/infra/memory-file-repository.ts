import type { IFileRepository } from '../application/file-service';

export const createMemoryFileRepository = (): IFileRepository => ({
  async create(input) {
    return { id: crypto.randomUUID(), ...input };
  },
});
