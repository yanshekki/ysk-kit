import { Button } from '@ysk-kit/ui';
import { useEffect, useState } from 'react';
import { api } from '../lib/client';

export function HomeScreen({ onInbox, onLogout }: { onInbox: () => void; onLogout: () => void }) {
  const [name, setName] = useState('…');

  useEffect(() => {
    api.auth
      .me()
      .then((me) => setName(me.displayName))
      .catch(() => setName('?'));
  }, []);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Hello {name}</h1>
      <div className="flex gap-2">
        <Button type="button" onClick={onInbox}>
          Inbox
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void api.auth.logout().finally(onLogout);
          }}
        >
          Logout
        </Button>
      </div>
    </section>
  );
}
