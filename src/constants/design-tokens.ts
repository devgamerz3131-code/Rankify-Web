export const DESIGN_TOKENS = {
  colors: {
    primary: {
      light: '#7c3aed', // Purple primary
      dark: '#8b5cf6',
      subtle: '#f5f3ff',
      hover: '#6d28d9',
    },
    secondary: {
      light: '#2563eb', // Blue secondary
      dark: '#3b82f6',
      subtle: '#eff6ff',
      hover: '#1d4ed8',
    },
    success: '#10b981',
    warning: '#f59e0b',
    destructive: '#ef4444',
  },
  radius: {
    sm: 'rounded-lg',      // 8px
    md: 'rounded-xl',      // 12px
    lg: 'rounded-2xl',     // 16px - Apple default
    xl: 'rounded-3xl',     // 24px - Apple cards
    full: 'rounded-full',
  },
  shadows: {
    soft: 'shadow-[0_4px_20px_-2px_rgba(124,58,237,0.06)]',
    card: 'shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)]',
    glass: 'shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]',
  },
} as const;
