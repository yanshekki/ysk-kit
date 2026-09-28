import { useEffect, useState } from 'react';
import { defaultPublicConfig } from '@ysk/config';
import { createYskClient } from '@ysk/sdk';
import { canAct } from '@ysk/ui-logic';
import type { UserDto } from '@ysk/contracts';

const api = createYskClient({ baseUrl: defaultPublicConfig().apiPublicUrl, platform: 'admin' });

export function App() {
  const [users, setUsers] = useState<UserDto[]>([]);
  useEffect(() => {
    api.users.list().then(setUsers).catch(() => setUsers([]));
  }, []);
  return (
    <main style={{ fontFamily: 'sans-serif', padding: 24 }}>
      <h1>YSK Kit Admin</h1>
      {canAct('ADMIN', 'user.create') ? <p>can create users</p> : null}
      <ul>{users.map((u) => <li key={u.id}>{u.email} · {u.role}</li>)}</ul>
    </main>
  );
}
