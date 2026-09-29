export type Envelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export const unwrapEnvelope = <T>(json: Envelope<T>): T => {
  if (json.ok) return json.data;
  throw new Error(json.error.message);
};
