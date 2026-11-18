import type { ApiErrorBody, CityStatus, EntityMap, Page, PrioritizedAlert, RequestMap, Resource } from '../types/api';

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly fields: Record<string, string> = {}) {
    super(message); this.name = 'ApiError';
  }
}

export type ApiFetch = (url: string, init?: RequestInit) => Promise<Response>;
export function createApiClient(baseUrl: string, fetcher: ApiFetch = fetch, timeoutMs = 12000) {
  async function request<T>(path: string, body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetcher(baseUrl.replace(/\/+$/, '') + path, {
        method: body === undefined ? 'GET' : 'POST',
        headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: controller.signal,
      });
      let data: unknown;
      try { data = await response.json(); }
      catch { throw new ApiError('A API retornou uma resposta que não é JSON.', response.status); }
      if (!response.ok) {
        const error = data as ApiErrorBody | null;
        throw new ApiError(error?.message ?? 'Não foi possível concluir a solicitação.', response.status, error?.errors ?? {});
      }
      return data as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(body === undefined
        ? 'Não foi possível acessar a API. Confira o endereço, a conexão e se o backend está ligado.'
        : 'Não foi possível confirmar o cadastro. Atualize a lista antes de tentar enviar novamente para evitar duplicação.', 0);
    } finally { clearTimeout(timer); }
  }
  return {
    readingsForSensor: (sensorId: number) =>
      request<Page<EntityMap['readings']>>('/readings?sensorId=' + sensorId + '&page=0&size=24'),
    status: () => request<CityStatus>('/status'),
    alerts: (regionId?: number) => request<PrioritizedAlert[]>('/alerts?limit=50' + (regionId ? '&regionId=' + regionId : '')),
    list: <K extends Resource>(resource: K, page = 0, size = 20) =>
      request<Page<EntityMap[K]>>('/' + resource + '?page=' + page + '&size=' + size),
    get: <K extends Resource>(resource: K, id: number) => request<EntityMap[K]>('/' + resource + '/' + id),
    create: <K extends Resource>(resource: K, body: RequestMap[K]) => request<EntityMap[K]>('/' + resource, body),
    async all<K extends Resource>(resource: K): Promise<EntityMap[K][]> {
      const result: EntityMap[K][] = [];
      let page = 0;
      while (true) {
        const response = await request<Page<EntityMap[K]>>('/' + resource + '?page=' + page + '&size=100');
        result.push(...response.content);
        if (++page >= response.totalPages) return result;
      }
    },
  };
}
export type ApiClient = ReturnType<typeof createApiClient>;

