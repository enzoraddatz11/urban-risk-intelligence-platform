import { Stack } from 'expo-router/stack';
import { colors } from '@/theme';
export default function Layout() {
  return <Stack screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: '#EDF4FF', headerTitleStyle: { fontWeight: '600', fontSize: 20 }, headerShadowVisible: false, contentStyle: { backgroundColor: colors.background } }}><Stack.Screen name="index" options={{ title: 'Visão da missão' }} /></Stack>;
}
