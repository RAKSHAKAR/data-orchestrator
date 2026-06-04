import { createTheme } from '@mui/material/styles';

const sharedTypography = {
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  h4: { fontWeight: 800, letterSpacing: '-0.02em' },
  h5: { fontWeight: 700, letterSpacing: '-0.01em' },
  h6: { fontWeight: 700 },
  subtitle1: { fontWeight: 600 },
  subtitle2: { fontWeight: 600 },
  body1: { fontSize: '0.9375rem' },
  body2: { fontSize: '0.8125rem' },
  button: { fontWeight: 600, textTransform: 'none' as const },
  overline: { fontWeight: 700, letterSpacing: 1 },
};

const sharedComponents = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        textTransform: 'none' as const,
        fontWeight: 600,
        boxShadow: 'none',
        '&:hover': { boxShadow: 'none' },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: { borderRadius: 12 },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { fontWeight: 600, borderRadius: 6 },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        fontSize: '0.8125rem',
        padding: '12px 16px',
      },
      head: {
        fontWeight: 700,
        fontSize: '0.75rem',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
      },
    },
  },
};

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563eb', light: '#60a5fa', dark: '#1d4ed8' },
    secondary: { main: '#7c3aed' },
    success: { main: '#059669', light: '#d1fae5' },
    warning: { main: '#d97706', light: '#fef3c7' },
    error: { main: '#dc2626', light: '#fee2e2' },
    info: { main: '#0284c7', light: '#e0f2fe' },
    background: { default: '#f1f5f9', paper: '#ffffff' },
    divider: '#e2e8f0',
    text: { primary: '#0f172a', secondary: '#64748b' },
  },
  typography: sharedTypography,
  shape: { borderRadius: 8 },
  components: sharedComponents,
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#60a5fa', light: '#93c5fd', dark: '#3b82f6' },
    secondary: { main: '#a78bfa' },
    success: { main: '#34d399', light: '#064e3b' },
    warning: { main: '#fbbf24', light: '#78350f' },
    error: { main: '#f87171', light: '#7f1d1d' },
    info: { main: '#38bdf8', light: '#0c4a6e' },
    background: { default: '#0f172a', paper: '#1e293b' },
    divider: '#334155',
    text: { primary: '#f1f5f9', secondary: '#94a3b8' },
  },
  typography: sharedTypography,
  shape: { borderRadius: 8 },
  components: sharedComponents,
});
