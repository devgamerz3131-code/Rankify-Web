import { NavRoute } from '@/types/navigation';

export const CURRENT_TUTORIAL_VERSION = 1;

export type TourStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

export interface TutorialStateRecord {
  status: TourStatus;
  version: number;
  lastStepIndex: number;
  updatedAt: string;
  lastShownAt?: string;
}

export type TourUserVariant = 'new_user' | 'returning_user';

export type TopicTourId =
  | 'home'
  | 'study'
  | 'ncert'
  | 'aichat'
  | 'mistakes'
  | 'weakness'
  | 'profile'
  | 'appearance';

export type TourId = 'quick' | 'full' | TopicTourId;

export type TourSectionLabel =
  | 'Welcome'
  | 'Home'
  | 'Study'
  | 'NCERT Reader'
  | 'AI Chat'
  | 'Mistake Notebook'
  | 'Weakness Analyzer'
  | 'Profile'
  | 'Settings & Backup'
  | 'Appearance Lab'
  | 'Finish';

export type TourPlacement = 'auto' | 'top' | 'bottom' | 'left' | 'right' | 'center';

export type PointerVerb = 'tap' | 'click';

export interface TourRuntimeContext {
  variant: TourUserVariant;
  pointerVerb: PointerVerb;
  hasMistakes: boolean;
  hasTasksToday: boolean;
  completedAllTasksToday: boolean;
  hasVisibleStudyChapters: boolean;
  hasStudyProgress: boolean;
  hasNcertReadProgress: boolean;
  hasChatMessages: boolean;
  hasWeaknessData: boolean;
}

export interface TourViewStateRequest {
  screen: 'aiChat' | 'mistakes' | 'profile' | 'appearanceLab';
  tab?: string;
  subTab?: 'general' | 'backup';
}

export interface TourStepConfig {
  id: string;
  section: TourSectionLabel;
  route?: NavRoute;
  /**
   * Optional UI-only view state request (Phase 4 & 5).
   * Applied in memory via registered screen setters and restored when the tour exits.
   */
  viewState?: TourViewStateRequest;
  /**
   * CSS selector for the target element(s) using data-tour attributes.
   * Null/undefined means a centered modal card without a spotlight cutout.
   */
  targetSelector?: string | null;
  placement?: TourPlacement;
  /**
   * When true, if the target element is not rendered in the current user state,
   * the tour engine silently skips this step instead of showing a fallback card.
   */
  optional?: boolean;
  /**
   * When true, if the target element is missing because the user has no data yet,
   * the step renders as a centered card instead of skipping.
   */
  emptyStateFallbackToCenter?: boolean;
  getTitle: (ctx: TourRuntimeContext) => string;
  getDescription: (ctx: TourRuntimeContext) => string;
  /**
   * Plain-text template metadata used by dev helpers / audit scripts.
   */
  auditTextVariants: string[];
}

/**
 * Replaces `{tap}` / `{Tap}` / `{tapping}` / `{Tapping}` tokens with pointer-appropriate verbs:
 * - Touch (`pointer: coarse`): tap / Tap / tapping / Tapping
 * - Mouse (`pointer: fine`): click / Click / clicking / Clicking
 */
export function resolvePointerTokens(template: string, verb: PointerVerb): string {
  const isClick = verb === 'click';
  return template
    .replace(/\{Tapping\}/g, isClick ? 'Clicking' : 'Tapping')
    .replace(/\{tapping\}/g, isClick ? 'clicking' : 'tapping')
    .replace(/\{Tap\}/g, isClick ? 'Click' : 'Tap')
    .replace(/\{tap\}/g, isClick ? 'click' : 'tap');
}

/**
 * All UI button labels and aria labels come from this single config object.
 */
export const TOUR_UI_TEXT = {
  dialogAriaLabel: 'Guided app tutorial',
  skipTourButton: 'Skip tour',
  skipSectionButton: 'Skip section',
  closeAriaLabel: 'Close tutorial',
  backButton: 'Back',
  nextButton: 'Next',
  startTourButton: 'Start Tour',
  doneButton: 'Done',
  moreTopicsButton: 'More topics',
  stepCounter: (current: number, total: number) => `${current} of ${total}`,
  replaySettingTitle: 'App Tutorial',
  replaySettingDescription: 'Take a guided walkthrough of Rankify features anytime.',
  replayButtonLabel: 'Replay tutorial',
  settingsSectionLabel: 'App Tutorial',
  settingsSectionDescription: 'Take a guided walkthrough of Rankify features anytime.',
  settingsReplayButton: 'Replay tutorial',
  topicMenuHeading: 'Explore Topics',
  topicMenuSubheading: 'Choose a short tour or jump directly to any section:',
  quickTourButtonLabel: (count: number) => `Quick tour (${count} steps)`,
  fullTourButtonLabel: (count: number) => `Full tour (${count} steps)`,
  topicTourButtonLabel: (label: string, count: number) => `${label} - ${count} steps`,
} as const;

/**
 * Step IDs that require NcertLibraryView to display SmartReaderView in read-only demo mode.
 */
export const NCERT_READER_STEP_IDS = new Set<string>([
  'quick-ncert-reader',
  'ncert-header',
  'ncert-progress',
  'ncert-text',
  'ncert-ai-tabs',
  'ncert-finish-tip',
]);

// ============================================================================
// 1. QUICK TOUR (Default tour — 18 steps, max ~25 words per step)
// ============================================================================

const QUICK_WELCOME_NEW =
  'Take a short tour of the main parts of Rankify. You can skip it anytime.';
const QUICK_WELCOME_RETURNING =
  "It's been a while. Want a quick refresher on how Rankify works?";

const QUICK_NAV_TEXT =
  'Switch between Home, Study, NCERT Reader, AI Chat, and Profile here. On mobile, {tap} More for Mistake Notebook, Weakness Analyzer, and Settings & Backup.';

const QUICK_HOME_HERO_TEXT =
  "See your exam countdown, active streak, and recommended focus chapter. {Tap} Start Today's Study to jump straight into your next planned chapter.";

const QUICK_HOME_TASKS_TEXT =
  'Your daily tasks list priority and duration. {Tap} a circle to mark done, the play button for a timer, or Reset Tasks.';

const QUICK_HOME_PROGRESS_TEXT =
  'Track daily task completion, study time, questions practiced, and your Exam Readiness percentage across Physics, Chemistry, and Mathematics.';

const QUICK_STUDY_FILTERS_TEXT =
  'In Study, switch between All Subjects, Physics, Chemistry, and Mathematics, or filter chapters by All, In Progress, Completed, and High Priority.';

const QUICK_STUDY_CARD_TEXT =
  'Each chapter card shows progress, Needs Focus badges, Practice, Revision, and Mock Test checkboxes, star ratings, and an Open NCERT button.';

const QUICK_NCERT_CHAPTERS_TEXT =
  'Browse Physics, Chemistry, and Mathematics NCERT chapters, filter by subject or search keywords, and {tap} any chapter to open the reader.';

const QUICK_NCERT_READER_TEXT =
  'Read NCERT paragraphs, bookmark, highlight in four colors, add notes, listen aloud, or use the AI panel for explanations, formulas, and flashcards.';

const QUICK_AI_ASK_TEXT =
  'Type any Physics, Chemistry, or Mathematics question, pick a quick prompt, or attach a question photo or voice note for step-by-step help.';

const QUICK_AI_TOOLS_HISTORY_TEXT =
  'Generate notes, formulas, flashcards, quizzes, mind maps, or study plans from Study Tools, and reopen or search past chats in History.';

const QUICK_MISTAKES_VAULT_TEXT =
  'Review wrong answers from practice tests, filter by subject or mistake type, bookmark or mark revised, and launch a custom Re-Test quiz.';

const QUICK_MISTAKES_ANALYTICS_TEXT =
  'Check your Accuracy Rate, Top Mistake Type, Most Vulnerable Subject, and chapter breakdown to spot and fix recurring error patterns.';

const QUICK_WEAKNESS_OVERVIEW_TEXT =
  'See how many chapters are Strong, Moderate, or Weak, review priority focus insights, and track subject balance and weekly score trends.';

const QUICK_WEAKNESS_CHAPTER_TEXT =
  "Inspect each chapter's strength score and diagnosis, then {tap} Practice Weak Subtopics, Revise NCERT, or Ask AI Tutor to improve.";

const QUICK_PROFILE_OVERVIEW_TEXT =
  'View your target score, completed chapters, daily routine, Study Reports, and Cloud State. {Tap} Sync Now anytime to back up changes.';

const QUICK_SETTINGS_OVERVIEW_TEXT =
  'Switch themes, manage study reminders, save or restore cloud and file backups, or {tap} Replay tutorial anytime from Settings & Backup.';

const QUICK_FINISH_TEXT =
  "You're ready to study with Rankify. Pick any topic below to explore in detail, or {tap} Done to return.";

export const QUICK_TOUR_STEPS: TourStepConfig[] = [
  // 1. Welcome
  {
    id: 'welcome',
    section: 'Welcome',
    route: 'home',
    targetSelector: null,
    placement: 'center',
    getTitle: (ctx) =>
      ctx.variant === 'returning_user' ? 'Welcome Back to Rankify' : 'Welcome to Rankify',
    getDescription: (ctx) =>
      resolvePointerTokens(
        ctx.variant === 'returning_user' ? QUICK_WELCOME_RETURNING : QUICK_WELCOME_NEW,
        ctx.pointerVerb
      ),
    auditTextVariants: [QUICK_WELCOME_NEW, QUICK_WELCOME_RETURNING],
  },
  // 2. Main navigation bar
  {
    id: 'quick-main-nav',
    section: 'Home',
    route: 'home',
    targetSelector: '[data-tour="main-nav"]',
    placement: 'auto',
    getTitle: () => 'Main Navigation',
    getDescription: (ctx) => resolvePointerTokens(QUICK_NAV_TEXT, ctx.pointerVerb),
    auditTextVariants: [QUICK_NAV_TEXT],
  },
  // 3. Home hero card & Start Today's Study
  {
    id: 'quick-home-hero',
    section: 'Home',
    route: 'home',
    targetSelector: '[data-tour="home-hero"]',
    placement: 'bottom',
    getTitle: () => 'Daily Focus & Start',
    getDescription: (ctx) => resolvePointerTokens(QUICK_HOME_HERO_TEXT, ctx.pointerVerb),
    auditTextVariants: [QUICK_HOME_HERO_TEXT],
  },
  // 4. Today's Study Plan card
  {
    id: 'quick-home-tasks',
    section: 'Home',
    route: 'home',
    targetSelector: '[data-tour="home-tasks"]',
    placement: 'top',
    getTitle: () => "Today's Study Plan",
    getDescription: (ctx) => resolvePointerTokens(QUICK_HOME_TASKS_TEXT, ctx.pointerVerb),
    auditTextVariants: [QUICK_HOME_TASKS_TEXT],
  },
  // 5. Today's Progress & Exam Readiness
  {
    id: 'quick-home-progress',
    section: 'Home',
    route: 'home',
    targetSelector: '[data-tour="home-progress"]',
    placement: 'top',
    getTitle: () => 'Progress & Exam Readiness',
    getDescription: (ctx) => resolvePointerTokens(QUICK_HOME_PROGRESS_TEXT, ctx.pointerVerb),
    auditTextVariants: [QUICK_HOME_PROGRESS_TEXT],
  },
  // 6. Study screen: subject tabs and chapter filters
  {
    id: 'quick-study-filters',
    section: 'Study',
    route: 'study',
    targetSelector: '[data-tour="study-filters"]',
    placement: 'bottom',
    getTitle: () => 'Subject & Status Filters',
    getDescription: (ctx) => resolvePointerTokens(QUICK_STUDY_FILTERS_TEXT, ctx.pointerVerb),
    auditTextVariants: [QUICK_STUDY_FILTERS_TEXT],
  },
  // 7. Chapter card
  {
    id: 'quick-study-card',
    section: 'Study',
    route: 'study',
    targetSelector: '[data-tour="study-card"]',
    placement: 'top',
    emptyStateFallbackToCenter: true,
    getTitle: () => 'Chapter Cards',
    getDescription: (ctx) => resolvePointerTokens(QUICK_STUDY_CARD_TEXT, ctx.pointerVerb),
    auditTextVariants: [QUICK_STUDY_CARD_TEXT],
  },
  // 8. NCERT library chapter list
  {
    id: 'quick-ncert-chapters',
    section: 'NCERT Reader',
    route: 'ncert',
    targetSelector: '[data-tour="ncert-chapters"]',
    placement: 'top',
    getTitle: () => 'NCERT Library',
    getDescription: (ctx) => resolvePointerTokens(QUICK_NCERT_CHAPTERS_TEXT, ctx.pointerVerb),
    auditTextVariants: [QUICK_NCERT_CHAPTERS_TEXT],
  },
  // 9. Reader view (text, tools, AI panel)
  {
    id: 'quick-ncert-reader',
    section: 'NCERT Reader',
    route: 'ncert',
    targetSelector: '[data-tour="ncert-text"]',
    placement: 'top',
    getTitle: () => 'NCERT Reader & AI Panel',
    getDescription: (ctx) => resolvePointerTokens(QUICK_NCERT_READER_TEXT, ctx.pointerVerb),
    auditTextVariants: [QUICK_NCERT_READER_TEXT],
  },
  // 10. AI Chat: ask box, quick prompts, image/voice
  {
    id: 'quick-ai-ask',
    section: 'AI Chat',
    route: 'ai',
    viewState: { screen: 'aiChat', tab: 'chat' },
    targetSelector: '[data-tour="ai-input"]',
    placement: 'top',
    getTitle: () => 'Ask AI Chat',
    getDescription: (ctx) => resolvePointerTokens(QUICK_AI_ASK_TEXT, ctx.pointerVerb),
    auditTextVariants: [QUICK_AI_ASK_TEXT],
  },
  // 11. AI Chat: Tools and History
  {
    id: 'quick-ai-tools-history',
    section: 'AI Chat',
    route: 'ai',
    viewState: { screen: 'aiChat', tab: 'chat' },
    targetSelector: '[data-tour="ai-tools-panel"], [data-tour="ai-header"]',
    placement: 'bottom',
    getTitle: () => 'Study Tools & History',
    getDescription: (ctx) => resolvePointerTokens(QUICK_AI_TOOLS_HISTORY_TEXT, ctx.pointerVerb),
    auditTextVariants: [QUICK_AI_TOOLS_HISTORY_TEXT],
  },
  // 12. Mistake Notebook: saved mistakes and Re-Test
  {
    id: 'quick-mistakes-vault',
    section: 'Mistake Notebook',
    route: 'mistakes',
    viewState: { screen: 'mistakes', tab: 'list' },
    targetSelector: '[data-tour="mistakes-card"], [data-tour="mistakes-filters"]',
    placement: 'top',
    emptyStateFallbackToCenter: true,
    getTitle: () => 'Mistake Notebook & Re-Test',
    getDescription: (ctx) => resolvePointerTokens(QUICK_MISTAKES_VAULT_TEXT, ctx.pointerVerb),
    auditTextVariants: [QUICK_MISTAKES_VAULT_TEXT],
  },
  // 13. Mistake Notebook: Analytics tab
  {
    id: 'quick-mistakes-analytics',
    section: 'Mistake Notebook',
    route: 'mistakes',
    viewState: { screen: 'mistakes', tab: 'analytics' },
    targetSelector: '[data-tour="mistakes-analytics"]',
    placement: 'top',
    emptyStateFallbackToCenter: true,
    getTitle: () => 'Mistake Analytics',
    getDescription: (ctx) => resolvePointerTokens(QUICK_MISTAKES_ANALYTICS_TEXT, ctx.pointerVerb),
    auditTextVariants: [QUICK_MISTAKES_ANALYTICS_TEXT],
  },
  // 14. Weakness Analyzer: weak/moderate/strong chapters and focus queue
  {
    id: 'quick-weakness-overview',
    section: 'Weakness Analyzer',
    route: 'weakness',
    targetSelector: '[data-tour="weakness-summary"]',
    placement: 'bottom',
    emptyStateFallbackToCenter: true,
    getTitle: () => 'Weakness Analyzer Overview',
    getDescription: (ctx) => resolvePointerTokens(QUICK_WEAKNESS_OVERVIEW_TEXT, ctx.pointerVerb),
    auditTextVariants: [QUICK_WEAKNESS_OVERVIEW_TEXT],
  },
  // 15. Weakness Analyzer: chapter diagnosis and actions
  {
    id: 'quick-weakness-chapter',
    section: 'Weakness Analyzer',
    route: 'weakness',
    targetSelector: '[data-tour="weakness-chapter-card"]',
    placement: 'top',
    emptyStateFallbackToCenter: true,
    getTitle: () => 'Chapter Diagnosis & Actions',
    getDescription: (ctx) => resolvePointerTokens(QUICK_WEAKNESS_CHAPTER_TEXT, ctx.pointerVerb),
    auditTextVariants: [QUICK_WEAKNESS_CHAPTER_TEXT],
  },
  // 16. Profile: Academic Profile, Study Reports and Cloud State
  {
    id: 'quick-profile-overview',
    section: 'Profile',
    route: 'profile',
    viewState: { screen: 'profile', tab: 'overview' },
    targetSelector: '[data-tour="profile-stats"]',
    placement: 'bottom',
    getTitle: () => 'Profile, Reports & Cloud Sync',
    getDescription: (ctx) => resolvePointerTokens(QUICK_PROFILE_OVERVIEW_TEXT, ctx.pointerVerb),
    auditTextVariants: [QUICK_PROFILE_OVERVIEW_TEXT],
  },
  // 17. Settings & Backup: theme, notifications, backups and Replay tutorial
  {
    id: 'quick-settings-overview',
    section: 'Settings & Backup',
    route: 'profile',
    viewState: { screen: 'profile', tab: 'settings', subTab: 'general' },
    targetSelector: '[data-tour="settings-backup"]',
    placement: 'top',
    getTitle: () => 'Settings, Backups & Tutorial',
    getDescription: (ctx) => resolvePointerTokens(QUICK_SETTINGS_OVERVIEW_TEXT, ctx.pointerVerb),
    auditTextVariants: [QUICK_SETTINGS_OVERVIEW_TEXT],
  },
  // 18. Finish card with Topic Menu
  {
    id: 'finish',
    section: 'Finish',
    targetSelector: null,
    placement: 'center',
    getTitle: () => "You're All Set",
    getDescription: (ctx) => resolvePointerTokens(QUICK_FINISH_TEXT, ctx.pointerVerb),
    auditTextVariants: [QUICK_FINISH_TEXT],
  },
];

// ============================================================================
// 2. TOPIC TOURS (Max ~40 words per step, preserving all verified facts)
// ============================================================================

// --- HOME TOPIC TOUR (6 steps) ---
const HOME_NAV_STREAK_TEXT =
  'Use the sidebar on desktop or bottom bar and More sheet on mobile to open every screen. The top bar shows your active daily study streak—complete at least one study activity each day to keep it growing.';
const HOME_HERO_DEFAULT_TEXT =
  "This hero card tracks days left until your target exam, syllabus progress, and a Half-Yearly Prep shortcut. {Tap} Start Today's Study to open the Study screen focused on your recommended chapter.";
const HOME_HERO_DONE_TEXT =
  "You have completed all of today's tasks! This hero card tracks days left until your exam and includes a Half-Yearly Prep shortcut. {Tap} Start Today's Study anytime to review chapters.";
const HOME_TASKS_TEXT =
  "Each daily task shows its chapter, priority badge, and target minutes. {Tap} the circle to mark it done, the play button to start a study timer, or Reset Tasks to clear today's completion marks without confirmation.";
const HOME_PROGRESS_TEXT =
  "The progress ring shows how many of today's planned tasks are finished, alongside study minutes logged, questions practiced, and your overall Exam Readiness score across Physics, Chemistry, and Mathematics.";
const HOME_QUICK_ACTIONS_TEXT =
  'Jump directly to NCERT Reader, AI Chat, Mistake Notebook, Weakness Analyzer, or Practice Tests. Below, check your subject-by-subject readiness bars for Physics, Chemistry, and Mathematics.';
const HOME_EXAM_COMMAND_TEXT =
  'Review your target board exam countdown, syllabus completion pace, and daily routine metrics so you can adjust study hours as exam dates approach.';

export const HOME_TOPIC_STEPS: TourStepConfig[] = [
  {
    id: 'home-nav-streak',
    section: 'Home',
    route: 'home',
    targetSelector: '[data-tour="main-nav"]',
    placement: 'auto',
    getTitle: () => 'Navigation & Daily Streak',
    getDescription: (ctx) => resolvePointerTokens(HOME_NAV_STREAK_TEXT, ctx.pointerVerb),
    auditTextVariants: [HOME_NAV_STREAK_TEXT],
  },
  {
    id: 'home-hero',
    section: 'Home',
    route: 'home',
    targetSelector: '[data-tour="home-hero"]',
    placement: 'bottom',
    getTitle: () => 'Exam Countdown & Start Study',
    getDescription: (ctx) =>
      resolvePointerTokens(
        ctx.completedAllTasksToday ? HOME_HERO_DONE_TEXT : HOME_HERO_DEFAULT_TEXT,
        ctx.pointerVerb
      ),
    auditTextVariants: [HOME_HERO_DEFAULT_TEXT, HOME_HERO_DONE_TEXT],
  },
  {
    id: 'home-tasks',
    section: 'Home',
    route: 'home',
    targetSelector: '[data-tour="home-tasks"]',
    placement: 'top',
    getTitle: () => "Today's Study Plan",
    getDescription: (ctx) => resolvePointerTokens(HOME_TASKS_TEXT, ctx.pointerVerb),
    auditTextVariants: [HOME_TASKS_TEXT],
  },
  {
    id: 'home-progress',
    section: 'Home',
    route: 'home',
    targetSelector: '[data-tour="home-progress"]',
    placement: 'top',
    getTitle: () => "Today's Progress & Readiness",
    getDescription: (ctx) => resolvePointerTokens(HOME_PROGRESS_TEXT, ctx.pointerVerb),
    auditTextVariants: [HOME_PROGRESS_TEXT],
  },
  {
    id: 'home-quick-actions',
    section: 'Home',
    route: 'home',
    targetSelector: '[data-tour="home-quick-actions"]',
    placement: 'top',
    getTitle: () => 'Quick Actions & Subject Breakdown',
    getDescription: (ctx) => resolvePointerTokens(HOME_QUICK_ACTIONS_TEXT, ctx.pointerVerb),
    auditTextVariants: [HOME_QUICK_ACTIONS_TEXT],
  },
  {
    id: 'home-exam-status',
    section: 'Home',
    route: 'home',
    targetSelector: '[data-tour="home-exam-status"]',
    placement: 'top',
    optional: true,
    getTitle: () => 'Exam Status & Command Center',
    getDescription: (ctx) => resolvePointerTokens(HOME_EXAM_COMMAND_TEXT, ctx.pointerVerb),
    auditTextVariants: [HOME_EXAM_COMMAND_TEXT],
  },
];

// --- STUDY TOPIC TOUR (4 steps) ---
const STUDY_INTRO_TEXT =
  'The Study screen organizes all 32 CBSE Class 12 Physics, Chemistry, and Mathematics chapters in one place so you can track completion and plan daily revision.';
const STUDY_FILTERS_TEXT =
  'Switch between All Subjects, Physics, Chemistry, and Mathematics, or filter chapters by All, In Progress, Completed, and High Priority to narrow down what to study next.';
const STUDY_CARD_WITH_DATA_TEXT =
  'Each chapter card displays its subject, chapter number, completion percentage, completed task count, and a Needs Focus badge on chapters marked high priority or below 30% progress.';
const STUDY_CARD_EMPTY_TEXT =
  'No chapters match your current filter. When visible, each card displays its subject, completion percentage, task count, and a Needs Focus badge for high-priority or low-progress chapters.';
const STUDY_PROGRESS_TEXT =
  'Check off Practice, Revision, and Mock Test to update chapter progress by 33%, 66%, or 100%. Use the five stars to record your self-rating, or {tap} Open NCERT to read the chapter.';

export const STUDY_TOPIC_STEPS: TourStepConfig[] = [
  {
    id: 'study-intro',
    section: 'Study',
    route: 'study',
    targetSelector: '[data-tour="study-intro"]',
    placement: 'bottom',
    getTitle: () => 'Syllabus Tracker Overview',
    getDescription: (ctx) => resolvePointerTokens(STUDY_INTRO_TEXT, ctx.pointerVerb),
    auditTextVariants: [STUDY_INTRO_TEXT],
  },
  {
    id: 'study-filters',
    section: 'Study',
    route: 'study',
    targetSelector: '[data-tour="study-filters"]',
    placement: 'bottom',
    getTitle: () => 'Subject Tabs & Status Filters',
    getDescription: (ctx) => resolvePointerTokens(STUDY_FILTERS_TEXT, ctx.pointerVerb),
    auditTextVariants: [STUDY_FILTERS_TEXT],
  },
  {
    id: 'study-card',
    section: 'Study',
    route: 'study',
    targetSelector: '[data-tour="study-card"]',
    placement: 'top',
    emptyStateFallbackToCenter: true,
    getTitle: () => 'Chapter Card, Stats & Focus Badge',
    getDescription: (ctx) =>
      resolvePointerTokens(
        ctx.hasVisibleStudyChapters ? STUDY_CARD_WITH_DATA_TEXT : STUDY_CARD_EMPTY_TEXT,
        ctx.pointerVerb
      ),
    auditTextVariants: [STUDY_CARD_WITH_DATA_TEXT, STUDY_CARD_EMPTY_TEXT],
  },
  {
    id: 'study-progress',
    section: 'Study',
    route: 'study',
    targetSelector: '[data-tour="study-progress"]',
    placement: 'top',
    emptyStateFallbackToCenter: true,
    getTitle: () => 'Tasks, Star Rating & Open NCERT',
    getDescription: (ctx) => resolvePointerTokens(STUDY_PROGRESS_TEXT, ctx.pointerVerb),
    auditTextVariants: [STUDY_PROGRESS_TEXT],
  },
];

// --- NCERT TOPIC TOUR (6 steps) ---
const NCERT_CHAPTERS_TEXT =
  'Filter chapters by All, Physics, Chemistry, or Mathematics, or search by keyword across chapter topics. {Tap} any chapter card to open the interactive reader, or {tap} Quick Revise for key formulas.';
const NCERT_HEADER_TEXT =
  'Use the back arrow to return to the chapter list, switch topics within the chapter, or {tap} Revision Mode to review formulas, reactions, and summary points in one view.';
const NCERT_PROGRESS_TEXT =
  'Track how many paragraphs you have read in this chapter, or {tap} Mark Completed when you finish studying the topic to update your NCERT reading progress.';
const NCERT_TEXT_TOOLS_TEXT =
  'Read NCERT paragraphs with highlighted key terms and callout boxes. On any paragraph, {tap} Bookmark, highlight in Yellow, Green, Pink, or Blue, {tap} Note to save a personal note, or Listen for audio.';
const NCERT_AI_TABS_TEXT =
  'Beside the text, switch between Explain, Notes, Formulas, Questions, and Flashcards. Select a paragraph and {tap} Generate Explanation to get a simple breakdown, board exam tips, and a quick concept check.';
const NCERT_FINISH_TIP_TEXT =
  'When you generate an explanation or flashcards for a paragraph, the results stay available in this panel while you read so you can compare NCERT lines with step-by-step notes.';

export const NCERT_TOPIC_STEPS: TourStepConfig[] = [
  {
    id: 'ncert-chapters',
    section: 'NCERT Reader',
    route: 'ncert',
    targetSelector: '[data-tour="ncert-chapters"]',
    placement: 'top',
    getTitle: () => 'NCERT Library & Search',
    getDescription: (ctx) => resolvePointerTokens(NCERT_CHAPTERS_TEXT, ctx.pointerVerb),
    auditTextVariants: [NCERT_CHAPTERS_TEXT],
  },
  {
    id: 'ncert-header',
    section: 'NCERT Reader',
    route: 'ncert',
    targetSelector: '[data-tour="ncert-header"]',
    placement: 'bottom',
    getTitle: () => 'Reader Navigation & Revision',
    getDescription: (ctx) => resolvePointerTokens(NCERT_HEADER_TEXT, ctx.pointerVerb),
    auditTextVariants: [NCERT_HEADER_TEXT],
  },
  {
    id: 'ncert-progress',
    section: 'NCERT Reader',
    route: 'ncert',
    targetSelector: '[data-tour="ncert-progress"]',
    placement: 'bottom',
    getTitle: () => 'Reading Progress & Mark Completed',
    getDescription: (ctx) => resolvePointerTokens(NCERT_PROGRESS_TEXT, ctx.pointerVerb),
    auditTextVariants: [NCERT_PROGRESS_TEXT],
  },
  {
    id: 'ncert-text',
    section: 'NCERT Reader',
    route: 'ncert',
    targetSelector: '[data-tour="ncert-text"]',
    placement: 'top',
    getTitle: () => 'Paragraphs & Study Tools',
    getDescription: (ctx) => resolvePointerTokens(NCERT_TEXT_TOOLS_TEXT, ctx.pointerVerb),
    auditTextVariants: [NCERT_TEXT_TOOLS_TEXT],
  },
  {
    id: 'ncert-ai-tabs',
    section: 'NCERT Reader',
    route: 'ncert',
    targetSelector: '[data-tour="ncert-ai-tabs"]',
    placement: 'left',
    getTitle: () => 'AI Companion Panel',
    getDescription: (ctx) => resolvePointerTokens(NCERT_AI_TABS_TEXT, ctx.pointerVerb),
    auditTextVariants: [NCERT_AI_TABS_TEXT],
  },
  {
    id: 'ncert-finish-tip',
    section: 'NCERT Reader',
    route: 'ncert',
    targetSelector: '[data-tour="ncert-ai-explain"]',
    placement: 'left',
    getTitle: () => 'On-Demand Paragraph Breakdown',
    getDescription: (ctx) => resolvePointerTokens(NCERT_FINISH_TIP_TEXT, ctx.pointerVerb),
    auditTextVariants: [NCERT_FINISH_TIP_TEXT],
  },
];

// --- AI CHAT TOPIC TOUR (6 steps) ---
const AI_HEADER_TEXT =
  'AI Chat helps you solve CBSE Class 12 Physics, Chemistry, and Mathematics doubts. {Tap} New Chat anytime to start a fresh conversation thread.';
const AI_QUICK_PROMPTS_TEXT =
  'On a new chat, {tap} a starter card—like Explain a Concept, Solve a Numerical, Important Derivations, or Quick Quiz—to fill a structured prompt automatically.';
const AI_INPUT_TEXT =
  'Type your question and press Enter to send. Use the camera icon to attach a photo of a textbook or handwritten problem, or the microphone icon to dictate your question by voice.';
const AI_RESPONSE_CARD_TEXT =
  'AI replies format equations, steps, and key takeaways clearly. Below any reply, {tap} follow-up chips like Simpler or Give Example, or use Copy, Share, Bookmark, Pin, Speak, and Regenerate.';
const AI_TOOLS_TEXT =
  'Pick a generator—Notes, Formula Sheet, Flashcards, Quiz, Mind Map, Study Plan, or Doubt Solver—enter a chapter or topic, and {tap} Generate to create study material in chat.';
const AI_HISTORY_TEXT =
  'Search past sessions, filter Pinned or Bookmarked chats, or reopen any thread. {Tap} the trash icon to clear all chat history—a confirmation prompt appears first before permanently deleting your saved conversations.';

export const AICHAT_TOPIC_STEPS: TourStepConfig[] = [
  {
    id: 'ai-header',
    section: 'AI Chat',
    route: 'ai',
    viewState: { screen: 'aiChat', tab: 'chat' },
    targetSelector: '[data-tour="ai-header"]',
    placement: 'bottom',
    getTitle: () => 'AI Chat & New Session',
    getDescription: (ctx) => resolvePointerTokens(AI_HEADER_TEXT, ctx.pointerVerb),
    auditTextVariants: [AI_HEADER_TEXT],
  },
  {
    id: 'ai-quick-prompts',
    section: 'AI Chat',
    route: 'ai',
    viewState: { screen: 'aiChat', tab: 'chat' },
    targetSelector: '[data-tour="ai-quick-prompts"]',
    placement: 'top',
    optional: true,
    getTitle: () => 'Starter Prompts',
    getDescription: (ctx) => resolvePointerTokens(AI_QUICK_PROMPTS_TEXT, ctx.pointerVerb),
    auditTextVariants: [AI_QUICK_PROMPTS_TEXT],
  },
  {
    id: 'ai-input',
    section: 'AI Chat',
    route: 'ai',
    viewState: { screen: 'aiChat', tab: 'chat' },
    targetSelector: '[data-tour="ai-input"]',
    placement: 'top',
    getTitle: () => 'Ask, Attach Photo or Voice',
    getDescription: (ctx) => resolvePointerTokens(AI_INPUT_TEXT, ctx.pointerVerb),
    auditTextVariants: [AI_INPUT_TEXT],
  },
  {
    id: 'ai-response-card',
    section: 'AI Chat',
    route: 'ai',
    viewState: { screen: 'aiChat', tab: 'chat' },
    targetSelector: '[data-tour="ai-response-card"]',
    placement: 'top',
    emptyStateFallbackToCenter: true,
    getTitle: () => 'Responses, Follow-Ups & Actions',
    getDescription: (ctx) => resolvePointerTokens(AI_RESPONSE_CARD_TEXT, ctx.pointerVerb),
    auditTextVariants: [AI_RESPONSE_CARD_TEXT],
  },
  {
    id: 'ai-tools',
    section: 'AI Chat',
    route: 'ai',
    viewState: { screen: 'aiChat', tab: 'tools' },
    targetSelector: '[data-tour="ai-tools-panel"], [data-tour="ai-tools-view"]',
    placement: 'left',
    getTitle: () => 'Study Tools Generators',
    getDescription: (ctx) => resolvePointerTokens(AI_TOOLS_TEXT, ctx.pointerVerb),
    auditTextVariants: [AI_TOOLS_TEXT],
  },
  {
    id: 'ai-history',
    section: 'AI Chat',
    route: 'ai',
    viewState: { screen: 'aiChat', tab: 'history' },
    targetSelector: '[data-tour="ai-history-sidebar"], [data-tour="ai-history-view"]',
    placement: 'right',
    getTitle: () => 'Chat History & Clear All',
    getDescription: (ctx) => resolvePointerTokens(AI_HISTORY_TEXT, ctx.pointerVerb),
    auditTextVariants: [AI_HISTORY_TEXT],
  },
];

// --- MISTAKES TOPIC TOUR (5 steps) ---
const MISTAKES_HEADER_TEXT =
  'Mistake Notebook automatically collects questions you answered wrong or skipped in practice tests. Switch between Mistake Vault to review individual questions and Analytics to inspect error patterns.';
const MISTAKES_STATS_TEXT =
  'See your Total Mistakes, Unrevised count, Repeated Errors, and Mastered questions at a glance so you know how many items still need review.';
const MISTAKES_FILTERS_TEXT =
  'Search by keyword or filter by subject, mistake type, and revision status. {Tap} Re-Test Mistakes to start a custom 5, 10, 15, or 20-question practice test from your saved mistakes.';
const MISTAKES_CARD_WITH_DATA_TEXT =
  'Each card shows your answer, the correct answer, and explanation. {Tap} Mark Revised, Bookmark, Ask AI, or Retry. {Tapping} Delete removes that mistake immediately without a confirmation dialog.';
const MISTAKES_CARD_EMPTY_TEXT =
  'Once you log mistakes from practice tests, each card shows your answer, the correct answer, and actions like Mark Revised, Bookmark, Ask AI, Retry, or immediate Delete.';
const MISTAKES_ANALYTICS_TEXT =
  'In Analytics, review your Accuracy Rate, Top Mistake Type, Most Vulnerable Subject, error type distribution (Conceptual, Calculation, Formula, Time, Guessing), and chapters with the most mistakes.';

export const MISTAKES_TOPIC_STEPS: TourStepConfig[] = [
  {
    id: 'mistakes-header',
    section: 'Mistake Notebook',
    route: 'mistakes',
    viewState: { screen: 'mistakes', tab: 'list' },
    targetSelector: '[data-tour="mistakes-header"]',
    placement: 'bottom',
    getTitle: () => 'Mistake Notebook & Views',
    getDescription: (ctx) => resolvePointerTokens(MISTAKES_HEADER_TEXT, ctx.pointerVerb),
    auditTextVariants: [MISTAKES_HEADER_TEXT],
  },
  {
    id: 'mistakes-stats',
    section: 'Mistake Notebook',
    route: 'mistakes',
    viewState: { screen: 'mistakes', tab: 'list' },
    targetSelector: '[data-tour="mistakes-stats"]',
    placement: 'bottom',
    getTitle: () => 'Mistake Summary Counters',
    getDescription: (ctx) => resolvePointerTokens(MISTAKES_STATS_TEXT, ctx.pointerVerb),
    auditTextVariants: [MISTAKES_STATS_TEXT],
  },
  {
    id: 'mistakes-filters',
    section: 'Mistake Notebook',
    route: 'mistakes',
    viewState: { screen: 'mistakes', tab: 'list' },
    targetSelector: '[data-tour="mistakes-filters"]',
    placement: 'bottom',
    getTitle: () => 'Search, Filters & Re-Test',
    getDescription: (ctx) => resolvePointerTokens(MISTAKES_FILTERS_TEXT, ctx.pointerVerb),
    auditTextVariants: [MISTAKES_FILTERS_TEXT],
  },
  {
    id: 'mistakes-card',
    section: 'Mistake Notebook',
    route: 'mistakes',
    viewState: { screen: 'mistakes', tab: 'list' },
    targetSelector: '[data-tour="mistakes-card"]',
    placement: 'top',
    emptyStateFallbackToCenter: true,
    getTitle: () => 'Mistake Card & Actions',
    getDescription: (ctx) =>
      resolvePointerTokens(
        ctx.hasMistakes ? MISTAKES_CARD_WITH_DATA_TEXT : MISTAKES_CARD_EMPTY_TEXT,
        ctx.pointerVerb
      ),
    auditTextVariants: [MISTAKES_CARD_WITH_DATA_TEXT, MISTAKES_CARD_EMPTY_TEXT],
  },
  {
    id: 'mistakes-analytics',
    section: 'Mistake Notebook',
    route: 'mistakes',
    viewState: { screen: 'mistakes', tab: 'analytics' },
    targetSelector: '[data-tour="mistakes-analytics"]',
    placement: 'top',
    emptyStateFallbackToCenter: true,
    getTitle: () => 'Mistake Analytics Breakdown',
    getDescription: (ctx) => resolvePointerTokens(MISTAKES_ANALYTICS_TEXT, ctx.pointerVerb),
    auditTextVariants: [MISTAKES_ANALYTICS_TEXT],
  },
];

// --- WEAKNESS TOPIC TOUR (5 steps) ---
const WEAKNESS_SUMMARY_TEXT =
  'Weakness Analyzer groups your chapters into Strong (75%+), Moderate (50–74%), and Weak (below 50%) using test accuracy, mistake frequency, and revision recency, and highlights your top priority action cards.';
const WEAKNESS_RADAR_TEXT =
  'Compare Physics, Chemistry, and Mathematics balance on the radar chart, check your Mistake Vault resolution rate, and follow your weekly score trajectory across recent snapshots.';
const WEAKNESS_LEVELS_TEXT =
  'This breakdown shows how your syllabus is distributed across Strong, Moderate, and Weak tiers so you can prioritize chapters below 50% before board exams.';
const WEAKNESS_FILTERS_TEXT =
  'Filter the chapter list by All, Physics, Chemistry, or Mathematics, restrict to Weak, Moderate, or Strong tiers, or sort by weakest score first.';
const WEAKNESS_CHAPTER_CARD_TEXT =
  'Each chapter card shows its strength score, accuracy, and weak subtopics. {Tap} Practice Weak Subtopics for a targeted quiz, Revise NCERT to read the chapter, or Ask AI Tutor.';

export const WEAKNESS_TOPIC_STEPS: TourStepConfig[] = [
  {
    id: 'weakness-summary',
    section: 'Weakness Analyzer',
    route: 'weakness',
    targetSelector: '[data-tour="weakness-summary"]',
    placement: 'bottom',
    emptyStateFallbackToCenter: true,
    getTitle: () => 'Strength Summary & Priority Insights',
    getDescription: (ctx) => resolvePointerTokens(WEAKNESS_SUMMARY_TEXT, ctx.pointerVerb),
    auditTextVariants: [WEAKNESS_SUMMARY_TEXT],
  },
  {
    id: 'weakness-radar',
    section: 'Weakness Analyzer',
    route: 'weakness',
    targetSelector: '[data-tour="weakness-radar"]',
    placement: 'top',
    emptyStateFallbackToCenter: true,
    getTitle: () => 'Subject Radar, Vault & Trajectory',
    getDescription: (ctx) => resolvePointerTokens(WEAKNESS_RADAR_TEXT, ctx.pointerVerb),
    auditTextVariants: [WEAKNESS_RADAR_TEXT],
  },
  {
    id: 'weakness-levels',
    section: 'Weakness Analyzer',
    route: 'weakness',
    targetSelector: '[data-tour="weakness-levels"]',
    placement: 'top',
    emptyStateFallbackToCenter: true,
    getTitle: () => 'Chapter Strength Distribution',
    getDescription: (ctx) => resolvePointerTokens(WEAKNESS_LEVELS_TEXT, ctx.pointerVerb),
    auditTextVariants: [WEAKNESS_LEVELS_TEXT],
  },
  {
    id: 'weakness-filters',
    section: 'Weakness Analyzer',
    route: 'weakness',
    targetSelector: '[data-tour="weakness-filters"]',
    placement: 'bottom',
    emptyStateFallbackToCenter: true,
    getTitle: () => 'Filter & Sort Chapters',
    getDescription: (ctx) => resolvePointerTokens(WEAKNESS_FILTERS_TEXT, ctx.pointerVerb),
    auditTextVariants: [WEAKNESS_FILTERS_TEXT],
  },
  {
    id: 'weakness-chapter-card',
    section: 'Weakness Analyzer',
    route: 'weakness',
    targetSelector: '[data-tour="weakness-chapter-card"]',
    placement: 'top',
    emptyStateFallbackToCenter: true,
    getTitle: () => 'Chapter Diagnosis & Action Buttons',
    getDescription: (ctx) => resolvePointerTokens(WEAKNESS_CHAPTER_CARD_TEXT, ctx.pointerVerb),
    auditTextVariants: [WEAKNESS_CHAPTER_CARD_TEXT],
  },
];

// --- PROFILE & SETTINGS TOPIC TOUR (6 steps) ---
const PROFILE_INTRO_TEXT =
  'View your name, class badge, and target exam. Use Edit Profile, Achievements, or Share Progress here. {Tapping} Log Out signs you out of your account immediately without a confirmation dialog.';
const PROFILE_STATS_TEXT =
  'Check your Target Score, Completed Chapters, Daily Routine Target, and CBSE PCM calibration. {Tap} the Cloud State card to Sync Now and upload pending local changes to the cloud.';
const PROFILE_REPORTS_TEXT =
  "In Study Reports, review your Daily Report (tasks finished, study time, productivity score) and Weekly Summary chart, or {tap} Share Today's Progress to export a summary card.";
const SETTINGS_THEME_NOTIFICATIONS_TEXT =
  'In Settings & Backup, switch between Light, Dark, or System theme, or {tap} Manage Notifications below to configure daily study reminders, streak alerts, and quiet hours.';
const SETTINGS_BACKUP_TEXT =
  'Save Cloud Backup uploads your progress. Restore from Cloud and Import Backup File overwrite local study data with the backup immediately without a confirmation prompt and reload the app.';
const SETTINGS_CLOUD_BACKUPS_TEXT =
  'Create snapshots or choose Smart Merge (adds missing data) or Replace Complete State (overwrites local progress after a confirmation modal). In General Settings, {tap} Replay tutorial anytime to reopen the tour menu.';

export const PROFILE_TOPIC_STEPS: TourStepConfig[] = [
  {
    id: 'profile-intro',
    section: 'Profile',
    route: 'profile',
    viewState: { screen: 'profile', tab: 'overview' },
    targetSelector: '[data-tour="profile-intro"]',
    placement: 'bottom',
    getTitle: () => 'Profile Header & Account Actions',
    getDescription: (ctx) => resolvePointerTokens(PROFILE_INTRO_TEXT, ctx.pointerVerb),
    auditTextVariants: [PROFILE_INTRO_TEXT],
  },
  {
    id: 'profile-stats',
    section: 'Profile',
    route: 'profile',
    viewState: { screen: 'profile', tab: 'overview' },
    targetSelector: '[data-tour="profile-stats"]',
    placement: 'bottom',
    getTitle: () => 'Summary Metrics, Cloud State & Academic Details',
    getDescription: (ctx) => resolvePointerTokens(PROFILE_STATS_TEXT, ctx.pointerVerb),
    auditTextVariants: [PROFILE_STATS_TEXT],
  },
  {
    id: 'profile-reports',
    section: 'Profile',
    route: 'profile',
    viewState: { screen: 'profile', tab: 'reports' },
    targetSelector: '[data-tour="profile-reports"]',
    placement: 'top',
    getTitle: () => 'Study Reports',
    getDescription: (ctx) => resolvePointerTokens(PROFILE_REPORTS_TEXT, ctx.pointerVerb),
    auditTextVariants: [PROFILE_REPORTS_TEXT],
  },
  {
    id: 'settings-theme',
    section: 'Settings & Backup',
    route: 'profile',
    viewState: { screen: 'profile', tab: 'settings', subTab: 'general' },
    targetSelector: '[data-tour="settings-theme"]',
    placement: 'bottom',
    getTitle: () => 'Theme & Study Notifications',
    getDescription: (ctx) => resolvePointerTokens(SETTINGS_THEME_NOTIFICATIONS_TEXT, ctx.pointerVerb),
    auditTextVariants: [SETTINGS_THEME_NOTIFICATIONS_TEXT],
  },
  {
    id: 'settings-backup',
    section: 'Settings & Backup',
    route: 'profile',
    viewState: { screen: 'profile', tab: 'settings', subTab: 'general' },
    targetSelector: '[data-tour="settings-backup"]',
    placement: 'top',
    getTitle: () => 'Cloud & Offline File Backups',
    getDescription: (ctx) => resolvePointerTokens(SETTINGS_BACKUP_TEXT, ctx.pointerVerb),
    auditTextVariants: [SETTINGS_BACKUP_TEXT],
  },
  {
    id: 'settings-cloud-backups',
    section: 'Settings & Backup',
    route: 'profile',
    viewState: { screen: 'profile', tab: 'settings', subTab: 'backup' },
    targetSelector: '[data-tour="settings-cloud-backups"]',
    placement: 'top',
    getTitle: () => 'Cloud Backups Hub & Tutorial Replay',
    getDescription: (ctx) => resolvePointerTokens(SETTINGS_CLOUD_BACKUPS_TEXT, ctx.pointerVerb),
    auditTextVariants: [SETTINGS_CLOUD_BACKUPS_TEXT],
  },
];

// --- APPEARANCE LAB TOPIC TOUR (3 steps) ---
const LAB_PRESETS_TEXT =
  'Preview your styling live at the top, apply a one-{tap} UI Style Preset (Minimal, Material 3, Modern Flat, Professional, or High Contrast), or pick from eight accent colors.';
const LAB_RADIUS_DENSITY_TEXT =
  'Adjust Corner Radius, Card Density, Shadow Intensity, Background Style, Font Size Scale, and Interface Zoom Scale (90% to 125%) to make reading comfortable on your screen.';
const LAB_PERFORMANCE_TEXT =
  'Choose Battery Saver, Balanced, or Best Quality, or toggle Reduce Motion to disable animations. At the top right, {tapping} Reset to Default immediately restores default appearance settings without confirmation.';

export const APPEARANCE_TOPIC_STEPS: TourStepConfig[] = [
  {
    id: 'lab-presets',
    section: 'Appearance Lab',
    route: 'profile',
    viewState: { screen: 'appearanceLab' },
    targetSelector: '[data-tour="lab-presets"]',
    placement: 'top',
    getTitle: () => 'Live Preview, Style Presets & Accent Colors',
    getDescription: (ctx) => resolvePointerTokens(LAB_PRESETS_TEXT, ctx.pointerVerb),
    auditTextVariants: [LAB_PRESETS_TEXT],
  },
  {
    id: 'lab-radius-density',
    section: 'Appearance Lab',
    route: 'profile',
    viewState: { screen: 'appearanceLab' },
    targetSelector: '[data-tour="lab-radius-density"]',
    placement: 'top',
    getTitle: () => 'Radius, Density, Shadows & Text Scale',
    getDescription: (ctx) => resolvePointerTokens(LAB_RADIUS_DENSITY_TEXT, ctx.pointerVerb),
    auditTextVariants: [LAB_RADIUS_DENSITY_TEXT],
  },
  {
    id: 'lab-performance',
    section: 'Appearance Lab',
    route: 'profile',
    viewState: { screen: 'appearanceLab' },
    targetSelector: '[data-tour="lab-performance"]',
    placement: 'top',
    getTitle: () => 'Performance, Reduce Motion & Reset',
    getDescription: (ctx) => resolvePointerTokens(LAB_PERFORMANCE_TEXT, ctx.pointerVerb),
    auditTextVariants: [LAB_PERFORMANCE_TEXT],
  },
];

// ============================================================================
// 3. TOPIC ORDER, FULL TOUR & DATA-DRIVEN LOOKUP
// ============================================================================

export const TOPIC_TOUR_ORDER: TopicTourId[] = [
  'home',
  'study',
  'ncert',
  'aichat',
  'mistakes',
  'weakness',
  'profile',
  'appearance',
];

export const TOPIC_TOURS: Record<TopicTourId, TourStepConfig[]> = {
  home: HOME_TOPIC_STEPS,
  study: STUDY_TOPIC_STEPS,
  ncert: NCERT_TOPIC_STEPS,
  aichat: AICHAT_TOPIC_STEPS,
  mistakes: MISTAKES_TOPIC_STEPS,
  weakness: WEAKNESS_TOPIC_STEPS,
  profile: PROFILE_TOPIC_STEPS,
  appearance: APPEARANCE_TOPIC_STEPS,
};

/**
 * Full tour: all topic tours in order, one after another (no duplicate Welcome or Finish between topics).
 */
export const FULL_TOUR_STEPS: TourStepConfig[] = TOPIC_TOUR_ORDER.flatMap(
  (topicId) => TOPIC_TOURS[topicId]
);

export const TOURS_BY_ID: Record<TourId, TourStepConfig[]> = {
  quick: QUICK_TOUR_STEPS,
  full: FULL_TOUR_STEPS,
  ...TOPIC_TOURS,
};

export interface TopicTourMenuEntry {
  id: TopicTourId;
  label: string;
  stepCount: number;
}

export const TOPIC_TOUR_MENU_ITEMS: TopicTourMenuEntry[] = [
  { id: 'home', label: 'Home', stepCount: HOME_TOPIC_STEPS.length },
  { id: 'study', label: 'Study', stepCount: STUDY_TOPIC_STEPS.length },
  { id: 'ncert', label: 'NCERT Reader', stepCount: NCERT_TOPIC_STEPS.length },
  { id: 'aichat', label: 'AI Chat', stepCount: AICHAT_TOPIC_STEPS.length },
  { id: 'mistakes', label: 'Mistakes', stepCount: MISTAKES_TOPIC_STEPS.length },
  { id: 'weakness', label: 'Weakness', stepCount: WEAKNESS_TOPIC_STEPS.length },
  { id: 'profile', label: 'Profile & Settings', stepCount: PROFILE_TOPIC_STEPS.length },
  { id: 'appearance', label: 'Appearance Lab', stepCount: APPEARANCE_TOPIC_STEPS.length },
];

export function getTourSteps(tourId: TourId): TourStepConfig[] {
  return TOURS_BY_ID[tourId] || QUICK_TOUR_STEPS;
}

/**
 * Default export alias for backward compatibility.
 */
export const TOUR_STEPS: TourStepConfig[] = QUICK_TOUR_STEPS;
