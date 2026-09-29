import { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';
import { createDevicePort, enablePush } from '../adapters/push';
import { api, mobilePlatform } from '../lib/client';

export function HomeScreen({ onInbox, onLogout }: { onInbox: () => void; onLogout: () => void }) {
  const [name, setName] = useState('…');
  const [pushOk, setPushOk] = useState<string | null>(null);

  useEffect(() => {
    api.auth
      .me()
      .then((me) => setName(me.displayName))
      .catch(() => setName('?'));
  }, []);

  const register = () => {
    const port = createDevicePort({ api, platform: mobilePlatform });
    enablePush(port, async () => 'ExponentPushToken[dev-placeholder]')
      .then((ok) => setPushOk(ok ? 'registered' : 'skipped'))
      .catch((err: Error) => setPushOk(err.message));
  };

  return (
    <View>
      <Text>Hello {name}</Text>
      <Button title="Inbox" onPress={onInbox} />
      <Button title="Enable notifications" onPress={register} />
      {pushOk ? <Text>{pushOk}</Text> : null}
      <Button
        title="Logout"
        onPress={() => {
          void api.auth.logout().finally(onLogout);
        }}
      />
    </View>
  );
}
