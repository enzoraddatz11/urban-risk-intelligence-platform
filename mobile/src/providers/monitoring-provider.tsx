import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import * as Haptics from 'expo-haptics';
import { api } from '@/services/api';
import { isNetworkFailure, ONLINE_POLL_MS, RECOVERED_NOTICE_MS, retryDelay, type ConnectionState } from '@/features/connection';
import { newNotifiableAlerts, notificationText } from '@/features/alerts';
import type { CityStatus, PrioritizedAlert } from '@/types/api';

type Notification = { title: string; body: string; eventIds: number[] };
type Monitoring = {
  connection: ConnectionState;
  /** Mostrado por alguns segundos após voltar a conexão. */
  recovered: boolean;
  /** Incrementa a cada reconexão: as telas usam para recarregar sozinhas. */
  revision: number;
  nextRetryAt: number | null;
  status: CityStatus | null;
  alerts: PrioritizedAlert[];
  error: string;
  refreshing: boolean;
  notification: Notification | null;
  refresh: () => void;
  dismissNotification: () => void;
};
const MonitoringContext = createContext<Monitoring | null>(null);

/**
 * Consulta /status e /alerts. Sem rede, agenda novas tentativas com espera crescente
 * (2 s até 30 s) sem bloquear a interface; os dados anteriores continuam visíveis.
 */
export function MonitoringProvider({ children }: { children: ReactNode }) {
  const [connection, setConnection] = useState<ConnectionState>('checking');
  const [recovered, setRecovered] = useState(false);
  const [revision, setRevision] = useState(0);
  const [nextRetryAt, setNextRetryAt] = useState<number | null>(null);
  const [status, setStatus] = useState<CityStatus | null>(null);
  const [alerts, setAlerts] = useState<PrioritizedAlert[]>([]);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recoveredTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attempts = useRef(0);
  const inFlight = useRef(false);
  const wasOffline = useRef(false);
  const notified = useRef(new Set<number>());
  const mounted = useRef(true);

  const check = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    if (timer.current) clearTimeout(timer.current);
    setRefreshing(true);
    let delay = ONLINE_POLL_MS;
    try {
      const [nextStatus, nextAlerts] = await Promise.all([api.status(), api.alerts()]);
      if (!mounted.current) return;
      setStatus(nextStatus); setAlerts(nextAlerts); setError(''); setConnection('online'); setNextRetryAt(null);
      attempts.current = 0;
      if (wasOffline.current) {
        wasOffline.current = false;
        setRevision(value => value + 1);
        setRecovered(true);
        if (recoveredTimer.current) clearTimeout(recoveredTimer.current);
        recoveredTimer.current = setTimeout(() => setRecovered(false), RECOVERED_NOTICE_MS);
      }
      const fresh = newNotifiableAlerts(nextAlerts, notified.current);
      const text = notificationText(fresh);
      if (text) {
        fresh.forEach(alert => notified.current.add(alert.eventId));
        setNotification({ ...text, eventIds: fresh.map(alert => alert.eventId) });
        if (process.env.EXPO_OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
    } catch (failure) {
      if (!mounted.current) return;
      setError(failure instanceof Error ? failure.message : 'Falha ao consultar a API.');
      if (isNetworkFailure(failure)) {
        wasOffline.current = true;
        setConnection('offline'); setRecovered(false);
        delay = retryDelay(attempts.current++);
      } else setConnection('online');
      setNextRetryAt(Date.now() + delay);
    } finally {
      inFlight.current = false;
      if (mounted.current) {
        setRefreshing(false);
        timer.current = setTimeout(() => { void check(); }, delay);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void check();
    // Ao voltar para o app, verifica imediatamente em vez de esperar o próximo ciclo.
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void check(); });
    return () => {
      mounted.current = false;
      subscription.remove();
      if (timer.current) clearTimeout(timer.current);
      if (recoveredTimer.current) clearTimeout(recoveredTimer.current);
    };
  }, [check]);

  const refresh = useCallback(() => { void check(); }, [check]);
  const dismissNotification = useCallback(() => setNotification(null), []);
  const value = useMemo(() => ({ connection, recovered, revision, nextRetryAt, status, alerts, error, refreshing, notification, refresh, dismissNotification }),
    [connection, recovered, revision, nextRetryAt, status, alerts, error, refreshing, notification, refresh, dismissNotification]);
  return <MonitoringContext.Provider value={value}>{children}</MonitoringContext.Provider>;
}

export function useMonitoring(): Monitoring {
  const value = useContext(MonitoringContext);
  if (!value) throw new Error('useMonitoring deve ser usado dentro de MonitoringProvider.');
  return value;
}
