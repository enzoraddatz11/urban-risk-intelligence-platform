import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { getStartupFrame, STARTUP_DURATION_MS } from '@/features/startup-sequence';
import { colors, spacing, typography } from '@/theme';

export function StartupProgress({ reducedMotion, onComplete }: { reducedMotion: boolean; onComplete: () => void }) {
  const [frame, setFrame] = useState(() => getStartupFrame(0));
  useEffect(() => {
    const started = performance.now();
    // Atualiza o texto em 10 Hz; a interpolação da barra ocorre no Reanimated.
    const interval = setInterval(() => setFrame(getStartupFrame(performance.now() - started)), 100);
    const completion = setTimeout(() => {
      clearInterval(interval);
      setFrame(getStartupFrame(STARTUP_DURATION_MS));
      onComplete();
    }, STARTUP_DURATION_MS);
    return () => { clearInterval(interval); clearTimeout(completion); };
  }, [onComplete]);

  return <View style={{ width: '100%', gap: spacing.sm }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
      <Text style={{ ...typography.label, fontSize: 9, color: colors.muted, flex: 1 }}>SEQUÊNCIA DE INICIALIZAÇÃO</Text>
      <Text testID="startup-percent" style={{ color: colors.cyan, fontSize: 16, lineHeight: 22, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{frame.percent}%</Text>
    </View>
    <View accessibilityRole="progressbar" accessibilityLabel="Progresso da sequência visual"
      accessibilityValue={{ min: 0, max: 100, now: frame.percent }}
      style={{ height: 4, borderRadius: 2, backgroundColor: '#18313E', overflow: 'hidden' }}>
      <Animated.View testID="startup-progress-fill" style={{ height: '100%', width: '100%', backgroundColor: colors.cyan,
        transformOrigin: 'left center', transform: [{ scaleX: frame.percent / 100 }],
        transitionProperty: 'transform', transitionDuration: reducedMotion ? '0ms' : '100ms', transitionTimingFunction: 'linear' }} />
    </View>
    <Text testID="startup-message" accessibilityLiveRegion="polite" style={{ ...typography.body, color: colors.text, textAlign: 'center' }}>{frame.message}</Text>
  </View>;
}
