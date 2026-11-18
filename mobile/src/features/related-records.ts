import { resources } from '@/features/resources';
import type { ApiClient } from '@/services/client';
import type { EntityMap, UrbanEntity, Resource } from '@/types/api';

type RelatedResource = 'regions' | 'sensors';
export type RelatedEntity = EntityMap[RelatedResource];
export type RelatedIndex = ReadonlyMap<number, RelatedEntity>;

export function relationTarget(resource: Resource): RelatedResource | undefined {
  const relation = resources[resource].fields.find(field => field.kind === 'relation')?.relation;
  return relation === 'regions' || relation === 'sensors' ? relation : undefined;
}
export async function loadRelatedRecords(resource: Resource, client: Pick<ApiClient, 'all'>): Promise<RelatedIndex> {
  const target = relationTarget(resource);
  if (!target) return new Map();
  // Uma consulta paginada por coleção, compartilhada por todos os cartões da listagem.
  const records = await client.all(target);
  return new Map(records.map(record => [record.id, record]));
}
export function relatedRecord(item: UrbanEntity, resource: Resource, index: RelatedIndex): RelatedEntity | undefined {
  const field = resources[resource].fields.find(field => field.kind === 'relation');
  return field ? index.get(Number((item as unknown as Record<string, unknown>)[field.key])) : undefined;
}
export function relationFallback(target: Resource, id: number): string {
  const singular = resources[target].singular;
  return singular.charAt(0).toLocaleUpperCase('pt-BR') + singular.slice(1) + ' #' + id;
}
