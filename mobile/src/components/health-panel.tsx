import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { sensorHealth } from '@/features/alerts';
import type { CityStatus } from '@/types/api';
import { colors, typography } from '@/theme';
import { common, SectionHeading } from '@/components/ui';
export function HealthPanel({ status }: { status: CityStatus }) {
  const health = sensorHealth(status);
  const segments = [
    { label: 'Operantes', count: health.operational, color: colors.green },
    { label: 'Instáveis', count: health.unstable, color: colors.orange },
    { label: 'Offline', count: health.offline, color: colors.red },
  ];
  const circumference = 2 * Math.PI * 48;
  let offset = 0;
  return <View testID="sensor-health" style={{ ...common.card, flex: 1, minWidth: 240 }}>
    <SectionHeading title="Rede de sensores" caption="Situação dos instrumentos urbanos" />
    <View style={{ ...common.row, gap: 24, justifyContent: 'center' }}>
      <View accessible accessibilityLabel={health.percentage === null ? 'Sem sensores' : health.percentage + '% dos sensores operantes'}
        style={{ width: 126, height: 126, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={126} height={126} style={{ position: 'absolute' }} viewBox="0 0 126 126">
          <Circle cx={63} cy={63} r={48} fill="none" stroke={colors.raised} strokeWidth={8} />
          {segments.map(segment => {
            const length = health.total ? segment.count / health.total * circumference : 0;
            const start = offset; offset += length;
            return length > 0 ? <Circle key={segment.label} cx={63} cy={63} r={48} fill="none" stroke={segment.color} strokeWidth={8}
              strokeDasharray={[length, circumference - length]} strokeDashoffset={-start} transform="rotate(-90 63 63)" /> : null;
          })}
        </Svg>
        <Text selectable style={{ ...typography.display, fontSize: 30, color: colors.text, fontVariant: ['tabular-nums'] }}>{health.percentage === null ? '—' : health.percentage + '%'}</Text>
        <Text style={{ color: colors.muted, fontSize: 11 }}>operantes</Text>
      </View>
      <View style={{ flex: 1, minWidth: 120, gap: 14 }}>{segments.map(segment => <View key={segment.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: segment.color }} />
        <Text style={{ ...common.subtitle, flex: 1, fontSize: 13 }}>{segment.label}</Text>
        <Text selectable style={{ color: colors.text, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{segment.count}</Text>
      </View>)}</View>
    </View>
    {!health.total && <Text style={common.subtitle}>Cadastre sensores para visualizar a situação da rede.</Text>}
  </View>;
}
