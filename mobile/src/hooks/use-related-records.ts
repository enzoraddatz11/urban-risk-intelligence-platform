import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { api } from '@/services/api';
import { useMonitoring } from '@/providers/monitoring-provider';
import { loadRelatedRecords, type RelatedIndex } from '@/features/related-records';
import type { Resource } from '@/types/api';

const empty: RelatedIndex = new Map();
export function useRelatedRecords(resource: Resource) {
  const { revision } = useMonitoring();
  const [state, setState] = useState({ resource, items: empty, loading: false, error: '' });
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const token = ++generation.current;
    setState({ resource, items: empty, loading: true, error: '' });
    try {
      const items = await loadRelatedRecords(resource, api);
      if (token === generation.current) setState({ resource, items, loading: false, error: '' });
    } catch {
      if (token === generation.current) setState({ resource, items: empty, loading: false,
        error: 'Não foi possível consultar os nomes relacionados. Os IDs continuam disponíveis.' });
    }
  }, [resource]);
  useFocusEffect(useCallback(() => {
    void reload();
    return () => { generation.current++; };
  }, [reload, revision]));
  return { ...(state.resource === resource ? state : { resource, items: empty, loading: true, error: '' }), reload };
}
