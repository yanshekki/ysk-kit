import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaView } from 'react-native';
import { HomeScreen } from './screens/home-screen';
import { InboxScreen } from './screens/inbox-screen';
import { InviteScreen } from './screens/invite-screen';
import { LoginScreen } from './screens/login-screen';
import { OrgDetailScreen } from './screens/org-detail-screen';
import { OrgsScreen } from './screens/orgs-screen';

type Screen = 'login' | 'home' | 'inbox' | 'orgs' | 'org-detail' | 'invite';

export function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  return (
    <SafeAreaView>
      {screen === 'login' ? (
        <LoginScreen
          onSignedIn={() => setScreen('home')}
          onAcceptInvite={() => setScreen('invite')}
        />
      ) : null}
      {screen === 'home' ? (
        <HomeScreen
          onInbox={() => setScreen('inbox')}
          onOrgs={() => setScreen('orgs')}
          onLogout={() => setScreen('login')}
        />
      ) : null}
      {screen === 'inbox' ? <InboxScreen onBack={() => setScreen('home')} /> : null}
      {screen === 'orgs' ? (
        <OrgsScreen
          onBack={() => setScreen('home')}
          onOpen={(id) => {
            setOrganizationId(id);
            setScreen('org-detail');
          }}
        />
      ) : null}
      {screen === 'org-detail' && organizationId ? (
        <OrgDetailScreen organizationId={organizationId} onBack={() => setScreen('orgs')} />
      ) : null}
      {screen === 'invite' ? <InviteScreen onDone={() => setScreen('login')} /> : null}
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}
