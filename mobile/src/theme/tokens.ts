export { colors } from './colors';
export const spacing = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 40 };
export const radii = { sm: 10, md: 16, lg: 22, xl: 28 };
export const typography = {
  display: { fontSize: 36, lineHeight: 42, fontWeight: '700' as const, letterSpacing: -1.5 },
  title: { fontSize: 22, lineHeight: 29, fontWeight: '600' as const, letterSpacing: -0.6 },
  body: { fontSize: 15, lineHeight: 23 },
  caption: { fontSize: 13, lineHeight: 19 },
  label: { fontSize: 11, lineHeight: 16, fontWeight: '700' as const, letterSpacing: 1.6 },
};
export const shadows = { panel: '0 10px 28px rgba(0,0,0,0.14)' };
