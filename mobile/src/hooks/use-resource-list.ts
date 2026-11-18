import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { api } from '@/services/api';
import { useMonitoring } from '@/providers/monitoring-provider';
import type { UrbanEntity, Resource } from '@/types/api';

export function useResourceList(resource: Resource) {
  const { revision } = useMonitoring();
  const [items, setItems] = useState<UrbanEntity[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const generation = useRef(0);
  const page = useRef(0);
  const busyMore = useRef(false);

  const reload = useCallback(async (initial = false) => {
    const token = ++generation.current;
    busyMore.current = false;
    setLoadingMore(false);
    setError('');
    if (initial) { setLoading(true); setItems([]); setTotal(0); setHasMore(false); }
    else setRefreshing(true);
    try {
      const response = await api.list(resource);
      if (token !== generation.current) return;
      setItems(response.content); setTotal(response.totalElements);
      page.current = 0;
      setHasMore(response.page + 1 < response.totalPages);
    } catch (error) {
      if (token === generation.current) setError(error instanceof Error ? error.message : 'Falha na consulta.');
    } finally {
      if (token === generation.current) { setLoading(false); setRefreshing(false); }
    }
  }, [resource]);

  useFocusEffect(useCallback(() => {
    void reload(true);
    return () => { generation.current++; };
  }, [reload, revision]));

  const loadMore = async () => {
    if (!hasMore || busyMore.current || loading || refreshing) return;
    busyMore.current = true; setLoadingMore(true); setError('');
    const token = generation.current;
    try {
      const response = await api.list(resource, page.current + 1);
      if (token !== generation.current) return;
      setItems(previous => {
        const ids = new Set(previous.map(item => item.id));
        return [...previous, ...response.content.filter(item => !ids.has(item.id))];
      });
      page.current = response.page;
      setTotal(response.totalElements);
      setHasMore(response.page + 1 < response.totalPages);
    } catch (error) {
      if (token === generation.current) setError(error instanceof Error ? error.message : 'Falha ao carregar mais registros.');
    } finally {
      if (token === generation.current) { busyMore.current = false; setLoadingMore(false); }
    }
  };
  return { items, total, loading, refreshing, loadingMore, error, hasMore, reload, loadMore };
}

