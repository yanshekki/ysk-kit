import { describe, expect, it } from 'vitest';
import {
  desktopCsp,
  isAllowedRendererUrl,
  isTrustedIpcSender,
  rendererAllowedOrigins,
  windowOpenDecision,
} from './security';

describe('desktop security', () => {
  it('emits a strict production CSP with an explicit connect-src', () => {
    const csp = desktopCsp({
      production: true,
      connectSrc: ['http://localhost:3001'],
    });
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("connect-src 'self' http://localhost:3001");
    expect(csp).not.toContain('unsafe-eval');
  });

  it('compares navigation origins with URL, not string prefix', () => {
    const allowed = ['http://localhost:5173'];
    expect(isAllowedRendererUrl('http://localhost:5173/index.html', allowed)).toBe(true);
    expect(isAllowedRendererUrl('http://localhost:5173.evil.example/steal', allowed)).toBe(false);
    expect(isAllowedRendererUrl('https://evil.example', allowed)).toBe(false);
    expect(isAllowedRendererUrl('file:///tmp/app/index.html', ['file:'])).toBe(true);
    expect(isAllowedRendererUrl('file:///tmp/app/index.html', allowed)).toBe(false);
  });

  it('rejects IPC from an unknown frame URL', () => {
    const allowed = rendererAllowedOrigins({ rendererUrl: 'http://localhost:5173/' });
    expect(isTrustedIpcSender('http://localhost:5173/index.html', allowed)).toBe(true);
    expect(isTrustedIpcSender('https://evil.example/', allowed)).toBe(false);
    expect(isTrustedIpcSender(undefined, allowed)).toBe(false);
  });

  it('denies window.open', () => {
    expect(windowOpenDecision()).toEqual({ action: 'deny' });
  });
});
