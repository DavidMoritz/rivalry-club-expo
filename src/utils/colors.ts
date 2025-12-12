/**
 * Color palette for Rivalry Club
 * All colors used throughout the app
 */

export const colors = {
  // Tiers
  tierS: 'hsl(0, 100%, 75%)',
  tierA: 'hsl(30, 100%, 75%)',
  tierB: 'hsl(45, 100%, 75%)',
  tierC: 'hsl(60, 100%, 75%)',
  tierD: 'hsl(90, 100%, 75%)',
  tierE: 'hsl(120, 100%, 75%)',
  tierF: 'hsl(180, 100%, 75%)',
  tierU: 'hsl(180, 0%, 50%)',

  // Base colors
  white: 'white',
  black: 'black',

  // Purple shades
  purple900: '#6b21a8',
  purple600: '#8b5cf6',
  purple400: '#a78bfa',
  purple100: '#e9d5ff',

  // Blue shades
  blue500: '#3b82f6',
  blue400: '#60a5fa',
  cyan400: '#22d3ee',

  // Green shades
  green900: '#030',
  green600: '#10b981',
  green400: '#34d399',
  green300: '#4ade80',
  green100: '#d1fae5',

  // Red shades
  red600: '#ef4444',
  red500: '#dc2626',
  red400: '#f87171',
  red900: '#7f1d1d',
  red300: '#fca5a5',

  // Amber shades
  amber400: '#fbbf24',

  // Slate/Gray shades (darkest to lightest)
  slate950: '#0f172a',
  slate900: '#1e293b',
  slate800: '#1f2937',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#6b7280',
  slate400: '#94a3b8',
  slate300: '#cbd5e1',

  // Gray shades
  gray900: '#111',
  gray800: '#2d3748',
  gray750: '#333',
  gray700: '#374151',
  gray600: '#4a5568',
  gray500: '#666',
  gray400: '#999',
  gray300: '#9ca3af',
  gray200: '#a0aec0',
  gray50: '#f8f8f8',

  // Dark overlay variants (rgba)
  overlayDark: 'rgba(0, 0, 0, 0.9)',
  overlayMedium: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',

  // Special colors with specific use cases
  tierRowLight: 'rgb(31, 41, 55, 0.2)',
  tierRowDark: 'rgb(31, 41, 55, 0.4)',
  tierRowDarkAlpha: 'rgba(31, 41, 55, 0.5)',

  // Dark text shade (for text on light backgrounds)
  darkText: '#1f2937',
  darkText2: '#222'
} as const;
