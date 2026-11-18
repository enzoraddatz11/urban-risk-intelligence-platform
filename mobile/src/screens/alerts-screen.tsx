import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { AlertCard } from '@/components/alert-card';
import { EmptyState, ErrorNotice, Loading, Screen, common } from '@/components/ui';
import { useMonitoring } from '@/providers/monitoring-provider';
import { formatDate, labels } from '@/features/resources';
import { colors, radii } from '@/theme';
import type { RiskType } from '@/types/api';

const filters: (RiskType | 'TODOS')[] = ['TODOS', 'ALAGAMENTO', 'ILHA_DE_CALOR', 'FALTA_DE_ENERGIA', 'FALTA_DE_AGUA'];

/** Alertas priorizados pelo backend (maior score primeiro), com filtro por tipo de risco. */
export function AlertsScreen() {
  const { alerts, status, connection, error, refreshing, refresh } = useMonitoring();
  const [filter, setFilter] = useState<RiskType | 'TODOS'>('TODOS');
  const visible = useMemo(() => filter === 'TODOS' ? alerts : alerts.filter(alert => alert.riskType === filter), [alerts, filter]);
  const firstLoad = !status && connection === 'checking';
  return <Screen testID="alerts-screen">
    <FlatList data={visible} keyExtractor={alert => String(alert.eventId)} contentContainerStyle={common.content}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={refreshing && !!status} onRefresh={refresh} tintColor={colors.accent} />}
      ListHeaderComponent={<View style={{ gap: 16 }}>
        <View style={{ ...common.card, gap: 8 }}>
          <Text style={common.eyebrow}>ALERTAS PRIORIZADOS</Text>
          <Text style={common.subtitle}>Ordenados pelo score de prioridade (0 a 100), que combina gravidade, confiança da origem, relatos de moradores na região e a atualidade das leituras dos sensores.</Text>
          {status && <Text selectable style={{ ...common.subtitle, fontSize: 12 }}>Atualizado em {formatDate(status.checkedAt)}{connection === 'offline' ? ' · sem conexão, exibindo os últimos dados' : ''}</Text>}
        </View>
        <View accessibilityRole="tablist" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {filters.map(value => <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: filter === value }} onPress={() => setFilter(value)}
            style={{ minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderRadius: radii.sm, borderWidth: 1,
              borderColor: filter === value ? colors.accent : colors.border, backgroundColor: filter === value ? colors.accentSoft : colors.surface }}>
            <Text style={{ color: filter === value ? colors.accent : colors.muted, fontWeight: '700', fontSize: 13 }}>{value === 'TODOS' ? 'Todos' : labels[value]}</Text>
          </Pressable>)}
        </View>
        {!!error && !status && <ErrorNotice message={error} onRetry={refresh} />}
      </View>}
      ListEmptyComponent={firstLoad ? <Loading label="Calculando prioridades…" /> : status ? <EmptyState title="Nenhum alerta ativo"
        description={filter === 'TODOS' ? 'Não há eventos de risco ativos no momento.' : 'Não há alertas ativos deste tipo.'} /> : undefined}
      renderItem={({ item }) => <AlertCard alert={item} rank={alerts.indexOf(item) + 1} />}
    />
  </Screen>;
}
