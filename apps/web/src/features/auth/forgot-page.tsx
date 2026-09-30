import { ForgotPasswordCommandSchema } from '@ysk-kit/contracts';
import { Button, Input } from '@ysk-kit/ui';
import { type FormEvent, useState } from 'react';
import { userHooks } from '../../lib/client';

export function ForgotPage() {
  const forgot = userHooks.useForgotPassword();
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = ForgotPasswordCommandSchema.safeParse({ email });
    if (!parsed.success) return;
    forgot.mutate(parsed.data, { onSuccess: () => setDone(true) });
  };

  return (
    <section className="mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Forgot password</h1>
      {done ? (
        <p className="text-sm text-zinc-600">If that email exists, we sent a reset link.</p>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-3">
          <label className="grid gap-1 text-sm" htmlFor="forgot-email">
            Email
            <Input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <Button type="submit" disabled={forgot.isPending}>
            Send link
          </Button>
        </form>
      )}
    </section>
  );
}
