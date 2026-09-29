import type { InputHTMLAttributes } from 'react';
import { cn } from './cn';

export function Input({ className, id, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      id={id}
      className={cn(
        'flex h-9 w-full rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm shadow-sm outline-none focus:border-zinc-500',
        className,
      )}
      {...props}
    />
  );
}
