import { router } from 'expo-router';
import type { Resource } from '@/types/api';
export function openResource(resource: Resource) {
  const pathname = resource === 'events' || resource === 'reports' ? '/occurrences' : '/monitoring';
  router.navigate({ pathname, params: { resource } });
}
