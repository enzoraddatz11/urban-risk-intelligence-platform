import { useLocalSearchParams } from 'expo-router';
import { CreateScreen } from '@/screens/create-screen';
import { resources } from '@/features/resources';
import type { Resource } from '@/types/api';
import { EmptyState } from '@/components/ui';
export default function CreateRoute() {
  const { resource } = useLocalSearchParams<{ resource?: string }>();
  if (!resource || !Object.hasOwn(resources, resource)) return <EmptyState title="Tipo de registro inválido" description="Volte à listagem para escolher um recurso." />;
  return <CreateScreen resource={resource as Resource} />;
}
