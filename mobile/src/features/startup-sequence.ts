export const STARTUP_DURATION_MS = 7000;
export const STARTUP_FADE_MS = 300;

/** Tempo da apresentação institucional; independente das requisições e da situação da cidade. */
export function getStartupFrame(elapsedMs: number) {
  const elapsed = Math.max(0, Math.min(STARTUP_DURATION_MS, elapsedMs));
  return {
    percent: Math.floor(elapsed / STARTUP_DURATION_MS * 100),
    message: elapsed < 2000 ? 'Carregando mapa da cidade...'
      : elapsed < 4000 ? 'Conectando sensores urbanos...'
      : elapsed < 6000 ? 'Analisando riscos por bairro...'
      : 'Plataforma pronta.',
  };
}
