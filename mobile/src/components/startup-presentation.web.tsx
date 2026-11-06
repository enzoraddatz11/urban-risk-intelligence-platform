import { useCallback, useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { cubicBezier } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { FloatingAstronaut } from '@/components/floating-astronaut';
import { MissionIdentity } from '@/components/mission-identity';
import { StartupProgress } from '@/components/startup-progress';
import { projectInfo } from '@/config/project-info';
import { STARTUP_FADE_MS } from '@/features/startup-sequence';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';
import { colors, spacing, typography } from '@/theme';

const stars = [[80, 130], [210, 310], [340, 85], [510, 170], [690, 90], [870, 250], [940, 110],
  [120, 680], [280, 810], [430, 920], [600, 790], [790, 860], [930, 660], [45, 450], [960, 440]];

/** Montado na raiz: reaparece em reload, nunca ao trocar abas. Não retém a montagem da API. */
export function StartupPresentation({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<'presenting' | 'leaving' | 'done'>('presenting');
  const visible = phase !== 'done';
  const reducedMotion = usePrefersReducedMotion();
  const content = useRef<ComponentRef<typeof View>>(null);
  const overlay = useRef<ComponentRef<typeof View>>(null);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const complete = useCallback(() => setPhase('leaving'), []);

  useEffect(() => {
    if (phase !== 'leaving') return;
    const timer = setTimeout(() => setPhase('done'), reducedMotion ? 0 : STARTUP_FADE_MS);
    return () => clearTimeout(timer);
  }, [phase, reducedMotion]);

  useEffect(() => {
    // inert impede foco e cliques na home coberta; aria-hidden também a oculta de leitores de tela.
    const element = content.current as unknown as HTMLElement | null;
    if (!element) return;
    const previous = element.inert;
    element.inert = visible;
    if (visible) overlay.current?.focus();
    else content.current?.focus();
    return () => { element.inert = previous; };
  }, [visible]);

  const astronautSize = Math.max(100, Math.min(width - 96, height * 0.28, 250));
  return <View style={{ flex: 1 }}>
    <View ref={content} tabIndex={-1} accessibilityElementsHidden={visible} pointerEvents={visible ? 'none' : 'auto'} style={{ flex: 1 }}>
      {children}
    </View>
    {visible && <Animated.View ref={overlay} testID="startup-splash" role="dialog" aria-modal accessibilityLabel="Apresentação de inicialização do Space Mission Control" tabIndex={-1}
      style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 100,
        backgroundColor: colors.background, opacity: phase === 'leaving' ? 0 : 1,
        transitionProperty: 'opacity', transitionDuration: reducedMotion ? '0ms' : `${STARTUP_FADE_MS}ms`,
        transitionTimingFunction: cubicBezier(0.23, 1, 0.32, 1) }}>
      <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
        <Svg width="100%" height="100%" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
          <Circle cx="500" cy="480" r="300" fill="#0B1C2B" fillOpacity=".5" />
          <Circle cx="500" cy="480" r="360" fill="none" stroke="#65F3D1" strokeOpacity=".06" />
          {stars.map(([cx, cy], index) => <Circle key={index} cx={cx} cy={cy} r={index % 3 === 0 ? 1.8 : 1} fill="#7DA9FF" fillOpacity={index % 3 === 0 ? 0.6 : 0.3} />)}
        </Svg>
      </View>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: spacing.lg, paddingTop: Math.max(insets.top, spacing.lg), paddingBottom: Math.max(insets.bottom, spacing.lg) }}>
        <View style={{ width: '100%', maxWidth: 420, alignItems: 'center', gap: spacing.md }}>
          <View style={{ alignItems: 'center', gap: spacing.sm, width: '100%' }}>
            <Text style={{ ...typography.label, color: colors.dim, fontSize: 9 }}>CENTRO DE OPERAÇÕES · FIAP</Text>
            <Text accessibilityRole="header" style={{ ...typography.display, fontSize: width < 400 ? 29 : 36, lineHeight: width < 400 ? 34 : 42,
              letterSpacing: -1, color: colors.text, textAlign: 'center' }}>{projectInfo.title}</Text>
            <View><MissionIdentity /></View>
          </View>
          <FloatingAstronaut size={astronautSize} />
          <StartupProgress reducedMotion={reducedMotion} onComplete={complete} />
        </View>
      </ScrollView>
    </Animated.View>}
  </View>;
}
