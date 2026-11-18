import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';
import { useIsFocused } from 'expo-router/react-navigation';
import { AppIcon, type IconName } from '@/components/app-icon';
import { AlertNotificationBanner, ConnectionBanner } from '@/components/status-banners';
import { colors, radii, shadows, spacing, typography } from '@/theme';
import { labels } from '@/features/resources';
import { severityColorKey } from '@/features/alerts';
import type { ConfidenceLevel, DataSource } from '@/types/api';
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
      backgroundColor: secondary ? colors.raised : colors.accent, borderWidth: 1, borderColor: secondary ? colors.border : colors.accent,
      opacity: disabled || busy ? 0.45 : pressed ? 0.85 : 1,
      transform: [{ scale: pressed && !reduced ? 0.97 : 1 }],
      transitionProperty: reduced ? 'opacity' : ['transform', 'opacity'], transitionDuration: '120ms',
      transitionTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
    }}>
      {busy ? <ActivityIndicator color={secondary ? colors.accent : colors.ink} /> : icon ? <AppIcon name={icon} size={18} color={secondary ? colors.text : colors.ink} /> : null}
      <Text style={{ color: secondary ? colors.text : colors.ink, fontSize: 14, fontWeight: '700' }}>{title}</Text>
    </Animated.View>
  </Pressable>;
}
export function StatusBadge({ value, prefix }: { value: string; prefix?: string }) {
  const color = colors[severityColorKey(value)];
  return <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderCurve: 'continuous', backgroundColor: color + '16', borderWidth: 1, borderColor: color + '44' }}>
    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
    <Text selectable style={{ color, fontSize: 12, fontWeight: '700', letterSpacing: 0.2 }}>{prefix ? prefix + ': ' : ''}{labels[value] ?? value}</Text>
  </View>;
}
const sourceIcons: Record<DataSource, IconName> = { SENSOR: 'radio-outline', BASE_PUBLICA: 'verified', COMUNITARIO: 'groups' };
/** Origem e confiança de um dado, em texto (não apenas cor) para leitores de tela e daltonismo. */
export function SourceBadge({ source, confidence, level }: { source: DataSource; confidence: number; level: ConfidenceLevel }) {
  const color = level === 'ALTO' ? colors.green : level === 'MEDIO' ? colors.accent : colors.orange;
  return <View testID="source-badge" accessible accessibilityLabel={'Origem: ' + labels[source] + '. Confiança ' + labels[level].toLowerCase() + ', ' + confidence + ' de 100.'}
    style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5, paddingHorizontal: 9, borderRadius: 8, backgroundColor: colors.infoSoft, borderWidth: 1, borderColor: colors.blue + '44' }}>
      <AppIcon name={sourceIcons[source]} size={15} color={colors.blue} />
      <Text style={{ color: colors.blue, fontSize: 12, fontWeight: '700' }}>{labels[source]}</Text>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5, paddingHorizontal: 9, borderRadius: 8, backgroundColor: color + '16', borderWidth: 1, borderColor: color + '44' }}>
      <Text style={{ color, fontSize: 12, fontWeight: '700' }}>Confiança {labels[level].toLowerCase()} · {confidence}/100</Text>
    </View>
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
export function Loading({ label = 'Consultando a cidade…' }: { label?: string }) {
  return <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl }}>
    <ActivityIndicator color={colors.accent} /><Text style={common.subtitle}>{label}</Text>
  </View>;
}
export function EmptyState({ title = 'Nenhum registro por aqui', description }: { title?: string; description: string }) {
  return <View style={{ ...common.card, alignItems: 'center', padding: spacing.xl }}>
    <View style={common.iconBox}><AppIcon name="city" color={colors.accent} size={28} /></View>
    <Text style={{ ...typography.title, color: colors.text, textAlign: 'center' }}>{title}</Text>
    <Text selectable style={{ ...common.subtitle, textAlign: 'center' }}>{description}</Text>
  </View>;
}
/**
 * Contêiner das telas: inclui os avisos de conexão e de novos alertas no topo, sem bloquear o conteúdo.
 * Só a tela em foco mostra os avisos; no web as abas inativas continuam montadas e duplicariam os anúncios.
 */
export function Screen({ children, testID }: { children: ReactNode; testID?: string }) {
  const focused = useIsFocused();
  return <View testID={testID} style={{ flex: 1, backgroundColor: colors.background }}>
    {focused && <ConnectionBanner />}
    {focused && <AlertNotificationBanner />}
    <View style={{ flex: 1 }}>{children}</View>
  </View>;
}
export function SectionHeading({ title, caption, icon }: { title: string; caption?: string; icon?: IconName }) {
  return <View style={{ gap: 4 }}>
    <View style={common.row}>{icon && <AppIcon name={icon} color={colors.accent} size={19} />}<Text accessibilityRole="header" style={{ ...typography.title, fontSize: 18, color: colors.text }}>{title}</Text></View>
    {caption && <Text style={common.subtitle}>{caption}</Text>}
  </View>;
}
export const common = {
  content: { padding: spacing.lg, gap: spacing.lg, width: '100%' as const, maxWidth: 1120, alignSelf: 'center' as const, paddingBottom: spacing.xxl },
  eyebrow: { ...typography.label, color: colors.accent },
  title: { ...typography.title, color: colors.text },
  subtitle: { ...typography.body, color: colors.muted },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radii.lg, borderCurve: 'continuous' as const, padding: spacing.lg, gap: spacing.md, boxShadow: shadows.panel },
  row: { flexDirection: 'row' as const, alignItems: 'center' as const, flexWrap: 'wrap' as const, gap: spacing.sm },
  iconBox: { width: 44, height: 44, borderRadius: radii.sm, borderCurve: 'continuous' as const, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: colors.raised, borderWidth: 1, borderColor: colors.border },
};
