import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { componentHealth } from '@/features/mission-metrics';
import type { MissionStatus } from '@/types/api';
import { colors, typography } from '@/theme';
import { common, SectionHeading } from '@/components/ui';
export function HealthPanel({ mission }: { mission: MissionStatus }) {
  const health = componentHealth(mission);
  const segments = [
    { label: 'Operacionais', count: health.operational, color: colors.cyan },
    { label: 'Degradados', count: health.degraded, color: colors.orange },
    { label: 'Offline', count: health.offline, color: colors.red },
  ];
  const circumference = 2 * Math.PI * 48;
  let offset = 0;
  return <View style={{ ...common.card, flex: 1, minWidth: 240 }}>
    <SectionHeading title="Saúde da infraestrutura" caption="Módulos, sensores e sistemas" />
    <View style={{ ...common.row, gap: 24, justifyContent: 'center' }}>
      <View style={{ width: 126, height: 126, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={126} height={126} style={{ position: 'absolute' }} viewBox="0 0 126 126">
          <Circle cx={63} cy={63} r={48} fill="none" stroke={colors.raised} strokeWidth={7} />
          {segments.map(segment => {
            const length = health.total ? segment.count / health.total * circumference : 0;
            const start = offset; offset += length;
            return length > 0 ? <Circle key={segment.label} cx={63} cy={63} r={48} fill="none" stroke={segment.color} strokeWidth={7}
              strokeDasharray={[length, circumference - length]} strokeDashoffset={-start} transform="rotate(-90 63 63)" /> : null;
          })}
        </Svg>
        <Text selectable style={{ ...typography.display, fontSize: 30, color: colors.text, fontVariant: ['tabular-nums'] }}>{health.percentage === null ? '—' : health.percentage + '%'}</Text>
        <Text style={{ color: colors.muted, fontSize: 10 }}>operacional</Text>
      </View>
      <View style={{ flex: 1, minWidth: 120, gap: 14 }}>{segments.map(segment => <View key={segment.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: segment.color }} />
        <Text style={{ ...common.subtitle, flex: 1, fontSize: 12 }}>{segment.label}</Text>
        <Text selectable style={{ color: colors.text, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{segment.count}</Text>
      </View>)}</View>
    </View>
    {!health.total && <Text style={common.subtitle}>Cadastre componentes para visualizar a distribuição.</Text>}
  </View>;
}
