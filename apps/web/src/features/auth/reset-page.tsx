import { useNavigate } from '@tanstack/react-router';
import { ResetPasswordCommandSchema } from '@ysk-kit/contracts';
import { Button, Input } from '@ysk-kit/ui';
import { type FormEvent, useEffect, useState } from 'react';
import { userHooks } from '../../lib/client';

export function ResetPage() {
  const reset = userHooks.useResetPassword();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('token');
    if (fromQuery) {
      setToken(fromQuery);
      params.delete('token');
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
      window.history.replaceState({}, '', next);
    }
  }, []);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = ResetPasswordCommandSchema.safeParse({ token, password });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid');
      return;
    }
    reset.mutate(parsed.data, {
      onSuccess: () => {
        void navigate({ to: '/login' });
      },
      onError: (error) => setFormError(error.message),
    });
  };

  return (
    <section className="mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Reset password</h1>
      <form onSubmit={onSubmit} className="grid gap-3">
        <label className="grid gap-1 text-sm" htmlFor="reset-password">
          New password
          <Input
            id="reset-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </label>
        <Button type="submit" disabled={reset.isPending || token.length === 0}>
          Update password
        </Button>
      </form>
      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
    </section>
  );
}
