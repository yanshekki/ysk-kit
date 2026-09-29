export type PasswordResetRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
};

export interface IPasswordResetRepository {
  create(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<PasswordResetRecord>;
  findOpenByHash(hash: string): Promise<PasswordResetRecord | null>;
  markUsed(id: string, at: Date): Promise<void>;
}
