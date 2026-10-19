import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

export const buttonVariants = cva(
  'inline-flex items-center justify-center font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer active:scale-[0.98] touch-target',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:opacity-92 hover:shadow-lg',
        secondary:
          'bg-muted text-foreground hover:bg-muted/80 border border-border shadow-xs',
        surface:
          'bg-card border border-border text-foreground shadow-xs hover:bg-muted',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-muted',
        ghost:
          'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted',
        subtle:
          'bg-accent text-accent-foreground hover:bg-accent/80 border border-border/50',
        danger:
          'bg-destructive text-destructive-foreground hover:opacity-90 shadow-xs',
        success:
          'bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs dark:bg-emerald-500 dark:hover:bg-emerald-400',
        floating:
          'bg-primary text-primary-foreground shadow-xl hover:scale-105 rounded-full p-3.5',
      },
      size: {
        sm: 'h-9 px-3.5 text-xs rounded-xl gap-1.5',
        md: 'h-11 px-4.5 text-xs sm:text-sm rounded-2xl gap-2',
        lg: 'h-12 px-6 text-sm sm:text-base rounded-2xl gap-2.5 font-extrabold',
        icon: 'h-10 w-10 rounded-xl p-0',
        floating: 'h-12 w-12 rounded-full p-0 flex items-center justify-center',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4 text-current shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
