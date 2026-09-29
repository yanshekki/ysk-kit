import { LoginPasswordCommandSchema } from '@ysk/contracts';
import { Button, Input } from '@ysk/ui';
import { type FormEvent, useState } from 'react';
import { api } from '../lib/client';

export function LoginScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = LoginPasswordCommandSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid');
      return;
    }
    setPending(true);
    setFormError(null);
    api.auth
      .login(parsed.data)
      .then(() => onSignedIn())
      .catch((error: Error) => setFormError(error.message))
      .finally(() => setPending(false));
  };

  return (
    <section className="mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <form onSubmit={onSubmit} className="grid gap-3">
        <label className="grid gap-1 text-sm" htmlFor="desktop-login-email">
          Email
          <Input
            id="desktop-login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="grid gap-1 text-sm" htmlFor="desktop-login-password">
          Password
          <Input
            id="desktop-login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <Button type="submit" disabled={pending}>
          Sign in
        </Button>
      </form>
      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
    </section>
  );
}
