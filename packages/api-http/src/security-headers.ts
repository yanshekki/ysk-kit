export const securityHeaders = (opts: {
  production: boolean;
  docs?: boolean;
}): Record<string, string> => {
  const csp = opts.docs
    ? "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data:; font-src 'self' https://cdn.jsdelivr.net; connect-src 'self'; frame-ancestors 'none'"
    : "default-src 'none'; frame-ancestors 'none'";
  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Content-Security-Policy': csp,
  };
  if (opts.production) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  }
  return headers;
};

export const applySecurityHeaders = (
  set: (name: string, value: string) => void,
  opts: { production: boolean; docs?: boolean },
): void => {
  for (const [name, value] of Object.entries(securityHeaders(opts))) {
    set(name, value);
  }
};
