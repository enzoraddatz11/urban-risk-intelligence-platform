/** Intervalos da reconexão automática: espera crescente para não sobrecarregar a rede nem a bateria. */
export const RETRY_DELAYS_MS = [2000, 4000, 8000, 15000, 30000] as const;
/** Com a API acessível, o painel e os alertas são atualizados periodicamente. */
export const ONLINE_POLL_MS = 30000;
/** Tempo em que a confirmação "Conexão restabelecida" permanece visível. */
export const RECOVERED_NOTICE_MS = 4000;

export type ConnectionState = 'checking' | 'online' | 'offline';

export function retryDelay(attempt: number): number {
  const index = Math.max(0, Math.min(Math.floor(attempt), RETRY_DELAYS_MS.length - 1));
  return RETRY_DELAYS_MS[index];
}

/** Falha de rede (status 0) indica desconexão; respostas HTTP de erro mostram que o servidor está acessível. */
export function isNetworkFailure(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && (error as { status: unknown }).status === 0;
}

export function secondsUntil(timestamp: number | null, now = Date.now()): number | null {
  return timestamp === null ? null : Math.max(0, Math.ceil((timestamp - now) / 1000));
}
