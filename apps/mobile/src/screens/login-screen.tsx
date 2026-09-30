import { LoginPasswordCommandSchema } from '@ysk-kit/contracts';
import { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import { api } from '../lib/client';

export function LoginScreen({
  onSignedIn,
  onAcceptInvite,
}: {
  onSignedIn: () => void;
  onAcceptInvite: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const parsed = LoginPasswordCommandSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid');
      return;
    }
    api.auth
      .login(parsed.data)
      .then(() => onSignedIn())
      .catch((err: Error) => setError(err.message));
  };

  return (
    <View>
      <Text>Sign in</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
        value={email}
      />
      <TextInput secureTextEntry onChangeText={setPassword} value={password} />
      <Button title="Sign in" onPress={submit} />
      <Button title="Accept invite" onPress={onAcceptInvite} />
      {error ? <Text>{error}</Text> : null}
    </View>
  );
}
