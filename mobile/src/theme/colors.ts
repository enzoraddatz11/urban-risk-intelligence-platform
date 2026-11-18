import { Color } from 'expo-router';
import { Platform } from 'react-native';

// Identidade urbana: grafite de asfalto com amarelo de sinalização/defesa civil.
// Os rótulos respeitam a semântica nativa; o contraste do texto sobre as superfícies fica acima de 4,5:1.
export const colors = {
  background: '#0F1216', surface: '#171B21', raised: '#20262E', border: '#2F3742',
  text: Platform.select({ ios: Color.ios.label, android: Color.android.material.onSurface, default: '#EEF2F6' })!,
  muted: Platform.select({ ios: Color.ios.secondaryLabel, android: Color.android.material.onSurfaceVariant, default: '#A9B3BF' })!,
  accent: '#F2B544', blue: '#6CB4FF', orange: '#FF9F4A', red: '#FF6B6B', green: '#5CD69A',
  white: '#FFFFFF', ink: '#1A1405', dim: '#8A95A3', accentSoft: '#2A2414', dangerSoft: '#2E1A1C', infoSoft: '#16263A',
};
