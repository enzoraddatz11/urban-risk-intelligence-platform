import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { View, type ColorValue } from 'react-native';

// [SF Symbol (iOS), Material Icon (Android/Web)]
const symbols = {
  'person-outline': ['person.crop.circle', 'person-outline'],
  'city': ['building.2', 'location-city'],
  'grid-outline': ['square.grid.2x2', 'dashboard'],
  'notifications': ['bell.badge', 'notifications-active'],
  'radio-outline': ['antenna.radiowaves.left.and.right', 'sensors'],
  'pulse-outline': ['waveform.path.ecg', 'show-chart'],
  'map': ['map', 'map'],
  'groups': ['person.3', 'groups'],
  'report': ['exclamationmark.bubble', 'report'],
  'warning-outline': ['exclamationmark.triangle', 'warning-amber'],
  'water': ['drop', 'water-drop'],
  'heat': ['thermometer.sun', 'thermostat'],
  'power-off': ['bolt.slash', 'power-off'],
  'water-off': ['drop.triangle', 'format-color-reset'],
  'wifi-off': ['wifi.slash', 'wifi-off'],
  'wifi': ['wifi', 'wifi'],
  'privacy': ['lock.shield', 'privacy-tip'],
  'verified': ['checkmark.seal', 'verified'],
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
