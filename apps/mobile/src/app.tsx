import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaView } from 'react-native';
import { HomeScreen } from './screens/home-screen';
import { InboxScreen } from './screens/inbox-screen';
import { LoginScreen } from './screens/login-screen';

type Screen = 'login' | 'home' | 'inbox';

export function App() {
  const [screen, setScreen] = useState<Screen>('login');
  return (
    <SafeAreaView>
      {screen === 'login' ? <LoginScreen onSignedIn={() => setScreen('home')} /> : null}
      {screen === 'home' ? (
        <HomeScreen onInbox={() => setScreen('inbox')} onLogout={() => setScreen('login')} />
      ) : null}
      {screen === 'inbox' ? <InboxScreen onBack={() => setScreen('home')} /> : null}
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}
