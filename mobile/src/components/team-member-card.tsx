import { Text, View } from 'react-native';
import { AppIcon } from '@/components/app-icon';
import { colors, radii, spacing, typography } from '@/theme';

export function TeamMemberCard({ member, index, wide }: {
  member: { readonly name: string; readonly rm: string }; index: number; wide: boolean;
}) {
  return <View testID="team-member-card" style={{ flexGrow: 1, flexBasis: wide ? '30%' : '100%',
    minWidth: wide ? 190 : 0, padding: spacing.sm, gap: spacing.xs,
    borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, borderCurve: 'continuous', backgroundColor: colors.raised }}>
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
      <View style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 10, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
        <AppIcon name="person-outline" color={colors.accent} size={20} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text selectable style={{ color: colors.text, fontSize: 13, lineHeight: 19, flexShrink: 1, fontWeight: '600' }}>{member.name}</Text>
        <Text selectable style={{ ...typography.caption, fontSize: 11, color: colors.muted, fontVariant: ['tabular-nums'] }}>RM: {member.rm}</Text>
      </View>
      <Text style={{ color: colors.dim, fontSize: 9, lineHeight: 16, flexShrink: 0, fontVariant: ['tabular-nums'], alignSelf: 'flex-start' }}>{String(index + 1).padStart(2, '0')}</Text>
    </View>
  </View>;
}
