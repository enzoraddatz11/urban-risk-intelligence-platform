import { Text, View } from 'react-native';
import { projectInfo } from '@/config/project-info';
import { colors, typography } from '@/theme';

/** Identifica a cidade simulada da demonstração; não representa a situação de risco. */
export function CityIdentity() {
  return <View style={{ alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.accent + '55',
    backgroundColor: colors.accentSoft, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7, borderCurve: 'continuous' }}>
    <Text selectable style={{ ...typography.label, letterSpacing: 1.3, color: colors.accent }}>{projectInfo.cityLabel}</Text>
  </View>;
}
