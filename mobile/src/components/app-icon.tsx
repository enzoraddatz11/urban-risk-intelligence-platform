import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { View, type ColorValue } from 'react-native';

const symbols = {
  'planet-outline': ['globe.americas', 'public'],
  'grid-outline': ['square.grid.2x2', 'dashboard'],
  'radio-outline': ['antenna.radiowaves.left.and.right', 'sensors'],
  'hardware-chip-outline': ['cpu', 'memory'],
  'pulse-outline': ['waveform.path.ecg', 'show-chart'],
  'layers-outline': ['square.3.layers.3d', 'layers'],
  'terminal-outline': ['terminal', 'terminal'],
  'warning-outline': ['exclamationmark.triangle', 'warning-amber'],
  'refresh-outline': ['arrow.clockwise', 'refresh'],
  'arrow-forward': ['arrow.right', 'arrow-forward'],
  'arrow-back': ['arrow.left', 'arrow-back'],
  'add': ['plus', 'add'], 'close': ['xmark', 'close'],
  'chevron-down': ['chevron.down', 'expand-more'],
  'checkmark-circle': ['checkmark.circle.fill', 'check-circle'],
  'checkmark-circle-outline': ['checkmark.circle', 'check-circle-outline'],
  'alert-circle-outline': ['exclamationmark.circle', 'error-outline'],
  'time-outline': ['clock', 'schedule'],
  'cloud-upload-outline': ['square.and.arrow.up', 'cloud-upload'],
  'search-outline': ['magnifyingglass', 'search'],
  'shield-checkmark-outline': ['checkmark.shield', 'verified-user'],
} as const;
export type IconName = keyof typeof symbols;
export function AppIcon({ name, size = 22, color }: { name: IconName; size?: number; color?: ColorValue }) {
  const [sf, material] = symbols[name];
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    {process.env.EXPO_OS === 'ios'
      ? <SymbolView name={sf as ComponentProps<typeof SymbolView>['name']} tintColor={color as ComponentProps<typeof SymbolView>['tintColor']} size={size} />
      : <MaterialIcons name={material} color={color as ComponentProps<typeof MaterialIcons>['color']} size={size} />}
  </View>;
}
