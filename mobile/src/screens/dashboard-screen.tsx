import { Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { AppIcon, type IconName } from '@/components/app-icon';
import { AlertCard } from '@/components/alert-card';
import { Button, ErrorNotice, Loading, Screen, StatusBadge, common } from '@/components/ui';
import { ProjectIntroduction } from '@/components/project-introduction';
import { HealthPanel } from '@/components/health-panel';
import { TelemetryPanel } from '@/components/telemetry-panel';
import { colors, radii, spacing, typography } from '@/theme';
import { useMonitoring } from '@/providers/monitoring-provider';
import type { CityStatusValue, Resource } from '@/types/api';
import { formatDate } from '@/features/resources';
import { openResource } from '@/navigation/resource-links';

const headlines: Record<CityStatusValue, [string, string]> = {
  CRITICO: ['Risco crítico na cidade.', 'Há alertas de prioridade crítica. Consulte a lista priorizada e acompanhe os bairros afetados.'],
  ATENCAO: ['Cidade em atenção.', 'Existem riscos ativos ou sensores com falha. Acompanhe a evolução das ocorrências.'],
  NORMAL: ['Sem riscos ativos.', 'Sensores e bases públicas não indicam ocorrências no momento.'],
  SEM_DADOS: ['Aguardando os primeiros dados.', 'Cadastre bairros e sensores para iniciar o monitoramento.'],
};

export function DashboardScreen() {
  const wide = useWindowDimensions().width >= 800;
  const { status: data, alerts, connection, error, refreshing, refresh, revision } = useMonitoring();
  const metrics: { title: string; value: number; resource: Resource; icon: IconName; note: string; urgent?: boolean }[] = data ? [
    { title: 'Bairros monitorados', value: data.regions, resource: 'regions', icon: 'map', note: 'REGIÕES' },
    { title: 'Sensores urbanos', value: data.sensors, resource: 'sensors', icon: 'radio-outline', note: 'INSTRUMENTOS' },
    { title: 'Riscos ativos', value: data.activeEvents, resource: 'events', icon: 'warning-outline', note: 'EVENTOS', urgent: data.activeEvents > 0 },
    { title: 'Relatos de moradores', value: data.reports, resource: 'reports', icon: 'groups', note: 'COMUNITÁRIOS' },
  ] : [];
  const [headline, explanation] = data ? headlines[data.status] : ['', ''];
  return <Screen testID="dashboard-screen">
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={common.content} keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing && !!data} onRefresh={refresh} tintColor={colors.accent} />}>
      <ProjectIntroduction />
      <View testID="operational-header" style={{ ...common.row, justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.lg }}>
        <View style={{ gap: 4, flexGrow: 1, flexBasis: 240, minWidth: 0 }}><Text accessibilityRole="header" style={common.eyebrow}>PAINEL DE ACOMPANHAMENTO</Text><Text selectable style={common.subtitle}>Situação de risco da cidade simulada de Nova Ribeira</Text></View>
        <Button title={refreshing ? 'Atualizando…' : 'Atualizar dados'} secondary icon="refresh-outline" onPress={refresh} disabled={refreshing} />
      </View>
      {!!error && !data && connection !== 'offline' && <ErrorNotice message={error} onRetry={refresh} />}
      {!data && connection === 'offline' && <ErrorNotice message="Ainda não foi possível acessar a API. A reconexão é automática; os dados aparecem assim que o servidor responder." />}
      {!data && connection === 'checking' && <Loading />}
      {data && <>
        <View testID="city-status" style={{ ...common.card, borderRadius: radii.xl, padding: wide ? 32 : 24, gap: spacing.md,
          borderColor: data.status === 'CRITICO' ? colors.red + '66' : colors.border }}>
          <View style={common.row}><Text style={common.eyebrow}>SITUAÇÃO DA CIDADE</Text><StatusBadge value={data.status} /></View>
          <Text style={{ ...typography.display, color: colors.text, maxWidth: 600 }}>{headline}</Text>
          <Text selectable style={{ ...common.subtitle, maxWidth: 560 }}>{explanation}</Text>
          <View style={{ ...common.row, paddingTop: 4 }}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: connection === 'offline' ? colors.orange : colors.green }} />
            <Text selectable style={{ ...common.subtitle, fontSize: 12 }}>Última consulta: {formatDate(data.checkedAt)}{connection === 'offline' ? ' · dados anteriores' : ''}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {metrics.map(metric => {
            const accent = metric.urgent ? colors.red : colors.accent;
            return <Pressable key={metric.resource} accessibilityRole="button" accessibilityLabel={metric.title + ': ' + metric.value}
              onPress={() => openResource(metric.resource)} style={({ pressed }) => ({
                ...common.card, flexGrow: 1, flexBasis: wide ? '21%' : '44%', minWidth: 140, padding: wide ? 22 : 18,
                gap: spacing.sm, backgroundColor: pressed ? colors.raised : colors.surface, borderColor: metric.urgent ? colors.red + '55' : colors.border,
              })}>
              <View style={{ ...common.row, justifyContent: 'space-between' }}><AppIcon name={metric.icon} size={22} color={accent} /><AppIcon name="arrow-forward" size={16} color={colors.dim} /></View>
              <Text selectable style={{ color: colors.text, fontSize: 34, fontWeight: '700', letterSpacing: -1, fontVariant: ['tabular-nums'] }}>{metric.value.toLocaleString('pt-BR')}</Text>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{metric.title}</Text>
              <Text style={{ color: colors.dim, fontSize: 10, letterSpacing: 1.3, fontWeight: '700' }}>{metric.note}</Text>
            </Pressable>;
          })}
        </View>
        <View style={{ flexDirection: wide ? 'row' : 'column', gap: spacing.lg, alignItems: wide ? 'flex-start' : 'stretch' }}>
          <View testID="top-alerts" style={{ ...common.card, flex: wide ? 1.6 : undefined, gap: spacing.md }}>
            <View style={common.row}><AppIcon name="notifications" color={alerts.length ? colors.red : colors.accent} /><Text accessibilityRole="header" style={common.eyebrow}>ALERTAS MAIS PRIORITÁRIOS</Text></View>
            {alerts.length ? alerts.slice(0, 3).map((alert, index) => <AlertCard key={alert.eventId} alert={alert} rank={index + 1} compact />)
              : <Text style={common.subtitle}>Nenhum risco ativo no momento.</Text>}
            <Button title={'Ver todos os alertas (' + alerts.length + ')'} secondary icon="arrow-forward" onPress={() => router.navigate('/alerts')} />
          </View>
          <HealthPanel status={data} />
        </View>
        <TelemetryPanel revision={data.checkedAt + revision} onOpen={() => openResource('readings')} />
        <Pressable accessibilityRole="button" accessibilityLabel="Enviar relato anônimo" onPress={() => router.push({ pathname: '/create', params: { resource: 'reports' } })}
          style={({ pressed }) => ({ ...common.card, backgroundColor: pressed ? colors.raised : colors.surface, flexDirection: 'row', alignItems: 'center' })}>
          <View style={common.iconBox}><AppIcon name="groups" color={colors.accent} /></View>
          <View style={{ flex: 1, gap: 4 }}><Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>Viu algum problema no seu bairro?</Text><Text selectable style={common.subtitle}>Envie um relato anônimo. Nenhum dado pessoal é solicitado.</Text></View>
          <AppIcon name="arrow-forward" color={colors.muted} size={18} />
        </Pressable>
        <Text style={{ color: colors.dim, fontSize: 11, letterSpacing: 1.5, textAlign: 'center' }}>URBAN RISK INTELLIGENCE · DADOS SIMULADOS CONSULTADOS DA API</Text>
      </>}
    </ScrollView>
  </Screen>;
}
