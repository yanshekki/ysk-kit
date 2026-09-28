import { useEffect, useState } from 'react';
import { defaultPublicConfig } from '@ysk/config';
import { createYskClient } from '@ysk/sdk';
import { userStatusLabel } from '@ysk/ui-logic';
import type { UserDto } from '@ysk/contracts';

const api = createYskClient({ baseUrl: defaultPublicConfig().apiPublicUrl, platform: 'web' });

export function App() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api.users.list().then(setUsers).catch((err: Error) => setError(err.message));
  }, []);
  return (
    <main style={{ fontFamily: 'sans-serif', padding: 24 }}>
      <h1>YSK Kit Web</h1>
      {error ? <p>{error}</p> : null}
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.displayName} · {user.email} · {userStatusLabel(user.status)}</li>
        ))}
      </ul>
    </main>
  );
}
