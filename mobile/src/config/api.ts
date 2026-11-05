import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { resolveApiUrl } from './url';

export const API_URL = resolveApiUrl({
  override: process.env.EXPO_PUBLIC_API_URL,
  platform: Platform.OS,
  hostUri: Constants.expoConfig?.hostUri,
  webHostname: Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.hostname : undefined,
});
