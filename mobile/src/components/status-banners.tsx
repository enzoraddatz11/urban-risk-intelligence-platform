import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppIcon } from '@/components/app-icon';
import { useMonitoring } from '@/providers/monitoring-provider';
import { secondsUntil } from '@/features/connection';
import { colors, radii, spacing } from '@/theme';

/** Aviso de desconexão. Não bloqueia a tela: os últimos dados continuam disponíveis e a reconexão é automática. */
export function ConnectionBanner() {
  const { connection, recovered, nextRetryAt, refreshing, refresh } = useMonitoring();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (connection !== 'offline') return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [connection]);

  if (connection === 'online' && recovered) return <View testID="connection-recovered" accessibilityRole="alert" accessibilityLiveRegion="polite"
    style={[banner, { backgroundColor: colors.green + '1A', borderColor: colors.green + '55' }]}>
    <AppIcon name="wifi" color={colors.green} size={20} />
    <Text style={{ color: colors.text, flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '600' }}>Conexão restabelecida. Dados atualizados.</Text>
  </View>;
  if (connection !== 'offline') return null;
  const seconds = secondsUntil(nextRetryAt, now);
  return <View testID="connection-offline" accessibilityRole="alert" accessibilityLiveRegion="polite"
    style={[banner, { backgroundColor: colors.dangerSoft, borderColor: colors.red + '66' }]}>
    <AppIcon name="wifi-off" color={colors.red} size={22} />
    <View style={{ flex: 1, minWidth: 180, gap: 2 }}>
      <Text style={{ color: colors.text, fontSize: 15, lineHeight: 21, fontWeight: '700' }}>Sem conexão com o servidor</Text>
      <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>
        {refreshing ? 'Tentando reconectar…' : seconds ? 'Nova tentativa automática em ' + seconds + ' s.' : 'Tentando reconectar…'} Você pode continuar usando o app com os últimos dados recebidos.
      </Text>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel="Tentar reconectar agora" onPress={refresh} disabled={refreshing}
      style={({ pressed }) => ({ minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderRadius: radii.sm, borderWidth: 1,
        borderColor: colors.border, backgroundColor: pressed ? colors.raised : colors.surface, opacity: refreshing ? 0.5 : 1 })}>
      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>Tentar agora</Text>
    </Pressable>
  </View>;
}

/** Notificação no app para novos alertas de prioridade alta ou crítica. */
export function AlertNotificationBanner() {
  const { notification, dismissNotification } = useMonitoring();
  if (!notification) return null;
  return <View testID="alert-notification" accessibilityRole="alert" accessibilityLiveRegion="assertive"
    style={[banner, { backgroundColor: colors.accentSoft, borderColor: colors.accent + '88' }]}>
    <AppIcon name="notifications" color={colors.accent} size={22} />
    <View style={{ flex: 1, minWidth: 180, gap: 2 }}>
      <Text style={{ color: colors.text, fontSize: 15, lineHeight: 21, fontWeight: '700' }}>{notification.title}</Text>
      <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>{notification.body}</Text>
    </View>
    <View style={{ flexDirection: 'row', gap: spacing.xs }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Ver alertas" onPress={() => { dismissNotification(); router.navigate('/alerts'); }}
        style={({ pressed }) => ({ minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderRadius: radii.sm, backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 })}>
        <Text style={{ color: colors.ink, fontWeight: '700', fontSize: 13 }}>Ver alertas</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Dispensar notificação" onPress={dismissNotification}
        style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}>
        <AppIcon name="close" color={colors.muted} size={20} />
      </Pressable>
    </View>
  </View>;
}

const banner = {
  flexDirection: 'row' as const, flexWrap: 'wrap' as const, alignItems: 'center' as const, gap: spacing.sm,
  marginHorizontal: spacing.md, marginTop: spacing.sm, padding: spacing.sm, paddingHorizontal: spacing.md,
  borderRadius: radii.md, borderCurve: 'continuous' as const, borderWidth: 1,
};
