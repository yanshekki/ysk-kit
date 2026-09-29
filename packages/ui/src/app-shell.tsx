import type { ReactNode } from 'react';

export function AppShell({
  brand,
  nav,
  trailing,
  children,
}: {
  brand: ReactNode;
  nav: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <nav className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3 text-sm">
          {brand}
          {nav}
          <span className="ml-auto" />
          {trailing}
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}
