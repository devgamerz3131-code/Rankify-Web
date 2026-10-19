export const DESIGN_TOKENS = {
  colors: {
    primary: {
      light: '#6e2dd8', // M3 Purple Primary
      dark: '#ab83f7',
      subtle: 'hsl(var(--primary-subtle))',
      hover: 'hsl(var(--primary-hover))',
    },
    secondary: {
      light: '#1d63ed', // M3 Cobalt Blue
      dark: '#54a3f7',
      subtle: 'hsl(var(--secondary-subtle))',
      hover: '#1552cc',
    },
    surface: {
      light: '#ffffff',
      dark: '#191c24',
      subtleLight: '#f4f6fa',
      subtleDark: '#232732',
    },
    border: {
      light: '#d5dbf0',
      dark: '#313645',
    },
    success: {
      light: '#138644',
      dark: '#3cd070',
    },
    warning: {
      light: '#b85d00',
      dark: '#fbb028',
    },
    destructive: {
      light: '#d92534',
      dark: '#f85261',
    },
    info: {
      light: '#0774a8',
      dark: '#38bdf8',
    },
  },
  radius: {
    sm: 'rounded-lg',      // 8px
    md: 'rounded-xl',      // 12px
    lg: 'rounded-2xl',     // 16px - M3 default
    xl: 'rounded-3xl',     // 24px - M3 container
    full: 'rounded-full',
  },
  shadows: {
    none: 'shadow-none',
    elevation1: 'shadow-xs',
    elevation2: 'shadow-sm',
    elevation3: 'shadow-md',
    elevation4: 'shadow-lg',
    soft: 'shadow-[0_4px_16px_rgba(0,0,0,0.06)]',
    card: 'shadow-[0_2px_8px_rgba(0,0,0,0.05)]',
  },
} as const;
