import { router, useLocalSearchParams } from 'expo-router';
import { ResourceScreen } from '@/screens/resource-screen';
import type { Resource } from '@/types/api';
const group: Resource[] = ["events","alerts"];
export default function Route() {
  const params = useLocalSearchParams<{ resource?: string }>();
  const selected = group.includes(params.resource as Resource) ? params.resource as Resource : group[0];
  return <ResourceScreen group={group} selected={selected} onSelect={resource => router.setParams({ resource })} />;
}
