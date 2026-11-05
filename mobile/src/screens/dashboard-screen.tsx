import { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { AppIcon, type IconName } from '@/components/app-icon';
import { Button, ErrorNotice, Loading, Screen, StatusBadge, common } from '@/components/ui';
import { MissionOrbit } from '@/components/mission-orbit';
import { HealthPanel } from '@/components/health-panel';
import { TelemetryPanel } from '@/components/telemetry-panel';
import { colors, radii, spacing, typography } from '@/theme';
import { api } from '@/services/api';
import type { MissionStatus, Resource } from '@/types/api';
import { formatDate } from '@/features/resources';
import { openResource } from '@/navigation/resource-links';

export function DashboardScreen() {
  const wide = useWindowDimensions().width >= 800;
  const [data, setData] = useState<MissionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++token.current; setLoading(true); setError('');
    try { const result = await api.missionStatus(); if (current === token.current) setData(result); }
    catch (error) { if (current === token.current) setError(error instanceof Error ? error.message : 'Falha ao consultar status.'); }
    finally { if (current === token.current) setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void refresh(); return () => { token.current++; }; }, [refresh]));
  const metrics: { title: string; value: number; resource: Resource; icon: IconName; note: string }[] = data ? [
    { title: 'Sensores', value: data.sensors, resource: 'sensors', icon: 'radio-outline', note: 'INSTRUMENTAÇÃO' },
    { title: 'Módulos', value: data.modules, resource: 'modules', icon: 'hardware-chip-outline', note: 'COMPUTAÇÃO' },
    { title: 'Sistemas', value: data.systems, resource: 'systems', icon: 'layers-outline', note: 'INFRAESTRUTURA' },
    { title: 'Alertas ativos', value: data.activeCriticalAlerts, resource: 'alerts', icon: 'warning-outline', note: 'PRIORIDADES' },
  ] : [];
  const critical = data?.status === 'CRITICAL';
  const description = critical ? 'Atenção à missão.'
    : data?.status === 'WARNING' ? 'Operação sob atenção.'
    : data?.status === 'NOMINAL' ? 'Pronta para o próximo passo.'
    : 'Aguardando os primeiros dados.';
  return <Screen>
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={common.content} keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={loading && !!data} onRefresh={refresh} tintColor={colors.cyan} />}>
      <View style={{ ...common.row, justifyContent: 'space-between' }}>
        <View style={{ gap: 4 }}><Text style={common.eyebrow}>SPACE MISSION CONTROL</Text><Text style={common.subtitle}>Centro de operações · FIAP</Text></View>
        <Button title={loading ? 'Atualizando…' : 'Atualizar dados'} secondary icon="refresh-outline" onPress={refresh} disabled={loading} />
      </View>
      {!!error && <ErrorNotice message={error} onRetry={refresh} />}
      {!data && loading && <Loading />}
      {data && <>
        <View style={{ ...common.card, borderRadius: radii.xl, padding: wide ? 32 : 24, minHeight: 248, overflow: 'hidden', borderColor: '#2B4B5B' }}>
          <View pointerEvents="none" style={{ position: 'absolute', right: wide ? 8 : -80, top: -15, width: wide ? 330 : 260, height: 270, opacity: wide ? 1 : 0.4 }}><MissionOrbit /></View>
          <View style={{ gap: spacing.md, maxWidth: wide ? '65%' : '100%' }}>
            <View style={common.row}><Text style={common.eyebrow}>SITUAÇÃO DA MISSÃO</Text><StatusBadge value={data.status} /></View>
            <Text style={{ ...typography.display, color: colors.text, maxWidth: 490 }}>{description}</Text>
            <Text selectable style={{ ...common.subtitle, maxWidth: 390 }}>{critical ? 'Revise os alertas e os componentes que precisam de intervenção.' : data.status === 'UNKNOWN' ? 'Cadastre os componentes para começar o acompanhamento operacional.' : 'Acompanhe a saúde dos componentes e as últimas medições registradas.'}</Text>
            <View style={{ ...common.row, paddingTop: 6 }}><View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: error ? colors.orange : colors.cyan }} />
              <Text selectable style={{ ...common.subtitle, fontSize: 11 }}>Última consulta: {formatDate(data.checkedAt)}{error ? ' · dados anteriores' : ''}</Text>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {metrics.map(metric => {
            const accent = metric.resource === 'alerts' && metric.value > 0 ? colors.red : colors.cyan;
            return <Pressable key={metric.resource} accessibilityRole="button" accessibilityLabel={metric.title + ': ' + metric.value}
              onPress={() => openResource(metric.resource)} style={({ pressed }) => ({
                ...common.card, flexGrow: 1, flexBasis: wide ? '21%' : '44%', minWidth: 120, padding: wide ? 22 : 18,
                gap: spacing.sm, backgroundColor: pressed ? colors.raised : colors.surface, borderColor: metric.resource === 'alerts' && metric.value > 0 ? colors.red + '55' : colors.border,
              })}>
              <View style={{ ...common.row, justifyContent: 'space-between' }}><AppIcon name={metric.icon} size={21} color={accent} /><AppIcon name="arrow-forward" size={15} color={colors.dim} /></View>
              <Text selectable style={{ color: colors.text, fontSize: 34, fontWeight: '600', letterSpacing: -1, fontVariant: ['tabular-nums'] }}>{metric.value.toLocaleString('pt-BR')}</Text>
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '500' }}>{metric.title}</Text>
              <Text style={{ color: colors.dim, fontSize: 8, letterSpacing: 1.3, fontWeight: '700' }}>{metric.note}</Text>
            </Pressable>;
          })}
        </View>
        <View style={{ flexDirection: wide ? 'row' : 'column', gap: spacing.lg }}>
          <HealthPanel mission={data} />
          <View style={{ ...common.card, flex: 1, minWidth: 240, borderColor: data.activeCriticalAlerts ? colors.red + '44' : colors.border }}>
            <View style={common.row}><AppIcon name="warning-outline" color={data.activeCriticalAlerts ? colors.red : colors.cyan} /><Text style={common.eyebrow}>CENTRAL DE ALERTAS</Text></View>
            <Text selectable style={{ ...typography.title, color: colors.text }}>{data.activeCriticalAlerts ? data.activeCriticalAlerts + ' alerta(s) em aberto' : 'Nenhum alerta ativo'}</Text>
            <Text selectable style={common.subtitle}>{data.offlineComponents} componente(s) offline e {data.degradedComponents} com operação degradada. Consulte o registro de alertas para avaliar as ocorrências.</Text>
            <Button title="Consultar alertas" secondary onPress={() => openResource('alerts')} icon="arrow-forward" />
          </View>
        </View>
        <TelemetryPanel revision={data.checkedAt} onOpen={() => openResource('readings')} />
        <Pressable accessibilityRole="button" accessibilityLabel="Ver eventos" onPress={() => openResource('events')}
          style={({ pressed }) => ({ ...common.card, backgroundColor: pressed ? colors.raised : colors.surface, flexDirection: 'row', alignItems: 'center' })}>
          <View style={common.iconBox}><AppIcon name="terminal-outline" color={colors.cyan} /></View>
          <View style={{ flex: 1, gap: 4 }}><Text style={{ color: colors.text, fontWeight: '600' }}>Diário de operações</Text><Text selectable style={common.subtitle}>{data.events} evento(s) · {data.readings} leitura(s) registrados</Text></View>
          <AppIcon name="arrow-forward" color={colors.muted} size={18} />
        </Pressable>
        <Text style={{ color: colors.dim, fontSize: 10, letterSpacing: 1.5, textAlign: 'center' }}>MISSION CONTROL / DADOS CONSULTADOS DA API</Text>
      </>}
    </ScrollView>
  </Screen>;
}
