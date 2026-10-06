import { describe, expect, it } from 'vitest';
import { createLogMailer, renderMail } from './index.js';

describe('mail', () => {
  it('renders templates without leaking extra vars', () => {
    const rendered = renderMail('auth.reset', 'en', {
      resetUrl: 'https://example.com/reset?token=secret',
    });
    expect(rendered.text).toContain('https://example.com/reset?token=secret');
    expect(rendered.subject).toBe('Reset your password');
  });

  it('log adapter records to, template, subject only', async () => {
    const mail = createLogMailer();
    await mail.send({
      to: 'dev@ysk.hk',
      template: 'auth.reset',
      locale: 'en',
      vars: { resetUrl: 'https://example.com/reset?token=secret' },
    });
    expect(mail.sink[0]).toEqual({
      to: 'dev@ysk.hk',
      template: 'auth.reset',
      subject: 'Reset your password',
    });
    expect(JSON.stringify(mail.sink[0])).not.toContain('secret');
  });
});
