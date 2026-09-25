import React, { forwardRef } from 'react';
import { Search, X } from '@/icons';
import { cn } from '@/utils/cn';

export interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  shortcutBadge?: boolean;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, value, onChange, onClear, shortcutBadge = true, ...props }, ref) => {
    const hasValue = Boolean(value && String(value).length > 0);

    return (
      <div className={cn('relative flex items-center w-full', className)}>
        <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          placeholder="Search subjects, chapters, questions..."
          className="h-10 w-full rounded-xl bg-slate-100/90 dark:bg-slate-800/80 pl-10 pr-16 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:bg-white dark:focus:bg-slate-900 transition-all border border-transparent focus:border-purple-300 dark:focus:border-purple-700/50"
          {...props}
        />
        <div className="absolute right-3 flex items-center gap-1.5">
          {hasValue && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {shortcutBadge && !hasValue && (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground shadow-xs">
              <span className="text-xs">⌘</span>K
            </kbd>
          )}
        </div>
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';
