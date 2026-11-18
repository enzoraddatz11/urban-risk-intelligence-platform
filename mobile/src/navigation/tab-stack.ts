import { colors } from '@/theme';
/** Cabeçalho comum às pilhas de cada aba. */
export const tabStackOptions = {
  headerStyle: { backgroundColor: colors.background }, headerTintColor: '#EEF2F6',
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 20 }, headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background },
};
