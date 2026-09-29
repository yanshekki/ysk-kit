import type { ReactNode } from 'react';

export function FormField({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1 text-sm">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error ? (
        <p className="text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
