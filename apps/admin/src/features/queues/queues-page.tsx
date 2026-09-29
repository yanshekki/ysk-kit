import { defaultPublicConfig } from '@ysk/config';
import { Button } from '@ysk/ui';
import { useEffect, useState } from 'react';
import { tokenStore } from '../../lib/client';

type BoardState = 'loading' | 'mounted' | 'off' | 'denied' | 'error';

export function QueuesPage() {
  const boardUrl = `${defaultPublicConfig().apiPublicUrl}/admin/queues`;
  const [state, setState] = useState<BoardState>('loading');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const token = await tokenStore.get();
      const headers = new Headers();
      if (token) headers.set('authorization', `Bearer ${token}`);
      try {
        const res = await fetch(boardUrl, { headers });
        if (cancelled) return;
        if (res.status === 404) {
          setState('off');
          return;
        }
        if (res.status === 401 || res.status === 403) {
          setState('denied');
          return;
        }
        if (res.ok) {
          setState('mounted');
          return;
        }
        setState('error');
      } catch {
        if (!cancelled) setState('error');
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [boardUrl]);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Queues</h1>
      {state === 'loading' ? <p className="text-sm text-zinc-600">Checking board…</p> : null}
      {state === 'off' ? (
        <p className="text-sm text-zinc-600">Bull Board is off (memory queue / no Redis).</p>
      ) : null}
      {state === 'denied' ? (
        <p className="text-sm text-zinc-600">ADMIN JWT required for /admin/queues.</p>
      ) : null}
      {state === 'error' ? (
        <p className="text-sm text-red-600">Could not reach the board.</p>
      ) : null}
      {state === 'mounted' ? (
        <p className="text-sm text-zinc-600">
          Board is mounted on the API. Browser tabs do not send Bearer JWT; open with the same token
          via Scalar /docs or curl.
        </p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          window.open(boardUrl, '_blank', 'noopener,noreferrer');
        }}
      >
        Open /admin/queues
      </Button>
    </section>
  );
}
