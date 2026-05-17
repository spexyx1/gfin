export const colors = {
  background: '#000000',
  surface: '#111111',
  surfaceElevated: '#1a1a1a',
  border: '#2a2a2a',
  borderLight: '#333333',

  primary: '#FFFF00',
  primaryDim: '#cccc00',
  primaryMuted: 'rgba(255, 255, 0, 0.1)',

  accent: '#00ff88',
  accentDim: '#00cc6a',
  accentMuted: 'rgba(0, 255, 136, 0.1)',

  warning: '#ff8800',
  warningMuted: 'rgba(255, 136, 0, 0.1)',

  error: '#ff4444',
  errorMuted: 'rgba(255, 68, 68, 0.1)',

  success: '#00ff88',
  successMuted: 'rgba(0, 255, 136, 0.1)',

  text: '#ffffff',
  textSecondary: '#aaaaaa',
  textMuted: '#666666',
  textInverse: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const typography = {
  heading1: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  heading2: { fontSize: 22, fontWeight: '700' as const, color: colors.text },
  heading3: { fontSize: 18, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary },
  caption: { fontSize: 11, fontWeight: '400' as const, color: colors.textMuted },
  button: { fontSize: 15, fontWeight: '600' as const },
};
