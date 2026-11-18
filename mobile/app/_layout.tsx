import { Stack } from 'expo-router/stack';
import { DarkTheme, ThemeProvider } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useReducedMotion } from 'react-native-reanimated';
import { colors } from '@/theme';
import { StartupPresentation } from '@/components/startup-presentation';
import { MonitoringProvider } from '@/providers/monitoring-provider';

export default function RootLayout() {
  const reduced = useReducedMotion();
  return <GestureHandlerRootView style={{ flex: 1 }}><KeyboardProvider>
    <ThemeProvider value={{ ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.background, card: colors.background, primary: colors.accent, border: colors.border, text: '#EEF2F6' } }}>
      <StatusBar style="light" />
      <MonitoringProvider>
        <StartupPresentation><Stack screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: '#EEF2F6', headerShadowVisible: false, contentStyle: { backgroundColor: colors.background }, animation: reduced ? 'fade' : 'default' }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="create" options={{ title: 'Novo registro', headerBackTitle: 'Voltar' }} />
        </Stack></StartupPresentation>
      </MonitoringProvider>
    </ThemeProvider>
  </KeyboardProvider></GestureHandlerRootView>;
}
