import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { safeLocalStorage } from '@/utils/storage';

export interface RecentDoubtItem {
  id: string;
  question: string;
  replySnippet: string;
  subject: string;
  chapter: string;
  mode: string;
  timestamp: string;
}

export interface RecentFormulaItem {
  formula: string;
  title: string;
  subject: string;
  chapter: string;
}

export interface AIMemoryState {
  currentSubject: string;
  currentChapter: string;
  recentDoubts: RecentDoubtItem[];
  recentFormulas: RecentFormulaItem[];
  recentWeakTopics: string[];
}

export interface AIMemoryContextValue extends AIMemoryState {
  setCurrentSubject: (subject: string) => void;
  setCurrentChapter: (chapter: string) => void;
  addRecentDoubt: (doubt: Omit<RecentDoubtItem, 'id' | 'timestamp'>) => void;
  addRecentFormula: (formula: RecentFormulaItem) => void;
  addWeakTopic: (topic: string) => void;
  clearSessionMemory: () => void;
  activeDoubtToContinue: RecentDoubtItem | null;
  setActiveDoubtToContinue: (doubt: RecentDoubtItem | null) => void;
}

const STORAGE_KEY = 'rankify_ai_session_memory';

const defaultState: AIMemoryState = {
  currentSubject: 'Physics',
  currentChapter: 'Electric Charges and Fields',
  recentDoubts: [],
  recentFormulas: [
    {
      title: "Coulomb's Law",
      formula: "F = \\frac{1}{4\\pi\\epsilon_0}\\frac{q_1 q_2}{r^2}",
      subject: 'Physics',
      chapter: 'Electric Charges and Fields',
    },
    {
      title: "Lens Maker's Equation",
      formula: "\\frac{1}{f} = (n - 1)\\left(\\frac{1}{R_1} - \\frac{1}{R_2}\\right)",
      subject: 'Physics',
      chapter: 'Ray Optics and Optical Instruments',
    },
    {
      title: 'Nernst Equation',
      formula: "E = E^\\circ - \\frac{0.0591}{n}\\log Q",
      subject: 'Chemistry',
      chapter: 'Electrochemistry',
    },
  ],
  recentWeakTopics: ['Dielectric Breakdown', 'Integration by Partial Fractions', 'SN1 Racemization'],
};

export const AIMemoryContext = createContext<AIMemoryContextValue | null>(null);

export const AIMemoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [memory, setMemory] = useState<AIMemoryState>(() => {
    return safeLocalStorage.getItem<AIMemoryState>(STORAGE_KEY, defaultState);
  });
  const [activeDoubtToContinue, setActiveDoubtToContinue] = useState<RecentDoubtItem | null>(null);

  useEffect(() => {
    safeLocalStorage.setItem(STORAGE_KEY, memory);
  }, [memory]);

  const setCurrentSubject = useCallback((subject: string) => {
    setMemory((prev) => ({ ...prev, currentSubject: subject }));
  }, []);

  const setCurrentChapter = useCallback((chapter: string) => {
    setMemory((prev) => ({ ...prev, currentChapter: chapter }));
  }, []);

  const addRecentDoubt = useCallback((doubt: Omit<RecentDoubtItem, 'id' | 'timestamp'>) => {
    const newItem: RecentDoubtItem = {
      ...doubt,
      id: `doubt_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMemory((prev) => {
      // Keep unique by question snippet, max 8 recent doubts
      const filtered = prev.recentDoubts.filter(
        (d) => d.question.toLowerCase().trim() !== doubt.question.toLowerCase().trim()
      );
      return {
        ...prev,
        currentSubject: doubt.subject,
        currentChapter: doubt.chapter,
        recentDoubts: [newItem, ...filtered].slice(0, 8),
      };
    });
  }, []);

  const addRecentFormula = useCallback((formula: RecentFormulaItem) => {
    setMemory((prev) => {
      const exists = prev.recentFormulas.some((f) => f.title.toLowerCase() === formula.title.toLowerCase());
      if (exists) return prev;
      return {
        ...prev,
        recentFormulas: [formula, ...prev.recentFormulas].slice(0, 10),
      };
    });
  }, []);

  const addWeakTopic = useCallback((topic: string) => {
    if (!topic.trim()) return;
    setMemory((prev) => {
      const exists = prev.recentWeakTopics.includes(topic.trim());
      if (exists) return prev;
      return {
        ...prev,
        recentWeakTopics: [topic.trim(), ...prev.recentWeakTopics].slice(0, 8),
      };
    });
  }, []);

  const clearSessionMemory = useCallback(() => {
    setMemory({
      ...defaultState,
      recentDoubts: [],
    });
    safeLocalStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AIMemoryContext.Provider
      value={{
        ...memory,
        setCurrentSubject,
        setCurrentChapter,
        addRecentDoubt,
        addRecentFormula,
        addWeakTopic,
        clearSessionMemory,
        activeDoubtToContinue,
        setActiveDoubtToContinue,
      }}
    >
      {children}
    </AIMemoryContext.Provider>
  );
};

export function useAIMemory(): AIMemoryContextValue {
  const context = useContext(AIMemoryContext);
  if (!context) {
    throw new Error('useAIMemory must be used within an AIMemoryProvider');
  }
  return context;
}
