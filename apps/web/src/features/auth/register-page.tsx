import { useNavigate } from '@tanstack/react-router';
import { RegisterCommandSchema } from '@ysk/contracts';
import { Button, Input } from '@ysk/ui';
import { type FormEvent, useState } from 'react';
import { userHooks } from '../../lib/client';

export function RegisterPage() {
  const register = userHooks.useRegister();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = RegisterCommandSchema.safeParse({ email, password, displayName });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid');
      return;
    }
    register.mutate(parsed.data, {
      onSuccess: () => {
        void navigate({ to: '/users' });
      },
      onError: (error) => setFormError(error.message),
    });
  };

  return (
    <section className="mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Register</h1>
      <form onSubmit={onSubmit} className="grid gap-3">
        <label className="grid gap-1 text-sm" htmlFor="reg-name">
          Display name
          <Input
            id="reg-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </label>
        <label className="grid gap-1 text-sm" htmlFor="reg-email">
          Email
          <Input
            id="reg-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="grid gap-1 text-sm" htmlFor="reg-password">
          Password
          <Input
            id="reg-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </label>
        <Button type="submit" disabled={register.isPending}>
          Create account
        </Button>
      </form>
      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
    </section>
  );
}
