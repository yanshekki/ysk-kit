import { CreateOrganizationCommandSchema, type OrganizationDto } from '@ysk/contracts';
import { useEffect, useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import { api } from '../lib/client';

export function OrgsScreen({
  onBack,
  onOpen,
}: {
  onBack: () => void;
  onOpen: (organizationId: string) => void;
}) {
  const [orgs, setOrgs] = useState<OrganizationDto[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.organizations
      .list()
      .then(setOrgs)
      .catch((err: Error) => setError(err.message));
  }, []);

  const submit = () => {
    const parsed = CreateOrganizationCommandSchema.safeParse({ name });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid');
      return;
    }
    setError(null);
    api.organizations
      .create(parsed.data)
      .then(() => {
        setName('');
        return api.organizations.list();
      })
      .then(setOrgs)
      .catch((err: Error) => setError(err.message));
  };

  return (
    <View>
      <Button title="Back" onPress={onBack} />
      <Text>Organizations</Text>
      <TextInput onChangeText={setName} value={name} />
      <Button title="Create" onPress={submit} />
      {error ? <Text>{error}</Text> : null}
      {orgs.map((org) => (
        <Button key={org.id} title={org.name} onPress={() => onOpen(org.id)} />
      ))}
    </View>
  );
}
