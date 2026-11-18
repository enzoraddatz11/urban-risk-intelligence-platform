import { Text, View } from 'react-native';
import { AppIcon } from '@/components/app-icon';
import { SourceBadge, StatusBadge, common } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { formatDate, labels, resources, riskIcons } from '@/features/resources';
import { relatedRecord, relationFallback, type RelatedIndex } from '@/features/related-records';
import type { Resource, UrbanEntity } from '@/types/api';

const shown: Record<Resource, string[]> = {
  regions: ['city', 'description'],
  sensors: ['type', 'unit', 'regionId'],
  readings: ['recordedAt', 'sensorId'],
  events: ['description', 'type', 'occurredAt', 'regionId'],
  reports: ['description', 'occurredAt', 'regionId'],
};

export function ResourceCard({ item, resource, related }: { item: UrbanEntity; resource: Resource; related: RelatedIndex }) {
  const record = item as unknown as Record<string, string | number>;
  const definition = resources[resource];
  const reference = relatedRecord(item, resource, related);
  const heading = 'name' in item ? item.name : 'title' in item ? item.title
    : 'riskType' in item ? 'Relato: ' + labels[item.riskType] : reference?.name ?? 'Leitura de sensor';
  const states = [
    'severity' in item ? item.severity : undefined,
    'status' in item ? item.status : undefined,
  ].filter((value): value is NonNullable<typeof value> => !!value);
  const critical = resource === 'events' && 'status' in item && item.status === 'ATIVO' && ['ALTA', 'CRITICA'].includes(String(record.severity));
  const icon = 'type' in item && resource === 'events' ? riskIcons[String(item.type)] : 'riskType' in item ? riskIcons[item.riskType] : definition.icon;
  return <View testID="resource-card" style={{ ...common.card, borderColor: critical ? colors.red + '55' : colors.border, borderLeftWidth: critical ? 4 : 1, borderLeftColor: critical ? colors.red : colors.border }}>
    <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
      <View style={{ ...common.iconBox, backgroundColor: critical ? colors.dangerSoft : colors.raised }}><AppIcon name={icon} size={22} color={critical ? colors.red : colors.accent} /></View>
      <View style={{ flex: 1, gap: 8 }}>
        <Text selectable style={{ color: colors.text, fontSize: 17, fontWeight: '700', lineHeight: 24 }}>{heading}</Text>
        {!!states.length && <View style={common.row}>{states.map(state => <StatusBadge key={state} value={state} />)}</View>}
      </View>
      <Text selectable style={{ color: colors.dim, fontSize: 12, paddingTop: 4, fontVariant: ['tabular-nums'] }}>#{item.id}</Text>
    </View>
    {resource === 'readings' && <View style={common.row}><Text selectable style={{ color: colors.accent, fontSize: 32, fontWeight: '700', fontVariant: ['tabular-nums'], letterSpacing: -1 }}>{Number(record.value).toLocaleString('pt-BR', { maximumFractionDigits: 6 })}</Text><Text selectable style={common.subtitle}>{reference && 'unit' in reference ? reference.unit : 'unidade indisponível'}</Text></View>}
    <SourceBadge source={item.source} confidence={item.confidence} level={item.confidenceLevel} />
    {definition.fields.filter(field => shown[resource].includes(field.key)).map(field => (
      <View key={field.key} testID={field.kind === 'relation' ? 'related-reference' : undefined} style={{ gap: 4, borderTopWidth: field.kind === 'relation' ? 1 : 0, borderColor: colors.border, paddingTop: field.kind === 'relation' ? 12 : 0 }}>
        <Text style={{ color: colors.muted, fontSize: 12 }}>{field.label}</Text>
        <Text selectable style={{ color: colors.text, fontSize: 15, lineHeight: 22 }}>{field.kind === 'date' ? formatDate(String(record[field.key]))
          : field.kind === 'relation' ? reference?.name ?? relationFallback(field.relation!, Number(record[field.key]))
          : field.kind === 'select' ? labels[String(record[field.key])] ?? String(record[field.key]) : String(record[field.key])}</Text>
        {field.kind === 'relation' && reference && <Text selectable style={{ color: colors.dim, fontSize: 12, fontVariant: ['tabular-nums'] }}>#{record[field.key]}</Text>}
      </View>
    ))}
  </View>;
}
