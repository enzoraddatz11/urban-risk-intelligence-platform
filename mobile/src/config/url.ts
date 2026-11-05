export function resolveApiUrl(options: { override?: string; platform: string; hostUri?: string | null; webHostname?: string }): string {
  const override = options.override?.trim();
  if (override) {
    const url = new URL(override);
    if (!['http:', 'https:'].includes(url.protocol) || url.search || url.hash) {
      throw new Error('EXPO_PUBLIC_API_URL deve ser uma URL HTTP(S), sem query ou fragmento.');
    }
    return override.replace(/\/+$/, '');
  }
  let host = options.webHostname;
  if (!host && options.hostUri) {
    try { host = new URL('http://' + options.hostUri).hostname; } catch { /* utiliza fallback abaixo */ }
  }
  if (!host || ['localhost', '127.0.0.1', '0.0.0.0'].includes(host)) {
    host = options.platform === 'android' ? '10.0.2.2' : 'localhost';
  }
  return 'http://' + host + ':8080/api';
}
