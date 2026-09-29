import { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';
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
    <View>
      <Button title="Back" onPress={onBack} />
      <Text>Inbox</Text>
      {titles.map((title) => (
        <Text key={title}>{title}</Text>
      ))}
    </View>
  );
}
