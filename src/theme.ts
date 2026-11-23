import { createTheme, type PaletteMode, type Theme } from '@mui/material/styles';

export type MuiAccentKey = 'blue' | 'teal' | 'indigo' | 'orange';

export interface MuiAccentPreset {
  key: MuiAccentKey;
  label: string;
  swatch: string;
  light: {
    main: string;
    light: string;
    dark: string;
    contrastText: string;
  };
  dark: {
    main: string;
    light: string;
    dark: string;
    contrastText: string;
  };
}

export const MUI_ACCENT_PRESETS: readonly MuiAccentPreset[] = [
  {
    key: 'blue',
    label: 'MUI 蓝',
    swatch: '#1976D2',
    light: {
      main: '#1976D2',
      light: '#42A5F5',
      dark: '#1565C0',
      contrastText: '#FFFFFF',
    },
    dark: {
      main: '#42A5F5',
      light: '#90CAF9',
      dark: '#1E88E5',
      contrastText: '#0B1220',
    },
  },
  {
    key: 'teal',
    label: '翡翠青',
    swatch: '#0F766E',
    light: {
      main: '#0F766E',
      light: '#14B8A6',
      dark: '#115E59',
      contrastText: '#FFFFFF',
    },
    dark: {
      main: '#2DD4BF',
      light: '#5EEAD4',
      dark: '#14B8A6',
      contrastText: '#042F2E',
    },
  },
  {
    key: 'indigo',
    label: '靛青蓝',
    swatch: '#4F46E5',
    light: {
      main: '#4F46E5',
      light: '#818CF8',
      dark: '#4338CA',
      contrastText: '#FFFFFF',
    },
    dark: {
      main: '#818CF8',
      light: '#A5B4FC',
      dark: '#6366F1',
      contrastText: '#0F172A',
    },
  },
  {
    key: 'orange',
    label: '琥珀橙',
    swatch: '#C2410C',
    light: {
      main: '#C2410C',
      light: '#EA580C',
      dark: '#9A3412',
      contrastText: '#FFFFFF',
    },
    dark: {
      main: '#FB923C',
      light: '#FDBA74',
      dark: '#F97316',
      contrastText: '#1C1004',
    },
  },
] as const;

const muiDateThemeCache = new Map<string, Theme>();

/**
 * Creates (and caches) a full Material UI v7 Theme for Light or Dark mode with WCAG AA
 * verified primary, status, surface, divider, and typography tokens.
 */
export function createMuiDateTheme(
  mode: PaletteMode = 'light',
  accentKey: MuiAccentKey = 'blue',
): Theme {
  const cacheKey = `${mode}:${accentKey}`;
  const cached = muiDateThemeCache.get(cacheKey);
  if (cached) return cached;

  const preset =
    MUI_ACCENT_PRESETS.find((item) => item.key === accentKey) ??
    MUI_ACCENT_PRESETS[0];
  const isDark = mode === 'dark';
  const primaryPalette = isDark ? preset.dark : preset.light;

  const created = createTheme({
    palette: {
      mode,
      primary: primaryPalette,
      text: isDark
        ? {
            primary: 'rgba(255, 255, 255, 0.92)',
            secondary: 'rgba(255, 255, 255, 0.68)',
            disabled: 'rgba(255, 255, 255, 0.36)',
          }
        : {
            primary: 'rgba(0, 0, 0, 0.87)',
            secondary: 'rgba(0, 0, 0, 0.6)',
            disabled: 'rgba(0, 0, 0, 0.38)',
          },
      divider: isDark
        ? 'rgba(255, 255, 255, 0.12)'
        : 'rgba(224, 224, 224, 1)',
      background: isDark
        ? {
            default: '#12151A',
            paper: '#1A1F26',
          }
        : {
            default: '#FAFAFA',
            paper: '#FFFFFF',
          },
      action: isDark
        ? {
            hover: 'rgba(255, 255, 255, 0.08)',
            selected: 'rgba(255, 255, 255, 0.14)',
            disabledBackground: 'rgba(255, 255, 255, 0.06)',
            hoverOpacity: 0.08,
            selectedOpacity: 0.14,
          }
        : {
            hover: 'rgba(0, 0, 0, 0.04)',
            selected: 'rgba(25, 118, 210, 0.08)',
            disabledBackground: 'rgba(0, 0, 0, 0.04)',
            selectedOpacity: 0.08,
            hoverOpacity: 0.04,
          },
      success: {
        main: isDark ? '#66BB6A' : '#2E7D32',
      },
      warning: {
        main: isDark ? '#FFA726' : '#ED6C02',
      },
      error: {
        main: isDark ? '#EF5350' : '#D32F2F',
      },
    },
    typography: {
      fontFamily:
        "'Plus Jakarta Sans', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: 14,
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 6,
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            whiteSpace: 'nowrap',
            flexShrink: 0,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          outlined: ({ theme }) => ({
            borderColor: theme.palette.divider,
          }),
        },
      },
      MuiTablePagination: {
        styleOverrides: {
          root: ({ theme }) => ({
            fontSize: '0.875rem',
            color: theme.palette.text.primary,
          }),
          selectLabel: ({ theme }) => ({
            fontSize: '0.875rem',
            color: theme.palette.text.secondary,
          }),
          displayedRows: ({ theme }) => ({
            fontSize: '0.875rem',
            fontVariantNumeric: 'tabular-nums',
            color: theme.palette.text.primary,
          }),
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
            minHeight: 36,
          },
        },
      },
    },
  });

  muiDateThemeCache.set(cacheKey, created);
  return created;
}

/**
 * Official Material Design / MUI X DataGrid aligned default theme tokens.
 */
export const appTheme = createMuiDateTheme('light', 'blue');
