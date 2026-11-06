import { useEffect, useId, useState } from 'react';
import { AppState, View } from 'react-native';
import Animated, { cubicBezier, type CSSAnimationKeyframes } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';

const floatKeyframes: CSSAnimationKeyframes = {
  from: { transform: [{ translateY: 0 }, { rotate: '-1deg' }] },
  to: { transform: [{ translateY: -7 }, { rotate: '1deg' }] },
};

/** Ilustração vetorial decorativa. Apenas o astronauta se move; a órbita permanece fixa. */
export function FloatingAstronaut({ size, playing = true }: { size: number; playing?: boolean }) {
  const reducedMotion = usePrefersReducedMotion();
  const [active, setActive] = useState(AppState.currentState === 'active');
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const suit = `suit-${id}`;
  const visor = `visor-${id}`;

  useEffect(() => {
    const appState = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => { appState.remove(); };
  }, []);

  return <View testID="astronaut-illustration" pointerEvents="none" accessible={false}
    accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={{ width: size, height: size * 1.12 }}>
    <Svg width="100%" height="100%" viewBox="0 0 300 336" style={{ position: 'absolute' }}>
      <Circle cx="150" cy="163" r="118" fill="#65F3D1" fillOpacity=".025" />
      <Circle cx="150" cy="163" r="98" fill="none" stroke="#65F3D1" strokeOpacity=".12" strokeDasharray="2 8" />
      <Ellipse cx="150" cy="175" rx="143" ry="65" fill="none" stroke="#65F3D1" strokeOpacity=".2" transform="rotate(-28 150 175)" />
      <Circle cx="278" cy="115" r="4" fill="#65F3D1" />
      <Circle cx="38" cy="78" r="2" fill="#7DA9FF" />
      <Circle cx="252" cy="257" r="2" fill="#65F3D1" fillOpacity=".6" />
      <Path d="M238 50v10m-5-5h10M34 252v8m-4-4h8" stroke="#65F3D1" strokeOpacity=".45" strokeLinecap="round" />
      <Ellipse cx="150" cy="310" rx="54" ry="5" fill="#65F3D1" fillOpacity=".06" />
    </Svg>
    <Animated.View testID="astronaut-float" style={{
      width: '100%', height: '100%',
      animationName: reducedMotion ? 'none' : floatKeyframes,
      animationDuration: '4s', animationDirection: 'alternate', animationIterationCount: 'infinite',
      animationTimingFunction: cubicBezier(0.77, 0, 0.175, 1),
      animationPlayState: playing && active ? 'running' : 'paused',
    }}>
      <Svg width="100%" height="100%" viewBox="0 0 300 336">
        <Defs>
          <LinearGradient id={suit} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#F2FAFF" /><Stop offset="1" stopColor="#8DAFC3" />
          </LinearGradient>
          <LinearGradient id={visor} x1="0" y1="0" x2=".9" y2="1">
            <Stop offset="0" stopColor="#234B65" /><Stop offset=".6" stopColor="#0B2034" /><Stop offset="1" stopColor="#0A4448" />
          </LinearGradient>
        </Defs>
        <Path d="M108 181C30 181 12 260 68 280c36 13 45-21 28-31" stroke="#65F3D1" strokeOpacity=".4" strokeWidth="3" fill="none" strokeLinecap="round" />
        <G transform="rotate(16 152 166)">
          <Rect x="103" y="124" width="91" height="96" rx="21" fill="#29475D" stroke="#527B8C" strokeWidth="2" />
          <Rect x="97" y="144" width="12" height="44" rx="5" fill="#5B8496" />
          {/* Pernas separadas desde o quadril, com joelhos flexionados e botas alinhadas aos tornozelos. */}
          <G strokeLinejoin="round" strokeLinecap="round">
            <Path d="M118 209c-8 9-10 22-10 34l-1 11c0 6 1 11 3 16l2 12 21-1-1-17c0-5 1-9 3-13l12-26c3-7-1-12-8-14z"
              fill={`url(#${suit})`} stroke="#6D91A5" strokeWidth="2" />
            <Path d="M111 245q12 7 24 1" fill="none" stroke="#527B90" strokeWidth="3" />
            <Path d="M113 253q8 4 16 0" fill="none" stroke="#F2FAFF" strokeOpacity=".55" strokeWidth="2" />
            <Path d="M110 273l22-1" stroke="#29495D" strokeWidth="7" />
            <Path d="M111 273l20-1" stroke="#65F3D1" strokeWidth="2" />
            <Path d="M111 278l21-1 1 15q0 7-8 7H93q-8 0-8-7c0-6 4-9 11-10l14-2z"
              fill={`url(#${suit})`} stroke="#6D91A5" strokeWidth="2" />
            <Path d="M89 294h39" stroke="#28485D" strokeWidth="5" />
            <Path d="M93 285h8l-1 7H89q0-5 4-7" fill="#35596D" />
          </G>
          <G strokeLinejoin="round" strokeLinecap="round">
            <Path d="M161 211l18-2c8 10 15 23 17 34 1 5-1 10-4 15l-9 20-21-5 8-21q3-5-1-11l-13-18c-4-6-2-10 5-12z"
              fill={`url(#${suit})`} stroke="#6D91A5" strokeWidth="2" />
            <Path d="M172 244q11 6 21 0" fill="none" stroke="#527B90" strokeWidth="3" />
            <Path d="M173 252l14 4" fill="none" stroke="#F2FAFF" strokeOpacity=".55" strokeWidth="2" />
            <Path d="M164 269l21 5" stroke="#29495D" strokeWidth="7" />
            <Path d="M165 269l19 5" stroke="#65F3D1" strokeWidth="2" />
            <Path d="M163 274l21 5 2 5 21 5q9 3 6 10-2 5-10 3l-35-8q-9-2-9-9z"
              fill={`url(#${suit})`} stroke="#6D91A5" strokeWidth="2" />
            <Path d="M164 289l43 10" stroke="#28485D" strokeWidth="5" />
            <Path d="M204 291q7 2 6 6l-8-2z" fill="#35596D" />
          </G>
          <Path d="M114 142c-14-6-24 5-31 16l-13 20-18-8c-12-5-20 11-10 18l24 16c8 4 16 1 20-4l32-32" fill={`url(#${suit})`} stroke="#6D91A5" strokeWidth="2" />
          <Path d="M187 141c10-4 20 2 24 12l12 25 18-14c10-7 21 7 12 16l-27 24c-7 6-16 4-20-4l-21-35" fill={`url(#${suit})`} stroke="#6D91A5" strokeWidth="2" />
          <Path d="M56 173l-10 16m190-21 13 16" stroke="#65F3D1" strokeWidth="5" />
          <Rect x="111" y="130" width="79" height="92" rx="28" fill={`url(#${suit})`} stroke="#789BAB" strokeWidth="2" />
          <Path d="M116 202h69" stroke="#29495D" strokeWidth="9" />
          <Rect x="127" y="157" width="46" height="29" rx="7" fill="#183449" stroke="#628C9E" />
          <Path d="M135 166h13m-13 6h8" stroke="#65F3D1" strokeWidth="2" strokeLinecap="round" />
          <Circle cx="162" cy="168" r="3" fill="#65F3D1" />
          <Circle cx="162" cy="178" r="2" fill="#7DA9FF" />
          <Path d="M180 171v21c0 6-4 10-12 10" fill="none" stroke="#537C90" strokeWidth="3" />
          <Rect x="130" y="122" width="43" height="16" rx="7" fill="#29495D" stroke="#8DB3C4" strokeWidth="2" />
          <Circle cx="151" cy="96" r="48" fill={`url(#${suit})`} stroke="#83A6B7" strokeWidth="2" />
          <Rect x="98" y="86" width="10" height="26" rx="4" fill="#54778B" />
          <Rect x="194" y="86" width="10" height="26" rx="4" fill="#54778B" />
          <Path d="M113 92c0-40 76-40 76 0v14c0 31-76 31-76 0z" fill={`url(#${visor})`} stroke="#345C70" strokeWidth="3" />
          <Path d="M124 87c4-13 19-19 35-17" fill="none" stroke="#BEE7F1" strokeOpacity=".65" strokeWidth="4" strokeLinecap="round" />
          <Path d="M126 115c14 9 32 9 47 1" fill="none" stroke="#65F3D1" strokeOpacity=".45" strokeWidth="2" strokeLinecap="round" />
          <Circle cx="179" cy="91" r="3" fill="#65F3D1" fillOpacity=".8" />
          <Path d="M143 139h16" stroke="#65F3D1" strokeWidth="3" strokeLinecap="round" />
        </G>
      </Svg>
    </Animated.View>
  </View>;
}
