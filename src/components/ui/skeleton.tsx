import React from 'react';
import { cn } from '@/utils/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'rounded';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rounded',
  ...props
}) => {
  return (
    <div
      className={cn(
        'animate-pulse bg-slate-200/80 dark:bg-slate-800/80',
        variant === 'rounded' && 'rounded-xl',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-none',
        className
      )}
      {...props}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 space-y-4 bg-card">
    <Skeleton className="h-6 w-1/3" />
    <Skeleton className="h-4 w-3/4" />
    <div className="space-y-2 pt-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  </div>
);
