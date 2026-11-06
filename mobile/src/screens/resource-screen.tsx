import { useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { router, useNavigation } from 'expo-router';
import { AppIcon } from '@/components/app-icon';
import { ResourceCard } from '@/components/resource-card';
import { Button, EmptyState, ErrorNotice, Loading, Screen, common } from '@/components/ui';
import { useResourceList } from '@/hooks/use-resource-list';
import { useRelatedRecords } from '@/hooks/use-related-records';
import { relatedRecord } from '@/features/related-records';
import { resources } from '@/features/resources';
import { colors, radii, spacing } from '@/theme';
import type { Resource } from '@/types/api';

export function ResourceScreen({ group, selected: resource, onSelect }: { group: Resource[]; selected: Resource; onSelect: (resource: Resource) => void }) {
  const navigation = useNavigation();
  const result = useResourceList(resource);
  const related = useRelatedRecords(resource);
  const refresh = () => { void result.reload(); void related.reload(); };
  const definition = resources[resource];
  const [query, setQuery] = useState('');
  useLayoutEffect(() => { navigation.setOptions({ title: definition.title }); setQuery(''); }, [navigation, definition.title]);
  const filtered = useMemo(() => {
    const value = query.trim().toLocaleLowerCase('pt-BR');
    return value ? result.items.filter(item => {
      const reference = relatedRecord(item, resource, related.items);
      return [...Object.values(item), reference?.name ?? '', reference && 'unit' in reference ? reference.unit : '']
        .some(field => String(field).toLocaleLowerCase('pt-BR').includes(value));
    }) : result.items;
  }, [result.items, query, resource, related.items]);
  return <Screen>
    <FlatList data={filtered} keyExtractor={item => resource + item.id} contentContainerStyle={common.content}
      contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={result.refreshing} onRefresh={refresh} tintColor={colors.cyan} />}
      ListHeaderComponent={<View style={{ gap: spacing.lg }}>
        <View style={{ flexDirection: 'row', gap: 5, padding: 5, backgroundColor: colors.surface, borderRadius: radii.md, borderCurve: 'continuous', borderWidth: 1, borderColor: colors.border }}>
          {group.map(key => <Pressable key={key} accessibilityRole="tab" accessibilityLabel={resources[key].title} accessibilityState={{ selected: key === resource }}
            onPress={() => onSelect(key)} style={{ flex: 1, minHeight: 46, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10, borderRadius: 11, backgroundColor: key === resource ? colors.raised : 'transparent' }}>
            <AppIcon name={resources[key].icon} size={18} color={key === resource ? colors.cyan : colors.muted} />
            <Text style={{ color: key === resource ? colors.cyan : colors.muted, fontSize: 13, fontWeight: '600' }}>{resources[key].title}</Text>
          </Pressable>)}
        </View>
        <View style={{ ...common.card, gap: 16 }}>
          <View style={common.row}><View style={common.iconBox}><AppIcon name={definition.icon} color={colors.cyan} /></View>
            <View style={{ flex: 1, gap: 4 }}><Text style={common.eyebrow}>{resource === 'events' || resource === 'alerts' ? 'REGISTRO OPERACIONAL' : 'INVENTÁRIO DA MISSÃO'}</Text><Text style={common.subtitle}>{definition.subtitle}</Text></View>
          </View>
          <View style={common.row}>
            <Button title={resource === 'readings' ? 'Nova leitura' : 'Novo ' + definition.singular} onPress={() => router.push({ pathname: '/create', params: { resource } })} icon="add" />
            <Button title="Atualizar" secondary icon="refresh-outline" onPress={refresh} disabled={result.loading || result.refreshing} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radii.sm, paddingHorizontal: 14 }}>
          <AppIcon name="search-outline" color={colors.muted} size={19} />
          <TextInput accessibilityLabel="Buscar registros" placeholder="Buscar nos registros carregados" placeholderTextColor={colors.dim} value={query} onChangeText={setQuery}
            style={{ minHeight: 50, flex: 1, color: colors.text, fontSize: 13 }} />
          {!!query && <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" onPress={() => setQuery('')} hitSlop={10} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><AppIcon name="close" color={colors.muted} size={18} /></Pressable>}
        </View>
        <View style={{ ...common.row, justifyContent: 'space-between' }}>
          <Text selectable style={{ ...common.subtitle, fontSize: 12 }}>{result.loading ? 'Consultando registros…' : query ? filtered.length + ' resultado(s) em ' + result.items.length + ' carregados' : result.total + ' registro(s)'}</Text>
          <Text style={{ color: colors.dim, fontSize: 10 }}>MAIS RECENTES PRIMEIRO</Text>
        </View>
        {!!result.error && <ErrorNotice message={result.error} onRetry={refresh} />}
        {related.loading && !result.loading && <Text style={common.subtitle}>Consultando componentes relacionados…</Text>}
        {!!related.error && <View style={{ ...common.card, gap: spacing.sm }}>
          <Text accessibilityRole="alert" selectable style={common.subtitle}>{related.error}</Text>
          <Button title="Atualizar referências" secondary icon="refresh-outline" onPress={() => { void related.reload(); }} />
        </View>}
      </View>}
      ListEmptyComponent={result.loading ? <Loading /> : result.error ? undefined : <EmptyState title={query ? 'Nenhum resultado encontrado' : undefined}
        description={query ? 'Tente outro termo, limpe a busca ou carregue mais registros.' : 'Cadastre o primeiro registro de ' + definition.title.toLocaleLowerCase('pt-BR') + ' usando o botão acima.'} />}
      renderItem={({ item }) => <ResourceCard item={item} resource={resource} related={related.items} />}
      ListFooterComponent={result.hasMore && !result.loading ? <Button title="Carregar mais" secondary busy={result.loadingMore} onPress={result.loadMore} /> : undefined}
    />
  </Screen>;
}
