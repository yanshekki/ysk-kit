import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaView, Text } from 'react-native';
import { defaultPublicConfig } from '@ysk/config';
import { createYskClient } from '@ysk/sdk';
import { createSecureTokenStore } from './src/adapters/token-store';

const api = createYskClient({
  baseUrl: defaultPublicConfig().apiPublicUrl,
  platform: 'ios',
  tokenStore: createSecureTokenStore(),
});

export default function App() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    api.users.list().then((users) => setCount(users.length)).catch(() => setCount(0));
  }, []);
  return (
    <SafeAreaView>
      <Text>YSK Kit Mobile</Text>
      <Text>users: {count}</Text>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}
