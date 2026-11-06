import { Text, View } from 'react-native';
import { AppIcon } from '@/components/app-icon';
import { StatusBadge, common } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { formatDate, resources } from '@/features/resources';
import { relatedRecord, relationFallback, type RelatedIndex } from '@/features/related-records';
import type { MissionEntity, Resource } from '@/types/api';

export function ResourceCard({ item, resource, related }: { item: MissionEntity; resource: Resource; related: RelatedIndex }) {
  const record = item as unknown as Record<string, string | number>;
  const definition = resources[resource];
  const reference = relatedRecord(item, resource, related);
  const heading = 'name' in item ? item.name : 'title' in item ? item.title : reference?.name ?? 'Leitura de sensor';
  const state = 'status' in item ? item.status : 'severity' in item ? item.severity : undefined;
  const critical = resource === 'alerts' && state === 'ACTIVE' || resource === 'events' && state === 'CRITICAL';
  return <View testID="resource-card" style={{ ...common.card, borderColor: critical ? colors.red + '55' : colors.border, borderLeftWidth: critical ? 3 : 1 }}>
    {critical && <Text style={{ ...common.eyebrow, color: colors.red, fontSize: 9 }}>PRIORIDADE CRÍTICA</Text>}
    <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
      <View style={{ ...common.iconBox, backgroundColor: critical ? colors.dangerSoft : colors.raised }}><AppIcon name={definition.icon} size={22} color={critical ? colors.red : colors.cyan} /></View>
      <View style={{ flex: 1, gap: 8 }}><Text selectable style={{ color: colors.text, fontSize: 17, fontWeight: '600', lineHeight: 24 }}>{heading}</Text>{state && <StatusBadge value={state} />}</View>
      <Text selectable style={{ color: colors.dim, fontSize: 11, paddingTop: 4, fontVariant: ['tabular-nums'] }}>#{item.id}</Text>
    </View>
    {resource === 'readings' && <View style={common.row}><Text selectable style={{ color: colors.cyan, fontSize: 32, fontWeight: '600', fontVariant: ['tabular-nums'], letterSpacing: -1 }}>{Number(record.value).toLocaleString('pt-BR', { maximumFractionDigits: 6 })}</Text><Text selectable style={common.subtitle}>{reference && 'unit' in reference ? reference.unit : 'unidade indisponível'}</Text></View>}
    {definition.fields.filter(field => !['name', 'title', 'status', 'severity', 'value'].includes(field.key)).map(field => (
      <View key={field.key} testID={field.kind === 'relation' ? 'related-reference' : undefined} style={{ gap: 4, borderTopWidth: field.kind === 'relation' ? 1 : 0, borderColor: colors.border, paddingTop: field.kind === 'relation' ? 12 : 0 }}>
        <Text style={{ color: colors.muted, fontSize: 10, letterSpacing: 0.5 }}>{field.label}</Text>
        <Text selectable style={{ color: colors.text, fontSize: 14, lineHeight: 22 }}>{field.kind === 'date' ? formatDate(String(record[field.key])) : field.kind === 'relation' ? reference?.name ?? relationFallback(field.relation!, Number(record[field.key])) : String(record[field.key])}</Text>
        {field.kind === 'relation' && reference && <Text selectable style={{ color: colors.dim, fontSize: 11, fontVariant: ['tabular-nums'] }}>#{record[field.key]}</Text>}
      </View>
    ))}
  </View>;
}
