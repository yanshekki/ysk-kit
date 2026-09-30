import { AcceptInviteCommandSchema } from '@ysk-kit/contracts';
import { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import { api } from '../lib/client';

export function InviteScreen({ onDone }: { onDone: () => void }) {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const parsed = AcceptInviteCommandSchema.safeParse({
      token,
      ...(password.length > 0 ? { password } : {}),
      ...(displayName.length > 0 ? { displayName } : {}),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid');
      return;
    }
    setError(null);
    api.organizations
      .acceptInvite(parsed.data)
      .then(() => onDone())
      .catch((err: Error) => setError(err.message));
  };

  return (
    <View>
      <Button title="Back" onPress={onDone} />
      <Text>Accept invite</Text>
      <TextInput autoCapitalize="none" onChangeText={setToken} value={token} />
      <TextInput secureTextEntry onChangeText={setPassword} value={password} />
      <TextInput onChangeText={setDisplayName} value={displayName} />
      <Button title="Accept" onPress={submit} />
      {error ? <Text>{error}</Text> : null}
    </View>
  );
}
