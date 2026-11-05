import Svg, { Circle, Ellipse, Line, Path } from 'react-native-svg';
import { colors } from '@/theme';
export function MissionOrbit() {
  return <Svg width="100%" height="100%" viewBox="0 0 320 260">
    <Circle cx="160" cy="130" r="112" stroke={colors.cyan} strokeOpacity=".10" fill="none" strokeDasharray="2 7" />
    <Ellipse cx="160" cy="130" rx="142" ry="52" stroke={colors.cyan} strokeOpacity=".3" fill="none" transform="rotate(-28 160 130)" />
    <Circle cx="160" cy="130" r="72" fill="#0B2733" stroke={colors.cyan} strokeOpacity=".5" />
    <Ellipse cx="160" cy="130" rx="30" ry="72" stroke={colors.cyan} strokeOpacity=".22" fill="none" />
    <Ellipse cx="160" cy="130" rx="72" ry="26" stroke={colors.cyan} strokeOpacity=".22" fill="none" />
    <Path d="M94 100 Q160 133 226 100 M94 160 Q160 127 226 160" stroke={colors.cyan} strokeOpacity=".22" fill="none" />
    <Line x1="88" y1="130" x2="232" y2="130" stroke={colors.cyan} strokeOpacity=".22" />
    <Circle cx="274" cy="72" r="10" fill={colors.cyan} opacity=".08" /><Circle cx="274" cy="72" r="4" fill={colors.cyan} />
    <Path d="M14 130 H39 M281 130 H306 M160 5 V20 M160 240 V255" stroke={colors.cyan} strokeOpacity=".5" />
  </Svg>;
}
