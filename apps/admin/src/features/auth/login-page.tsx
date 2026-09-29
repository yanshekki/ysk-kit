import { useNavigate } from '@tanstack/react-router';
import { LoginPasswordCommandSchema, VerifyAdminOtpCommandSchema } from '@ysk/contracts';
import { Button, Input } from '@ysk/ui';
import { type FormEvent, useState } from 'react';
import { userHooks } from '../../lib/client';

export function LoginPage() {
  const login = userHooks.useLogin();
  const requestOtp = userHooks.useRequestAdminOtp();
  const verifyOtp = userHooks.useVerifyAdminOtp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const goUsers = () => {
    void navigate({ to: '/users' });
  };

  const onPassword = (event: FormEvent) => {
    event.preventDefault();
    const parsed = LoginPasswordCommandSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid');
      return;
    }
    login.mutate(parsed.data, {
      onSuccess: goUsers,
      onError: (error) => setFormError(error.message),
    });
  };

  const onSendCode = () => {
    if (!email.includes('@')) {
      setFormError('Enter an email first');
      return;
    }
    setFormError(null);
    requestOtp.mutate(
      { email },
      {
        onError: (error) => setFormError(error.message),
      },
    );
  };

  const onVerify = (event: FormEvent) => {
    event.preventDefault();
    const parsed = VerifyAdminOtpCommandSchema.safeParse({ email, code });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid');
      return;
    }
    verifyOtp.mutate(parsed.data, {
      onSuccess: goUsers,
      onError: (error) => setFormError(error.message),
    });
  };

  return (
    <section className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-semibold">Admin sign in</h1>
      <form onSubmit={onPassword} className="grid gap-3">
        <label className="grid gap-1 text-sm" htmlFor="admin-login-email">
          Email
          <Input
            id="admin-login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="grid gap-1 text-sm" htmlFor="admin-login-password">
          Password
          <Input
            id="admin-login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <Button type="submit" disabled={login.isPending}>
          Sign in
        </Button>
      </form>
      <form onSubmit={onVerify} className="grid gap-3">
        <p className="text-sm font-medium">Email code</p>
        <label className="grid gap-1 text-sm" htmlFor="admin-otp-code">
          6-digit code
          <Input
            id="admin-otp-code"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
          />
        </label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={requestOtp.isPending}
            onClick={onSendCode}
          >
            Send code
          </Button>
          <Button type="submit" disabled={verifyOtp.isPending}>
            Verify
          </Button>
        </div>
      </form>
      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
    </section>
  );
}
