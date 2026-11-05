import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';
import { AppIcon, type IconName } from '@/components/app-icon';
import { colors, radii, shadows, spacing, typography } from '@/theme';
import { statusLabels } from '@/features/resources';
export type { IconName } from '@/components/app-icon';

export function Button({ title, onPress, icon, secondary = false, busy = false, disabled = false }: {
  title: string; onPress: () => void; icon?: IconName; secondary?: boolean; busy?: boolean; disabled?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  const reduced = useReducedMotion();
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: disabled || busy, busy }}
    disabled={disabled || busy} onPress={onPress} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)}
    pressRetentionOffset={16}>
    <Animated.View style={{
      minHeight: 48, paddingHorizontal: 18, paddingVertical: 13, borderRadius: radii.sm, borderCurve: 'continuous',
      flexDirection: 'row', gap: spacing.xs, alignItems: 'center', justifyContent: 'center',
      backgroundColor: secondary ? colors.raised : colors.cyan, borderWidth: 1, borderColor: secondary ? colors.border : colors.cyan,
      opacity: disabled || busy ? 0.45 : pressed ? 0.85 : 1,
      transform: [{ scale: pressed && !reduced ? 0.97 : 1 }],
      transitionProperty: reduced ? 'opacity' : ['transform', 'opacity'], transitionDuration: '120ms',
      transitionTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
    }}>
      {busy ? <ActivityIndicator color={secondary ? colors.cyan : colors.ink} /> : icon ? <AppIcon name={icon} size={18} color={secondary ? colors.text : colors.ink} /> : null}
      <Text style={{ color: secondary ? colors.text : colors.ink, fontSize: 13, fontWeight: '700' }}>{title}</Text>
    </Animated.View>
  </Pressable>;
}
export function StatusBadge({ value }: { value: string }) {
  const color = ['CRITICAL', 'ACTIVE', 'OFFLINE'].includes(value) ? colors.red : ['WARNING', 'DEGRADED'].includes(value) ? colors.orange
    : ['OPERATIONAL', 'NOMINAL', 'RESOLVED'].includes(value) ? colors.green : colors.blue;
  return <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderCurve: 'continuous', backgroundColor: color + '12', borderWidth: 1, borderColor: color + '30' }}>
    <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: color }} />
    <Text selectable style={{ color, fontSize: 11, fontWeight: '700', letterSpacing: 0.2 }}>{statusLabels[value] ?? value}</Text>
  </View>;
}
export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <View accessibilityRole="alert" style={{ ...common.card, backgroundColor: colors.dangerSoft, borderColor: colors.red + '44', flexDirection: 'row', gap: spacing.sm }}>
    <AppIcon name="alert-circle-outline" color={colors.red} />
    <View style={{ flex: 1, gap: spacing.sm }}><Text selectable style={{ ...typography.body, color: colors.text }}>{message}</Text>
      {onRetry && <Button title="Tentar novamente" secondary onPress={onRetry} icon="refresh-outline" />}
    </View>
  </View>;
}
export function Loading({ label = 'Consultando a missão…' }: { label?: string }) {
  return <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl }}>
    <ActivityIndicator color={colors.cyan} /><Text style={common.subtitle}>{label}</Text>
  </View>;
}
export function EmptyState({ title = 'Nenhum registro por aqui', description }: { title?: string; description: string }) {
  return <View style={{ ...common.card, alignItems: 'center', padding: spacing.xl }}>
    <View style={common.iconBox}><AppIcon name="planet-outline" color={colors.cyan} size={28} /></View>
    <Text style={{ ...typography.title, color: colors.text, textAlign: 'center' }}>{title}</Text>
    <Text selectable style={{ ...common.subtitle, textAlign: 'center' }}>{description}</Text>
  </View>;
}
export function Screen({ children }: { children: ReactNode }) {
  return <View style={{ flex: 1, backgroundColor: colors.background }}>{children}</View>;
}
export function SectionHeading({ title, caption, icon }: { title: string; caption?: string; icon?: IconName }) {
  return <View style={{ gap: 4 }}>
    <View style={common.row}>{icon && <AppIcon name={icon} color={colors.cyan} size={19} />}<Text style={{ ...typography.title, fontSize: 18, color: colors.text }}>{title}</Text></View>
    {caption && <Text style={common.subtitle}>{caption}</Text>}
  </View>;
}
export const common = {
  content: { padding: spacing.lg, gap: spacing.lg, width: '100%' as const, maxWidth: 1120, alignSelf: 'center' as const, paddingBottom: spacing.xxl },
  eyebrow: { ...typography.label, color: colors.cyan },
  title: { ...typography.title, color: colors.text },
  subtitle: { ...typography.body, color: colors.muted },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radii.lg, borderCurve: 'continuous' as const, padding: spacing.lg, gap: spacing.md, boxShadow: shadows.panel },
  row: { flexDirection: 'row' as const, alignItems: 'center' as const, flexWrap: 'wrap' as const, gap: spacing.sm },
  iconBox: { width: 44, height: 44, borderRadius: radii.sm, borderCurve: 'continuous' as const, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: colors.raised, borderWidth: 1, borderColor: colors.border },
};
