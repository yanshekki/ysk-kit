import { Link, useNavigate } from '@tanstack/react-router';
import { LoginPasswordCommandSchema } from '@ysk/contracts';
import { Button, ErrorBanner, FormField, Input, PageHeader } from '@ysk/ui';
import { type FormEvent, useState } from 'react';
import { userHooks } from '../../lib/client';

export function LoginPage() {
  const login = userHooks.useLogin();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = LoginPasswordCommandSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid');
      return;
    }
    login.mutate(parsed.data, {
      onSuccess: () => {
        void navigate({ to: '/users' });
      },
      onError: (error) => setFormError(error.message),
    });
  };

  return (
    <section className="mx-auto max-w-sm space-y-4">
      <PageHeader title="Sign in" />
      <form onSubmit={onSubmit} className="grid gap-3" noValidate>
        <FormField label="Email" htmlFor="login-email">
          <Input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Password" htmlFor="login-password">
          <Input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </FormField>
        <Button type="submit" disabled={login.isPending}>
          Sign in
        </Button>
      </form>
      {formError ? <ErrorBanner message={formError} /> : null}
      <p className="text-sm text-zinc-600">
        No account?{' '}
        <Link to="/register" className="underline">
          Register
        </Link>
        {' · '}
        <Link to="/forgot" className="underline">
          Forgot password
        </Link>
      </p>
    </section>
  );
}
