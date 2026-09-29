import { Button } from '@ysk/ui';
import { useEffect, useState } from 'react';
import { api } from '../lib/client';

export function InboxScreen({ onBack }: { onBack: () => void }) {
  const [titles, setTitles] = useState<string[]>([]);

  useEffect(() => {
    api.notifications
      .list()
      .then((page) => setTitles(page.items.map((item) => item.title)))
      .catch(() => setTitles([]));
  }, []);

  return (
    <section className="space-y-4">
      <Button type="button" variant="outline" onClick={onBack}>
        Back
      </Button>
      <h1 className="text-2xl font-semibold">Inbox</h1>
      <ul className="space-y-1 text-sm text-zinc-700">
        {titles.map((title) => (
          <li key={title}>{title}</li>
        ))}
      </ul>
    </section>
  );
}
