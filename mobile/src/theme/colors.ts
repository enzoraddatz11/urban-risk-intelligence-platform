import { Color } from 'expo-router';
import { Platform } from 'react-native';

// A identidade é fixa em azul-marinho; os rótulos respeitam a semântica nativa.
export const colors = {
  background: '#050A12', surface: '#0B1523', raised: '#122237', border: '#213247',
  text: Platform.select({ ios: Color.ios.label, android: Color.android.material.onSurface, default: '#EDF4FF' })!,
  muted: Platform.select({ ios: Color.ios.secondaryLabel, android: Color.android.material.onSurfaceVariant, default: '#98ABC1' })!,
  cyan: '#65F3D1', blue: '#7DA9FF', orange: '#FFC180', red: '#FF7D91', green: '#65F3B7',
  white: '#FFFFFF', ink: '#061713', dim: '#61748D', cyanSoft: '#102D30', dangerSoft: '#291824',
};
