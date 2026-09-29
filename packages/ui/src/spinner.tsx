import { cn } from './cn';

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900',
        className,
      )}
      role="status"
      aria-busy="true"
      aria-label="Loading"
    />
  );
}
