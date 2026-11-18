import { View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';
import { colors } from '@/theme';

const buildings: [number, number, number, number][] = [
  [18, 92, 34, 98], [56, 60, 30, 130], [90, 108, 38, 82], [132, 44, 34, 146], [170, 84, 40, 106], [214, 70, 28, 120], [246, 100, 36, 90],
];
const rain: [number, number][] = [[40, 22], [70, 36], [100, 14], [120, 40], [150, 18], [64, 8], [92, 46], [28, 48]];

/** Ilustração decorativa estática: chuva sobre parte da cidade, sol forte na outra e o rio na base. */
export function CityIllustration({ size }: { size: number }) {
  return <View testID="city-illustration" pointerEvents="none" accessible={false}
    accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size * 0.8 }}>
    <Svg width="100%" height="100%" viewBox="0 0 300 240">
      <Circle cx="150" cy="130" r="112" fill={colors.accent} fillOpacity=".04" />
      <Circle cx="236" cy="46" r="20" fill={colors.orange} fillOpacity=".9" />
      <Circle cx="236" cy="46" r="32" fill="none" stroke={colors.orange} strokeOpacity=".35" strokeDasharray="3 6" />
      <Path d="M20 44 q10 -22 32 -14 q10 -16 32 -6 q22 -4 26 16 q-2 12 -16 12 H30 q-14 0 -10 -8z" fill={colors.blue} fillOpacity=".55" />
      {rain.map(([x, y], index) => <Line key={index} x1={x} y1={y + 46} x2={x - 4} y2={y + 58} stroke={colors.blue} strokeWidth={2} strokeLinecap="round" strokeOpacity=".8" />)}
      <G>
        {buildings.map(([x, y, w, h], index) => <G key={index}>
          <Rect x={x} y={y} width={w} height={h} rx={3} fill={colors.raised} stroke={colors.border} />
          {Array.from({ length: Math.floor(h / 22) }, (_, row) => [0, 1].map(column =>
            <Rect key={row + '-' + column} x={x + 6 + column * (w / 2 - 2)} y={y + 10 + row * 22} width={w / 2 - 10} height={8} rx={1.5}
              fill={(index + row + column) % 3 === 0 ? colors.accent : colors.dim} fillOpacity={(index + row + column) % 3 === 0 ? 0.85 : 0.25} />))}
        </G>)}
      </G>
      <Path d="M0 196 H300 V240 H0z" fill={colors.surface} />
      <Path d="M0 206 q25 -8 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 V240 H0z" fill={colors.blue} fillOpacity=".35" />
      <Path d="M0 218 q25 -8 50 0 t50 0 t50 0 t50 0 t50 0 t50 0" fill="none" stroke={colors.blue} strokeOpacity=".7" strokeWidth={2} />
      <Circle cx="78" cy="150" r="13" fill={colors.background} stroke={colors.red} strokeWidth={2.5} />
      <Path d="M78 143 v8 M78 155 v1" stroke={colors.red} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  </View>;
}
