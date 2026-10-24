import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Sparkles, Compass } from 'lucide-react';
import { useTour } from './TourContext';
import {
  TOUR_UI_TEXT,
  TOPIC_TOUR_MENU_ITEMS,
  QUICK_TOUR_STEPS,
  FULL_TOUR_STEPS,
  TourPlacement,
} from './tourSteps';

const CARD_MARGIN = 12;
const SPOTLIGHT_PADDING = 8;
const TARGET_GAP = 14;

interface ComputedCardStyle {
  top?: number;
  left?: number;
  width: number;
  isCentered: boolean;
}

function computeCardPosition(
  targetRect: DOMRect | null,
  preferredPlacement: TourPlacement = 'auto',
  cardHeight: number
): ComputedCardStyle {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 360;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 640;
  const cardWidth = Math.min(360, vw - CARD_MARGIN * 2);

  if (!targetRect || preferredPlacement === 'center') {
    return {
      width: cardWidth,
      isCentered: true,
    };
  }

  const cutTop = Math.max(0, targetRect.top - SPOTLIGHT_PADDING);
  const cutBottom = Math.min(vh, targetRect.bottom + SPOTLIGHT_PADDING);
  const cutLeft = Math.max(0, targetRect.left - SPOTLIGHT_PADDING);
  const cutRight = Math.min(vw, targetRect.right + SPOTLIGHT_PADDING);

  const spaceBelow = vh - cutBottom - CARD_MARGIN;
  const spaceAbove = cutTop - CARD_MARGIN;
  const spaceRight = vw - cutRight - CARD_MARGIN;
  const spaceLeft = cutLeft - CARD_MARGIN;

  const estimatedHeight = Math.max(cardHeight || 220, 190);

  let top = cutBottom + TARGET_GAP;
  let left = targetRect.left + targetRect.width / 2 - cardWidth / 2;

  const tryBottom = () => {
    if (spaceBelow >= estimatedHeight) {
      top = cutBottom + TARGET_GAP;
      return true;
    }
    return false;
  };

  const tryTop = () => {
    if (spaceAbove >= estimatedHeight) {
      top = cutTop - estimatedHeight - TARGET_GAP;
      return true;
    }
    return false;
  };

  const tryRight = () => {
    if (spaceRight >= cardWidth + TARGET_GAP) {
      left = cutRight + TARGET_GAP;
      top = Math.max(
        CARD_MARGIN,
        Math.min(vh - estimatedHeight - CARD_MARGIN, targetRect.top)
      );
      return true;
    }
    return false;
  };

  const tryLeft = () => {
    if (spaceLeft >= cardWidth + TARGET_GAP) {
      left = cutLeft - cardWidth - TARGET_GAP;
      top = Math.max(
        CARD_MARGIN,
        Math.min(vh - estimatedHeight - CARD_MARGIN, targetRect.top)
      );
      return true;
    }
    return false;
  };

  let placed = false;
  if (preferredPlacement === 'bottom') {
    placed = tryBottom() || tryTop() || tryRight() || tryLeft();
  } else if (preferredPlacement === 'top') {
    placed = tryTop() || tryBottom() || tryRight() || tryLeft();
  } else if (preferredPlacement === 'right') {
    placed = tryRight() || tryLeft() || tryBottom() || tryTop();
  } else if (preferredPlacement === 'left') {
    placed = tryLeft() || tryRight() || tryBottom() || tryTop();
  } else {
    placed = tryBottom() || tryTop() || tryRight() || tryLeft();
  }

  if (!placed) {
    // Pick whichever vertical side has more room and clamp within viewport
    if (spaceBelow >= spaceAbove) {
      top = Math.min(vh - estimatedHeight - CARD_MARGIN, cutBottom + TARGET_GAP);
    } else {
      top = Math.max(CARD_MARGIN, cutTop - estimatedHeight - TARGET_GAP);
    }
  }

  // Clamp horizontally and vertically inside viewport with >= 12px margin
  left = Math.max(CARD_MARGIN, Math.min(vw - cardWidth - CARD_MARGIN, left));
  top = Math.max(CARD_MARGIN, Math.min(vh - estimatedHeight - CARD_MARGIN, top));

  return {
    top,
    left,
    width: cardWidth,
    isCentered: false,
  };
}

export const GuidedTourOverlay: React.FC = () => {
  const {
    isOpen,
    isTopicMenuOpen,
    activeTourId,
    currentStepIndex,
    totalSteps,
    currentStep,
    runtimeContext,
    targetRect,
    isWaitingForTarget,
    canSkipSection,
    selectTourFromMenu,
    openTopicMenu,
    nextStep,
    prevStep,
    skipTour,
    skipSection,
    finishTour,
  } = useTour();

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const primaryButtonRef = useRef<HTMLButtonElement | null>(null);
  const [cardHeight, setCardHeight] = useState(230);

  // Measure card height after render so placement avoids overlapping target
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    const rect = dialogRef.current.getBoundingClientRect();
    if (rect.height > 0 && Math.abs(rect.height - cardHeight) > 6) {
      setCardHeight(rect.height);
    }
  }, [isOpen, isTopicMenuOpen, currentStepIndex, targetRect, isWaitingForTarget, cardHeight]);

  // Focus primary action button when step or menu changes
  useEffect(() => {
    if (!isOpen || isWaitingForTarget) return;
    const timer = window.setTimeout(() => {
      primaryButtonRef.current?.focus();
    }, 30);
    return () => window.clearTimeout(timer);
  }, [isOpen, isTopicMenuOpen, currentStepIndex, isWaitingForTarget]);

  // Keyboard navigation: Escape closes/skips, Tab traps focus inside dialog
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (!isTopicMenuOpen && currentStep?.id === 'finish') {
          finishTour();
        } else {
          skipTour();
        }
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !dialogRef.current.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !dialogRef.current.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, isTopicMenuOpen, currentStep?.id, skipTour, finishTour]);

  if (!isOpen || (!isTopicMenuOpen && !currentStep)) return null;

  const vw = typeof window !== 'undefined' ? window.innerWidth : 360;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 640;

  const hasSpotlight = Boolean(!isTopicMenuOpen && targetRect && !isWaitingForTarget);
  const cutLeft = hasSpotlight && targetRect ? Math.max(0, targetRect.left - SPOTLIGHT_PADDING) : 0;
  const cutTop = hasSpotlight && targetRect ? Math.max(0, targetRect.top - SPOTLIGHT_PADDING) : 0;
  const cutRight =
    hasSpotlight && targetRect ? Math.min(vw, targetRect.right + SPOTLIGHT_PADDING) : 0;
  const cutBottom =
    hasSpotlight && targetRect ? Math.min(vh, targetRect.bottom + SPOTLIGHT_PADDING) : 0;
  const cutWidth = Math.max(0, cutRight - cutLeft);
  const cutHeight = Math.max(0, cutBottom - cutTop);

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const isQuickFinishStep = !isTopicMenuOpen && activeTourId === 'quick' && isLastStep;
  const isTopicOrFullLastStep = !isTopicMenuOpen && activeTourId !== 'quick' && isLastStep;

  const title = isTopicMenuOpen
    ? TOUR_UI_TEXT.topicMenuHeading
    : currentStep!.getTitle(runtimeContext);
  const description = isTopicMenuOpen
    ? TOUR_UI_TEXT.topicMenuSubheading
    : currentStep!.getDescription(runtimeContext);
  const sectionLabel = isTopicMenuOpen ? 'Tutorial Menu' : currentStep!.section;

  const cardPos = computeCardPosition(
    hasSpotlight ? targetRect : null,
    isTopicMenuOpen || isQuickFinishStep ? 'center' : currentStep?.placement || 'auto',
    cardHeight
  );

  let primaryLabel: string = TOUR_UI_TEXT.nextButton;
  if (isTopicMenuOpen || isLastStep) {
    primaryLabel = TOUR_UI_TEXT.doneButton;
  } else if (isFirstStep && activeTourId === 'quick') {
    primaryLabel = TOUR_UI_TEXT.startTourButton;
  }

  const renderTopicMenuList = () => (
    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 max-h-[42vh] overflow-y-auto pr-0.5">
      {!isQuickFinishStep && (
        <p className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
          {TOUR_UI_TEXT.topicMenuHeading}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => selectTourFromMenu('quick')}
          className="min-h-[44px] px-3 py-2 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/70 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-left text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center justify-between gap-2 transition-colors cursor-pointer"
        >
          <span>{TOUR_UI_TEXT.quickTourButtonLabel(QUICK_TOUR_STEPS.length)}</span>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        </button>
        <button
          type="button"
          onClick={() => selectTourFromMenu('full')}
          className="min-h-[44px] px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/70 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-left text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center justify-between gap-2 transition-colors cursor-pointer"
        >
          <span>{TOUR_UI_TEXT.fullTourButtonLabel(FULL_TOUR_STEPS.length)}</span>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
        {TOPIC_TOUR_MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => selectTourFromMenu(item.id)}
            className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 hover:border-purple-400 dark:hover:border-purple-500/60 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between gap-2 transition-colors cursor-pointer"
          >
            <span className="truncate">
              {TOUR_UI_TEXT.topicTourButtonLabel(item.label, item.stepCount)}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[120] select-none"
      data-testid="guided-tour-overlay"
      aria-hidden={false}
    >
      {/* Dimmed backdrop panels (blocks pointer clicks on underlying UI, never dismisses on outside click) */}
      {hasSpotlight ? (
        <>
          {/* Top dim panel */}
          <div
            className="fixed left-0 right-0 top-0 bg-slate-950/65 transition-all duration-200"
            style={{ height: cutTop }}
            onClick={(e) => e.stopPropagation()}
          />
          {/* Bottom dim panel */}
          <div
            className="fixed left-0 right-0 bottom-0 bg-slate-950/65 transition-all duration-200"
            style={{ top: cutBottom }}
            onClick={(e) => e.stopPropagation()}
          />
          {/* Left dim panel */}
          <div
            className="fixed left-0 bg-slate-950/65 transition-all duration-200"
            style={{ top: cutTop, height: cutHeight, width: cutLeft }}
            onClick={(e) => e.stopPropagation()}
          />
          {/* Right dim panel */}
          <div
            className="fixed right-0 bg-slate-950/65 transition-all duration-200"
            style={{ top: cutTop, height: cutHeight, left: cutRight }}
            onClick={(e) => e.stopPropagation()}
          />
          {/* Spotlight cutout border & interaction shield (prevents accidental clicks on app target during tour) */}
          <div
            className="fixed rounded-2xl ring-2 ring-purple-500 shadow-[0_0_0_4px_rgba(168,85,247,0.22)] transition-all duration-200 cursor-default"
            style={{
              top: cutTop,
              left: cutLeft,
              width: cutWidth,
              height: cutHeight,
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          />
        </>
      ) : (
        <div
          className="fixed inset-0 bg-slate-950/65 transition-opacity duration-200"
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Dialog Card (hidden briefly while waiting for target so it never flashes in the wrong spot) */}
      {!isWaitingForTarget && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={TOUR_UI_TEXT.dialogAriaLabel}
          aria-labelledby="rankify-tour-step-title"
          aria-describedby="rankify-tour-step-desc"
          className={`fixed z-[121] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-5 text-slate-900 dark:text-slate-100 transition-all duration-200 ${
            cardPos.isCentered
              ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
              : ''
          }`}
          style={{
            width: cardPos.width,
            maxWidth: 'calc(100vw - 24px)',
            maxHeight: 'calc(100vh - 24px)',
            ...(cardPos.isCentered ? {} : { top: cardPos.top, left: cardPos.left }),
          }}
        >
          {/* Top Bar: Section Label + Step Counter + Close (X) Button */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 text-xs font-bold tracking-wide truncate">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{sectionLabel}</span>
              </span>
              {!isTopicMenuOpen && (
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                  {TOUR_UI_TEXT.stepCounter(currentStepIndex + 1, totalSteps)}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={isLastStep && !isTopicMenuOpen ? finishTour : skipTour}
              aria-label={TOUR_UI_TEXT.closeAriaLabel}
              className="min-w-[44px] min-h-[44px] -mr-2 -my-1 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Live Region for Screen Readers */}
          <div aria-live="polite" className="space-y-1.5">
            <h2
              id="rankify-tour-step-title"
              className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white leading-snug"
            >
              {title}
            </h2>
            <p
              id="rankify-tour-step-desc"
              className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed"
            >
              {description}
            </p>
          </div>

          {/* Topic Menu list: shown in standalone Topic Menu mode OR on the Finish step of Quick tour */}
          {(isTopicMenuOpen || isQuickFinishStep) && renderTopicMenuList()}

          {/* Bottom Controls */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            {/* Left Side: Skip Tour & ("Skip section" ONLY inside the "full" tour) */}
            <div className="flex flex-wrap items-center gap-1">
              {!isTopicMenuOpen && !isLastStep && (
                <button
                  type="button"
                  onClick={skipTour}
                  className="min-h-[44px] min-w-[44px] px-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {TOUR_UI_TEXT.skipTourButton}
                </button>
              )}
              {canSkipSection && (
                <button
                  type="button"
                  onClick={skipSection}
                  className="min-h-[44px] min-w-[44px] px-2.5 rounded-xl text-xs font-bold text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer"
                >
                  {TOUR_UI_TEXT.skipSectionButton}
                </button>
              )}
            </div>

            {/* Right Side: Back + ("More topics" on topic/full tour end) + Next / Start / Done */}
            <div className="flex items-center gap-2 ml-auto">
              {!isTopicMenuOpen && !isFirstStep && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="min-h-[44px] min-w-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{TOUR_UI_TEXT.backButton}</span>
                </button>
              )}

              {isTopicOrFullLastStep && (
                <button
                  type="button"
                  onClick={openTopicMenu}
                  className="min-h-[44px] min-w-[44px] px-3 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/70 dark:bg-purple-950/40 text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>{TOUR_UI_TEXT.moreTopicsButton}</span>
                </button>
              )}

              <button
                ref={primaryButtonRef}
                type="button"
                onClick={
                  isTopicMenuOpen
                    ? skipTour
                    : isLastStep
                    ? finishTour
                    : nextStep
                }
                className="min-h-[44px] min-w-[44px] px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-sm flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>{primaryLabel}</span>
                {!isTopicMenuOpen && !isLastStep && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
