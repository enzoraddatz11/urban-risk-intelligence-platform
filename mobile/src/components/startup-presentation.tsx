import type { ReactNode } from 'react';

/** Android/iOS continuam usando a inicialização nativa do Expo, sem timers adicionais. */
export function StartupPresentation({ children }: { children: ReactNode }) {
  return children;
}
