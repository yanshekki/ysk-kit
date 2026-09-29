import { useState } from 'react';
import { HomeScreen } from './screens/home-screen';
import { InboxScreen } from './screens/inbox-screen';
import { LoginScreen } from './screens/login-screen';

type Screen = 'login' | 'home' | 'inbox';

export function App() {
  const [screen, setScreen] = useState<Screen>('login');
  return (
    <div className="min-h-screen bg-zinc-50 p-8 text-zinc-900">
      {screen === 'login' ? <LoginScreen onSignedIn={() => setScreen('home')} /> : null}
      {screen === 'home' ? (
        <HomeScreen onInbox={() => setScreen('inbox')} onLogout={() => setScreen('login')} />
      ) : null}
      {screen === 'inbox' ? <InboxScreen onBack={() => setScreen('home')} /> : null}
    </div>
  );
}
