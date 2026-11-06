import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

/** Acompanha também alterações da preferência enquanto o aplicativo está aberto. */
export function usePrefersReducedMotion() {
  const initial = useReducedMotion();
  const [reduced, setReduced] = useState(initial);
  useEffect(() => {
    let mounted = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', value => {
      changed = true;
      if (mounted) setReduced(value);
    });
    void AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (mounted && !changed) setReduced(value);
    }).catch(() => { /* Conserva o valor inicial do Reanimated se a consulta não estiver disponível. */ });
    return () => { mounted = false; subscription?.remove(); };
  }, []);
  return reduced;
}
