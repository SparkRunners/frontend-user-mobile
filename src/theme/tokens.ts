export const colors = {
  brand: '#22C55E',
  brandMuted: '#D1FADF',
  warning: '#F97316',
  danger: '#EF4444',
  info: '#0EA5E9',
  infoMuted: '#E0F2FE',
  background: '#F5F7FA',
  card: '#FFFFFF',
  border: 'rgba(148, 163, 184, 0.2)',
  text: '#111827',
  textMuted: '#6B7280',
  iconDisabled: '#94A3B8',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radii = {
  pill: 999,
  control: 16,
  card: 24,
};

export const typography = {
  titleXL: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  titleL: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const },
  titleM: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
  bodyM: { fontSize: 16, lineHeight: 24, fontWeight: '500' as const },
  bodyS: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
  caption: { fontSize: 12, lineHeight: 18, fontWeight: '400' as const },
  numeric: { fontSize: 24, lineHeight: 32, fontWeight: '600' as const },
};

export const shadows = {
  soft: {
    shadowColor: 'rgba(15, 23, 42, 0.1)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12,
  },
};

export const buttons = {
  primary: {
    background: colors.brand,
    foreground: '#FFFFFF',
    borderColor: colors.brand,
  },
  secondary: {
    background: colors.card,
    foreground: colors.brand,
    borderColor: colors.brand,
  },
  danger: {
    background: colors.danger,
    foreground: '#FFFFFF',
    borderColor: colors.danger,
  },
};

export const tags = {
  filter: {
    default: { background: colors.background, foreground: colors.textMuted },
    active: { background: 'rgba(34, 197, 94, 0.12)', foreground: '#15803D' },
  },
};

export const badges = {
  info: { background: colors.infoMuted, foreground: colors.info },
  success: { background: colors.brandMuted, foreground: colors.brand },
  warning: { background: '#FEF3C7', foreground: colors.warning },
  danger: { background: '#FEE2E2', foreground: colors.danger },
};

export const mapTokens = {
  markerAvailable: {
    background: '#ECFDF5',
    border: colors.brand,
    icon: '#0F172A',
  },
  markerUnavailable: {
    background: '#F8FAFC',
    border: colors.iconDisabled,
    icon: colors.iconDisabled,
  },
};

export const theme = {
  colors,
  spacing,
  radii,
  typography,
  shadows,
  buttons,
  tags,
  badges,
  map: mapTokens,
};

export type SparkTheme = typeof theme;
