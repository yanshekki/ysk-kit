export type OtpRecord = {
  id: string;
  phone: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  consumedAt: Date | null;
  createdAt: Date;
};

export interface IOtpRepository {
  create(input: { phone: string; codeHash: string; expiresAt: Date }): Promise<OtpRecord>;
  findLatestOpen(phone: string): Promise<OtpRecord | null>;
  incrementAttempts(id: string): Promise<OtpRecord | null>;
  consume(id: string, at: Date): Promise<void>;
  countSince(phone: string, since: Date): Promise<number>;
}
