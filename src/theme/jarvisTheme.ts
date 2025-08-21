import { extendTheme, ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
}

const fonts = {
  heading: 'system-ui, -apple-system, "SF Pro Display", Segoe UI, Roboto, sans-serif',
  body: 'system-ui, -apple-system, "SF Pro Display", Segoe UI, Roboto, sans-serif',
}

const colors = {
  // Palette monochrome premium
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  brand: {
    50: '#f6f6f7',
    100: '#e7e7ea',
    200: '#d2d3d8',
    300: '#b1b4bc',
    400: '#8d9097',
    500: '#1a1a1a', // noir premium
    600: '#141414',
    700: '#0f0f0f',
    800: '#0b0b0b',
    900: '#0a0a0a',
  },
  accent: {
    500: '#111827', // utiliser le gris foncé comme accent par défaut
  },
}

const radii = {
  xs: '2px',
  sm: '6px',
  md: '12px',
  lg: '20px',
  xl: '24px',
}

const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
  md: '0 4px 10px rgba(0, 0, 0, 0.06)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.08)',
}

const semanticTokens = {
  colors: {
    'bg.surface': { default: 'white' },
    'bg.subtle': { default: 'gray.50' },
    'bg.muted': { default: 'gray.100' },
    'text.default': { default: 'gray.800' },
    'text.muted': { default: 'gray.600' },
    'border.default': { default: 'gray.200' },
    'brand.primary': { default: 'brand.500' },
  },
}

const styles = {
  global: {
    'html, body': {
      background: 'var(--chakra-colors-bg-surface)',
      color: 'var(--chakra-colors-text-default)',
      fontFamily: fonts.body,
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
    },
    a: {
      color: 'gray.700',
      _hover: { color: 'gray.900', textDecoration: 'none' },
    },
  },
}

const components = {
  Button: {
    baseStyle: {
      borderRadius: 'md',
      fontWeight: 600,
    },
    variants: {
      primary: {
        bg: 'brand.500',
        color: 'white',
        _hover: { bg: 'brand.600' },
        _active: { bg: 'brand.700' },
      },
      secondary: {
        bg: 'white',
        color: 'gray.800',
        border: '1px solid',
        borderColor: 'border.default',
        _hover: { bg: 'bg.subtle' },
      },
      ghost: {
        color: 'gray.700',
        _hover: { bg: 'bg.subtle' },
      },
    },
    defaultProps: {
      variant: 'secondary',
      size: 'md',
    },
  },
  Input: {
    variants: {
      outline: {
        field: {
          bg: 'white',
          borderColor: 'border.default',
          _focus: {
            borderColor: 'gray.800',
            boxShadow: '0 0 0 1px var(--chakra-colors-gray-800)',
          },
        },
      },
    },
  },
  Badge: {
    baseStyle: { borderRadius: 'sm' },
  },
  Tabs: {
    variants: {
      softRounded: {
        tab: {
          _selected: { bg: 'white', border: '1px solid', borderColor: 'border.default', color: 'gray.900' },
        },
      },
    },
  },
  Breadcrumb: {
    baseStyle: {
      link: {
        color: 'gray.500',
        _hover: { color: 'gray.900' },
      },
    },
  },
  Divider: {
    baseStyle: { borderColor: 'border.default' },
  },
}

export const jarvisTheme = extendTheme({
  config,
  fonts,
  colors,
  radii,
  shadows,
  semanticTokens,
  styles,
  components,
})

export default jarvisTheme

