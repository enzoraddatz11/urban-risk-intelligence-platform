import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon, type IconName } from '@/components/app-icon';
import { useMonitoring } from '@/providers/monitoring-provider';
import { colors } from '@/theme';

const tabs: { name: string; title: string; icon: IconName; sf: string; md: string }[] = [
  { name: '(overview)', title: 'Painel', icon: 'grid-outline', sf: 'square.grid.2x2', md: 'dashboard' },
  { name: 'alerts', title: 'Alertas', icon: 'notifications', sf: 'bell.badge', md: 'notifications' },
  { name: 'occurrences', title: 'Ocorrências', icon: 'report', sf: 'exclamationmark.bubble', md: 'report' },
  { name: 'monitoring', title: 'Monitoramento', icon: 'radio-outline', sf: 'antenna.radiowaves.left.and.right', md: 'sensors' },
];
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { alerts } = useMonitoring();
  const urgent = alerts.filter(alert => alert.priority === 'CRITICA' || alert.priority === 'ALTA').length;
  if (process.env.EXPO_OS !== 'web') return <NativeTabs backgroundColor={colors.surface} tintColor={colors.accent} iconColor={colors.dim}
    labelStyle={{ color: colors.dim, fontSize: 11 }} disableTransparentOnScrollEdge>
    {tabs.map(tab => <NativeTabs.Trigger key={tab.name} name={tab.name}>
      <NativeTabs.Trigger.Icon sf={tab.sf as never} md={tab.md as never} /><NativeTabs.Trigger.Label>{tab.title}</NativeTabs.Trigger.Label>
      {tab.name === 'alerts' && urgent > 0 && <NativeTabs.Trigger.Badge>{String(urgent)}</NativeTabs.Trigger.Badge>}
    </NativeTabs.Trigger>)}
  </NativeTabs>;
  return <Tabs screenOptions={{
    headerShown: false, animation: 'none', tabBarActiveTintColor: colors.accent, tabBarInactiveTintColor: colors.dim,
    tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 76 + insets.bottom, paddingTop: 6, paddingBottom: 8 + insets.bottom },
    tabBarLabelStyle: { fontSize: 12, lineHeight: 16, fontWeight: '600' }, tabBarIconStyle: { height: 26 },
  }}>
    {tabs.map(tab => <Tabs.Screen key={tab.name} name={tab.name} options={{
      title: tab.title, tabBarIcon: ({ color }) => <AppIcon name={tab.icon} color={color} size={22} />,
      tabBarAccessibilityLabel: tab.name === 'alerts' && urgent ? tab.title + ', ' + urgent + ' prioritários' : tab.title,
      ...(tab.name === 'alerts' && urgent > 0 ? { tabBarBadge: urgent, tabBarBadgeStyle: { backgroundColor: colors.red, color: colors.white } } : {}),
    }} />)}
  </Tabs>;
}
