import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { createOtpSenderFromEnv, createTwilioOtpSender } from './twilio-otp-sender';

const silent = pino({ level: 'silent' });

describe('twilio otp sender', () => {
  it('posts To/From/Body to Twilio and does not log the code', async () => {
    const calls: Array<{ url: string; body: string }> = [];
    const logs: unknown[] = [];
    const logger = {
      error: (obj: unknown) => {
        logs.push(obj);
      },
    } as never;
    const sender = createTwilioOtpSender({
      accountSid: 'ACxxx',
      authToken: 'secret',
      from: '+85230000000',
      logger,
      fetchImpl: (async (url, init) => {
        calls.push({ url: String(url), body: String(init?.body) });
        return new Response('{}', { status: 201 });
      }) as typeof fetch,
    });
    await sender.send('+85291234567', '654321');
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toContain('/Accounts/ACxxx/Messages.json');
    expect(calls[0]?.body).toContain('To=%2B85291234567');
    expect(calls[0]?.body).toContain('From=%2B85230000000');
    expect(calls[0]?.body).toContain('654321');
    expect(JSON.stringify(logs)).not.toContain('654321');
  });

  it('requires Twilio in production and uses dev sender otherwise', () => {
    expect(() => createOtpSenderFromEnv({ NODE_ENV: 'production' }, silent)).toThrow(/TWILIO_/);
    const dev = createOtpSenderFromEnv({ NODE_ENV: 'development' }, silent);
    expect(typeof dev.send).toBe('function');
  });
});
