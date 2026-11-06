import { Text, View } from 'react-native';
import { projectInfo } from '@/config/project-info';
import { colors, typography } from '@/theme';

/** Identidade institucional da demonstração; não representa o status operacional. */
export function MissionIdentity() {
  return <View style={{ alignSelf: 'flex-start', borderWidth: 1, borderColor: '#28524F',
    backgroundColor: '#0D292D', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7, borderCurve: 'continuous' }}>
    <Text selectable style={{ ...typography.label, fontSize: 9, letterSpacing: 1.3, color: colors.cyan }}>{projectInfo.missionLabel}</Text>
  </View>;
}
