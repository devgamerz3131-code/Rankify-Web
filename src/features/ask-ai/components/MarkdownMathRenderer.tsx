import React, { useState } from 'react';
import {
  BookOpen,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  Copy,
  Check,
  Calculator,
  Compass,
  FileQuestion,
  HelpCircle,
} from 'lucide-react';

interface MarkdownMathRendererProps {
  content: string;
}

/**
 * Parses and formats math expressions ($...$, powers, subscripts, fractions, greek symbols)
 * into clean, readable typographic elements.
 */
function formatMathSnippet(text: string): React.ReactNode {
  // Replace simple LaTeX/math patterns with clean readable symbols
  const cleaned = text
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
    .replace(/\\cdot/g, '·')
    .replace(/\\times/g, '×')
    .replace(/\\approx/g, '≈')
    .replace(/\\pi/g, 'π')
    .replace(/\\epsilon_0/g, 'ε₀')
    .replace(/\\epsilon/g, 'ε')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\theta/g, 'θ')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\omega/g, 'ω')
    .replace(/\\mu_0/g, 'μ₀')
    .replace(/\\mu/g, 'μ')
    .replace(/\\vec\{([^}]+)\}/g, '$1⃗')
    .replace(/\\oint/g, '∮')
    .replace(/\\int/g, '∫')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/\^n/g, 'ⁿ')
    .replace(/\_0/g, '₀')
    .replace(/\_1/g, '₁')
    .replace(/\_2/g, '₂')
    .replace(/\_\{([^}]+)\}/g, ' ($1)');

  return cleaned;
}

export const MarkdownMathRenderer: React.FC<MarkdownMathRendererProps> = ({ content }) => {
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormula(text);
    setTimeout(() => setCopiedFormula(null), 2000);
  };

  // Split lines and group into structured sections
  const lines = content.split('\n');
  const sections: React.ReactNode[] = [];
  let currentParagraph: string[] = [];

  const flushParagraph = (index: number) => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join('\n');
      sections.push(
        <div key={`p_${index}`} className="text-sm leading-relaxed text-foreground/90 space-y-2">
          {text.split('\n').map((line, lIdx) => {
            if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
              return (
                <div key={lIdx} className="flex items-start gap-2 pl-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
                  <span>{renderInlineMarkdown(line.replace(/^[-*]\s*/, ''))}</span>
                </div>
              );
            }
            if (/^\d+\.\s/.test(line.trim())) {
              const numMatch = line.trim().match(/^(\d+)\.\s*(.*)$/);
              return (
                <div key={lIdx} className="flex items-start gap-2.5 pl-1 my-1">
                  <span className="flex items-center justify-center h-5 w-5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[11px] font-bold shrink-0 mt-0.5">
                    {numMatch ? numMatch[1] : '•'}
                  </span>
                  <span className="flex-1 font-normal">
                    {renderInlineMarkdown(numMatch ? numMatch[2] : line)}
                  </span>
                </div>
              );
            }
            return <p key={lIdx}>{renderInlineMarkdown(line)}</p>;
          })}
        </div>
      );
      currentParagraph = [];
    }
  };

  function renderInlineMarkdown(str: string): React.ReactNode {
    // Process bold, math $...$, and code `...`
    const parts = str.split(/(\*\*[^*]+\*\*|\$[^$]+\$|`[^`]+`)/g);

    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('$') && part.endsWith('$')) {
        const mathText = part.slice(1, -1);
        return (
          <code
            key={i}
            className="font-mono text-[13px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200/50 dark:border-purple-800/40 mx-0.5"
          >
            {formatMathSnippet(mathText)}
          </code>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 mx-0.5"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Major Section Headers
    if (line.includes('📌 Core Concept') || line.includes('📌 Concept')) {
      flushParagraph(i);
      sections.push(
        <div
          key={`concept_${i}`}
          className="rounded-2xl border border-blue-200/80 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-2 mt-3"
        >
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-sm">
            <BookOpen className="w-4 h-4" />
            <span>CBSE Core Concept & Definition</span>
          </div>
          <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
            {renderInlineMarkdown(line.replace(/#+\s*📌\s*(Core Concept|Concept)[^:]*:?/i, ''))}
          </div>
        </div>
      );
      continue;
    }

    if (line.includes('📐 Important Formula') || line.includes('📐 Key Formula')) {
      flushParagraph(i);
      const formulaLines: string[] = [];
      let j = i + 1;
      while (j < lines.length && !lines[j].startsWith('#') && !lines[j].startsWith('---')) {
        if (lines[j].trim()) formulaLines.push(lines[j]);
        j++;
      }
      i = j - 1;

      const formulaText = formulaLines.join('\n');
      sections.push(
        <div
          key={`formula_${i}`}
          className="rounded-2xl border border-purple-200/80 dark:border-purple-900/40 bg-purple-50/60 dark:bg-purple-950/25 p-4 space-y-2.5 mt-3 relative group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-sm">
              <Calculator className="w-4 h-4" />
              <span>Governing Formulae & SI Units</span>
            </div>
            <button
              onClick={() => handleCopy(formulaText)}
              className="text-xs flex items-center gap-1 text-purple-600 dark:text-purple-300 hover:text-purple-800 bg-white/80 dark:bg-slate-900/80 px-2 py-1 rounded-lg border border-purple-200 dark:border-purple-800/50 cursor-pointer transition-colors"
              title="Copy Formula"
            >
              {copiedFormula === formulaText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[11px] font-semibold text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold">Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="space-y-1.5 font-mono text-xs sm:text-sm text-foreground bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-purple-100 dark:border-white/5">
            {formulaLines.map((fl, flIdx) => (
              <div key={flIdx} className="leading-relaxed">
                {renderInlineMarkdown(fl)}
              </div>
            ))}
          </div>
        </div>
      );
      continue;
    }

    if (line.includes('⚠️ Common Mistakes') || line.includes('⚠️ Exam Traps')) {
      flushParagraph(i);
      sections.push(
        <div
          key={`mistake_${i}`}
          className="rounded-2xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-2 mt-3"
        >
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Common Board Exam Mistakes & Traps</span>
          </div>
          <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
            {renderInlineMarkdown(line.replace(/#+\s*⚠️\s*(Common Mistakes|Exam Traps)[^:]*:?/i, ''))}
          </div>
        </div>
      );
      continue;
    }

    if (line.includes('💡 CBSE Marking Scheme') || line.includes('💡 Exam Tip')) {
      flushParagraph(i);
      sections.push(
        <div
          key={`tip_${i}`}
          className="rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-2 mt-3"
        >
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
            <Lightbulb className="w-4 h-4" />
            <span>CBSE Marking Scheme & Step Marking Insights</span>
          </div>
          <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
            {renderInlineMarkdown(line.replace(/#+\s*💡\s*(CBSE Marking Scheme|Exam Tip)[^:]*:?/i, ''))}
          </div>
        </div>
      );
      continue;
    }

    if (line.includes('❓ Practice Question') || line.includes('❓ High-Yield')) {
      flushParagraph(i);
      sections.push(
        <div
          key={`practice_${i}`}
          className="rounded-2xl border border-indigo-200/80 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 space-y-2 mt-3"
        >
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
            <FileQuestion className="w-4 h-4" />
            <span>High-Yield Practice Question</span>
          </div>
          <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
            {renderInlineMarkdown(line.replace(/#+\s*❓\s*(Practice Question|High-Yield)[^:]*:?/i, ''))}
          </div>
        </div>
      );
      continue;
    }

    if (line.startsWith('### ') || line.startsWith('## ')) {
      flushParagraph(i);
      const headerText = line.replace(/^#+\s*/, '');
      sections.push(
        <h3
          key={`h_${i}`}
          className="text-base font-bold text-foreground tracking-tight pt-2 border-b border-slate-200/60 dark:border-white/10 pb-1"
        >
          {renderInlineMarkdown(headerText)}
        </h3>
      );
      continue;
    }

    if (line.trim() === '---') {
      flushParagraph(i);
      sections.push(<hr key={`hr_${i}`} className="border-slate-200 dark:border-white/10 my-2" />);
      continue;
    }

    currentParagraph.push(line);
  }

  flushParagraph(lines.length);

  return <div className="space-y-3 select-text">{sections}</div>;
};
