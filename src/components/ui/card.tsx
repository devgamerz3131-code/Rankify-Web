import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

export const cardVariants = cva(
  'rounded-2xl border transition-all duration-200 text-card-foreground',
  {
    variants: {
      variant: {
        primary:
          'bg-card border-border shadow-xs',
        secondary:
          'bg-muted border-border shadow-xs',
        surface:
          'bg-card border-border shadow-sm',
        elevated:
          'bg-card border-border shadow-md',
        outline:
          'bg-transparent border-border',
      },
      padding: {
        none: 'p-0',
        compact: 'p-3.5 sm:p-4',
        normal: 'p-5 sm:p-6',
        large: 'p-6 sm:p-8',
      },
      interactive: {
        true: 'cursor-pointer hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-0.5 hover:border-purple-400/60 dark:hover:border-purple-500/40 active:scale-[0.99]',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      padding: 'normal',
      interactive: false,
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  glass?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, interactive, glass, ...props }, ref) => {
    const computedVariant = variant || (glass ? 'surface' : 'primary');

    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant: computedVariant, padding, interactive, className }))}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-base sm:text-lg font-bold leading-tight tracking-tight text-foreground', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-xs sm:text-sm text-muted-foreground leading-relaxed', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';
