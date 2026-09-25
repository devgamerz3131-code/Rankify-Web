import React, { useState } from 'react';
import { useNavigation } from '@/contexts/NavigationContext';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';
import { Dialog } from './dialog';
import { SearchBar } from './search-bar';
import { CBSE_SUBJECTS } from '@/constants/cbse';
import { NAV_ITEMS } from '@/constants/navigation';
import { ArrowRight, BookOpen, Target, Sparkles } from '@/icons';

export const SearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, setActiveTab, selectedClass } = useNavigation();
  const [query, setQuery] = useState('');

  // Register ⌘K and Ctrl+K global keyboard shortcuts
  useKeyboardShortcut('k', () => setIsSearchOpen(true), { metaOrCtrl: true });

  const filteredSubjects = CBSE_SUBJECTS.filter((s) =>
    s.classes.includes(selectedClass) &&
    (s.name.toLowerCase().includes(query.toLowerCase()) || s.code.includes(query))
  );

  return (
    <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen} className="max-w-xl p-4 sm:p-6">
      <div className="space-y-4">
        <SearchBar
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery('')}
          placeholder="Search subjects, chapters, questions..."
          autoFocus
        />

        <div className="space-y-3 pt-2">
          {/* Quick Nav Suggestions */}
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2">
              Quick Navigation
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsSearchOpen(false);
                    }}
                    className="flex items-center gap-2 p-2 rounded-xl border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left cursor-pointer"
                  >
                    <Icon className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span className="text-xs font-semibold text-foreground truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subjects Filtered */}
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2">
              Class {selectedClass} Subjects
            </span>
            <div className="space-y-1.5 mt-1.5 max-h-48 overflow-y-auto">
              {filteredSubjects.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => {
                    setActiveTab('study');
                    setIsSearchOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/40 transition cursor-pointer text-left border border-transparent hover:border-purple-200 dark:hover:border-purple-800/40"
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">{sub.name}</p>
                      <p className="text-[10px] text-muted-foreground">CBSE Code: {sub.code}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
