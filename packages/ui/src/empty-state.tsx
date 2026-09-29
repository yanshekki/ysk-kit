import type { ReactNode } from 'react';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-dashed border-zinc-300 bg-white px-4 py-10 text-center">
      <p className="font-medium text-zinc-900">{title}</p>
      {description ? <p className="mt-1 text-sm text-zinc-600">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
