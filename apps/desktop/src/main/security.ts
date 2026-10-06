export const desktopCsp = (opts: { production: boolean; connectSrc: string[] }): string => {
  const connect = ["'self'", ...opts.connectSrc].join(' ');
  if (!opts.production) {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self' data:",
      `connect-src ${connect} ws: wss: http://127.0.0.1:* http://localhost:*`,
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
    ].join('; ');
  }
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    `connect-src ${connect}`,
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
};

export const isAllowedRendererUrl = (raw: string, allowedOrigins: string[]): boolean => {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol === 'file:') {
    return allowedOrigins.includes('file:');
  }
  return allowedOrigins.some((allowed) => {
    try {
      return new URL(allowed).origin === url.origin;
    } catch {
      return false;
    }
  });
};

export const isTrustedIpcSender = (
  frameUrl: string | undefined,
  allowedOrigins: string[],
): boolean => Boolean(frameUrl && isAllowedRendererUrl(frameUrl, allowedOrigins));

export const windowOpenDecision = (): { action: 'deny' } => ({ action: 'deny' });

export const rendererAllowedOrigins = (opts: { rendererUrl?: string | undefined }): string[] => {
  if (opts.rendererUrl) return [opts.rendererUrl];
  return ['file:'];
};
