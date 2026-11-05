import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon, type IconName } from '@/components/app-icon';
import { colors } from '@/theme';

const tabs = [
  { name: '(overview)', title: 'Visão geral', icon: 'grid-outline', sf: 'square.grid.2x2', md: 'dashboard' },
  { name: 'telemetry', title: 'Telemetria', icon: 'pulse-outline', sf: 'waveform.path.ecg', md: 'monitoring' },
  { name: 'equipment', title: 'Estrutura', icon: 'hardware-chip-outline', sf: 'cpu', md: 'memory' },
  { name: 'operations', title: 'Operações', icon: 'planet-outline', sf: 'globe.americas', md: 'public' },
] as const;
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  if (process.env.EXPO_OS !== 'web') return <NativeTabs backgroundColor={colors.surface} tintColor={colors.cyan} iconColor={colors.dim}
    labelStyle={{ color: '#98ABC1', fontSize: 11 }} disableTransparentOnScrollEdge>
    {tabs.map(tab => <NativeTabs.Trigger key={tab.name} name={tab.name}>
      <NativeTabs.Trigger.Icon sf={tab.sf} md={tab.md} /><NativeTabs.Trigger.Label>{tab.title}</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>)}
  </NativeTabs>;
  return <Tabs screenOptions={{
    headerShown: false, animation: 'none', tabBarActiveTintColor: colors.cyan, tabBarInactiveTintColor: '#98ABC1',
    tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 76 + insets.bottom, paddingTop: 6, paddingBottom: 8 + insets.bottom },
    tabBarLabelStyle: { fontSize: 11, lineHeight: 16, fontWeight: '600' }, tabBarIconStyle: { height: 26 },
  }}>
    {tabs.map(tab => <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title, tabBarIcon: ({ color }) => <AppIcon name={tab.icon as IconName} color={color} size={22} /> }} />)}
  </Tabs>;
}
