import { router } from 'expo-router';
import type { Resource } from '@/types/api';
export function openResource(resource: Resource) {
  const pathname = resource === 'sensors' || resource === 'readings' ? '/telemetry' : resource === 'modules' || resource === 'systems' ? '/equipment' : '/operations';
  router.navigate({ pathname, params: { resource } });
}
