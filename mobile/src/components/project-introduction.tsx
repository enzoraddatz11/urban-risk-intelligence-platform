import { Text, View, useWindowDimensions } from 'react-native';
import { useIsFocused } from 'expo-router/react-navigation';
import { FloatingAstronaut } from '@/components/floating-astronaut';
import { MissionIdentity } from '@/components/mission-identity';
import { TeamMemberCard } from '@/components/team-member-card';
import { common } from '@/components/ui';
import { projectInfo } from '@/config/project-info';
import { colors, radii, spacing, typography } from '@/theme';

/** Apresentação institucional independente da disponibilidade da API. */
export function ProjectIntroduction() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const focused = useIsFocused();
  const astronautSize = wide ? 284 : width < 375 ? 166 : 186;
  const illustration = <FloatingAstronaut size={astronautSize} playing={focused} />;

  return <View testID="project-introduction" style={{
    ...common.card, padding: wide ? spacing.xl : spacing.md,
    borderRadius: radii.xl, borderColor: '#29505B', backgroundColor: '#0A1928',
    gap: spacing.lg, flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'center' : 'stretch',
  }}>
    <View style={{ flex: wide ? 1 : undefined, minWidth: 0, gap: spacing.md }}>
      <View style={{ ...common.row, gap: spacing.xs }}>
        <View style={{ width: 18, height: 2, backgroundColor: colors.cyan }} />
        <Text selectable style={common.eyebrow}>PROJETO ACADÊMICO · FIAP</Text>
      </View>
      <View style={{ gap: spacing.sm }}>
        <Text selectable accessibilityRole="header" style={{
          ...typography.display, fontSize: wide ? 38 : 29, lineHeight: wide ? 44 : 34,
          color: colors.text, letterSpacing: -1,
        }}>{projectInfo.title}</Text>
        <MissionIdentity />
      </View>
      <Text selectable style={{ ...typography.body, color: colors.muted, maxWidth: 580 }}>{projectInfo.description}</Text>
      {!wide && <View testID="presentation-astronaut" style={{ alignItems: 'center' }}>{illustration}</View>}
      <View testID="project-team" style={{ gap: spacing.sm, borderTopWidth: 1, borderTopColor: '#25404F', paddingTop: spacing.md, marginTop: spacing.xs }}>
        <Text selectable style={{ ...typography.label, color: colors.cyan }}>EQUIPE DO PROJETO</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {projectInfo.members.map((member, index) => <TeamMemberCard key={index} member={member} index={index} wide={wide} />)}
        </View>
      </View>
    </View>
    {wide && <View testID="presentation-astronaut" style={{ alignItems: 'center', gap: spacing.xs }}>
      {illustration}
      <Text style={{ ...typography.label, color: colors.dim, fontSize: 9 }}>EXPLORAR. MONITORAR. CONECTAR.</Text>
    </View>}
  </View>;
}
