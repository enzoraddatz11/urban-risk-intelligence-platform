import { Text, View } from 'react-native';
import { AppIcon } from '@/components/app-icon';
import { SourceBadge, StatusBadge, common } from '@/components/ui';
import { formatDate, labels, riskIcons, timeAgo } from '@/features/resources';
import { severityColorKey } from '@/features/alerts';
import { colors, spacing } from '@/theme';
import type { PrioritizedAlert } from '@/types/api';

const factorLabels: [keyof PrioritizedAlert['factors'], string][] = [
  ['severity', 'Gravidade'], ['confidence', 'Confiança da origem'], ['corroboration', 'Relatos na região'], ['freshness', 'Leitura recente'],
];

/** Alerta priorizado com origem, confiança e os fatores do score. */
export function AlertCard({ alert, rank, compact = false }: { alert: PrioritizedAlert; rank: number; compact?: boolean }) {
  const color = colors[severityColorKey(alert.priority)];
  return <View testID="alert-card" accessible={compact}
    accessibilityLabel={compact ? 'Prioridade ' + rank + ': ' + alert.title + ', ' + alert.regionName + '. Prioridade ' + labels[alert.priority] + ', score ' + alert.score + '. Origem ' + labels[alert.source] + ', confiança ' + alert.confidence + ' de 100.' : undefined}
    style={{ ...common.card, borderColor: color + '55', borderLeftWidth: 4, borderLeftColor: color, gap: spacing.sm }}>
    <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
      <View style={{ ...common.iconBox, backgroundColor: color + '16', borderColor: color + '44' }}><AppIcon name={riskIcons[alert.riskType]} size={22} color={color} /></View>
      <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
        <Text style={{ color: colors.dim, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 }}>#{rank} · {labels[alert.riskType].toUpperCase()} · {alert.regionName.toUpperCase()}</Text>
        <Text selectable style={{ color: colors.text, fontSize: 17, fontWeight: '700', lineHeight: 24 }}>{alert.title}</Text>
      </View>
      <View style={{ alignItems: 'center', minWidth: 56 }} accessible accessibilityLabel={'Score de prioridade ' + alert.score + ' de 100'}>
        <Text style={{ color, fontSize: 26, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{alert.score}</Text>
        <Text style={{ color: colors.dim, fontSize: 10, fontWeight: '700' }}>SCORE</Text>
      </View>
    </View>
    <View style={common.row}>
      <StatusBadge value={alert.priority} prefix="Prioridade" />
      <StatusBadge value={alert.severity} prefix="Gravidade" />
    </View>
    <SourceBadge source={alert.source} confidence={alert.confidence} level={alert.confidenceLevel} />
    {!compact && <>
      <Text selectable style={common.subtitle}>{alert.description}</Text>
      <View style={{ gap: 8, borderTopWidth: 1, borderColor: colors.border, paddingTop: spacing.sm }}>
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>Por que esta prioridade?</Text>
        {factorLabels.map(([key, label]) => <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
          accessible accessibilityLabel={label + ': ' + alert.factors[key] + ' de 100'}>
          <Text style={{ color: colors.text, fontSize: 13, width: 150 }}>{label}</Text>
          <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.raised, overflow: 'hidden' }}>
            <View style={{ width: alert.factors[key] + '%', height: '100%', backgroundColor: color }} />
          </View>
          <Text style={{ color: colors.muted, fontSize: 12, width: 30, textAlign: 'right', fontVariant: ['tabular-nums'] }}>{alert.factors[key]}</Text>
        </View>)}
      </View>
    </>}
    <Text selectable style={{ color: colors.dim, fontSize: 12, lineHeight: 18 }}>
      {alert.communityReports} relato(s) de moradores em 24 h · última leitura de sensor: {timeAgo(alert.lastReadingAt)} · desde {formatDate(alert.occurredAt)}
    </Text>
  </View>;
}
