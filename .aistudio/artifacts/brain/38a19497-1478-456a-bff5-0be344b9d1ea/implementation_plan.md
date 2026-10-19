# Implementation Plan: Chapter Data Derivation, Accuracy & Bonus Task Display Fix

## Problem Summary
1. **Chapter Count Discrepancy**: The Study view heading says "Interactive 40-Chapter PCM Matrix", while filter chips and other screens show 37 chapters. Counts are hardcoded across multiple views rather than dynamically derived from the syllabus template.
2. **Artificial 70% Accuracy on Unattempted Chapters**: Unattempted chapters ("Questions: 0 - Revisions: 0") display "Accuracy: 70%" due to fallback `ch.accuracy || 70`. Readiness and weakness algorithms also treat unattempted chapters as having 70-72% accuracy.
3. **Raw Chapter IDs & Subject Mismatches in Bonus Tasks**: When bonus tasks are generated from chapter keys (e.g., `phy_12_01`), the generator interpolates raw IDs into the title and `chapterName`, and assigns incorrect subjects based on a naive keyword heuristic (labeling `phy_12_01` as Chemistry).
4. **Unbacked Numbers & Stored Raw IDs**: Bonus task titles make specific claims (e.g., "5 High-Deficit Numericals", "3 Flagged Concept Trap Questions") regardless of whether the student has open mistakes or is weak in that chapter. Existing saved tasks still store raw IDs in their titles.

---

## Proposed Changes

### 1. Centralized Chapter & Syllabus Service (`src/services/chapter-service.ts`)
- **Single Source of Truth**: Derive total and per-subject chapter counts directly from `OFFICIAL_CBSE_12_PCM_TEMPLATE` (Physics: 14, Chemistry: 10, Mathematics: 13, Total: 37).
- **Canonical Lookup Helper**: `getChapterById(id: string): { id: string; name: string; subject: string; subjectName: string; topics?: string[]; weightage?: number }`
  - Normalizes IDs (`phy_12_01`, `phy_ch1`, `phy_12_1`, etc.) as well as names to always return the official chapter name and matching CBSE subject name.
- **Accuracy Formatter & Calculator**:
  - `computeAccuracy(attempted: number, correct?: number, storedAccuracy?: number): number | null`: Returns null if `attempted === 0`.
  - `formatAccuracyDisplay(attempted: number, correct?: number, storedAccuracy?: number): { display: string; ariaLabel: string; isAttempted: boolean }`: Returns `–` (en dash) with `aria-label="No attempts yet"` when unattempted, or `${Math.round(acc)}%` when attempted.
- **Task Repair & Sanitization Helper**:
  - `sanitizeTask(task: TaskItem): TaskItem`: Detects raw chapter IDs (e.g., `phy_12_xx`, `chem_12_xx`, `math_12_xx`, `phy_chx`) inside `taskTitle` or `chapterName` and replaces them with official chapter names, correcting `subjectName` to match the chapter.

### 2. Study View Matrix (`src/features/study/ActiveStudyEngineView.tsx`)
- Heading changed to **"Interactive PCM Chapter Matrix"** (no number).
- Subject filter pills display dynamically derived counts:
  - `All (${totalCount})`
  - `Physics (${physicsCount})`
  - `Chemistry (${chemistryCount})`
  - `Mathematics (${mathCount})`
- Accuracy display updated:
  - Uses `formatAccuracyDisplay` with fixed-width styling (`inline-block min-w-[2ch]`) to prevent layout shifts on iOS/Android.
  - Never displays default 70% or NaN / Infinity.

### 3. Dynamic Chapter Counts Across All Views
- Replace hardcoded chapter counts with derived values from `getSubjectChapterCounts()` in:
  - `src/features/home/HomeScreenRevamped.tsx` ("N CBSE Chapters")
  - `src/features/profile/ProfileView.tsx` ("x / N" and "N Chapters")
  - `src/features/reports/StudyReportsView.tsx` ("N Chapters")
  - `src/features/progress/ProgressView.tsx`
  - `src/features/tools/ToolsHubView.tsx`
  - `src/features/more/MoreView.tsx`
  - `src/layouts/Sidebar.tsx`
  - `src/features/onboarding/components/Screen7SyllabusTracker.tsx`

### 4. Real Data-Backed Bonus Task Generator (`src/services/daily-mission-service.ts`)
- **Subject Matching**: The task's `subjectName` is always taken directly from the chapter's canonical metadata.
- **Hierarchical Chapter Selection**:
  1. **Open Mistakes**: Chapters with open/unresolved mistakes from Mistake Vault (`mistakeService.getMistakes()`).
  2. **Lowest Accuracy**: Chapters with `attempted > 0` sorted ascending by accuracy.
  3. **Not-Started Chapters**: Chapters where `attempted === 0` and `progressPercentage === 0`.
  4. **Fallback**: Generic practice target only if no specific data exists.
- **Data-Backed Titles**:
  - Mistake task generated *only* if open mistakes exist: `"Mistake Recovery: Re-attempt {n} flagged question(s) in {Chapter Name}"`, where `n` is the real count of open mistakes.
  - High-deficit / weak wording used *only* if accuracy is strictly below weak threshold (< 70%).
  - Configurable practice target constants: `BONUS_TARGETS = { numericals: 5, pyqs: 4 }`.

### 5. Repairing Already Saved Tasks
- When tasks are loaded in `HomeScreenRevamped.tsx` (and inside sync/today stats), run `sanitizeTasks(tasks)` to resolve raw IDs in title and metadata to real chapter names.
- Ensure completed state, IDs, and user progress are never reset or altered.

### 6. Accuracy Integration in Readiness & Weakness Engines
- In `src/services/readiness-service.ts` and `src/services/weakness-service.ts`:
  - Skip unattempted chapters from accuracy calculations (do not default to 70% or 72%).
  - Treat unattempted chapters as "not started" rather than "weak" or "mastered".
  - Compute and log Overall Readiness before and after the change.

---

## Verification Plan

### Automated Verification
- Run `compile_applet` to verify TypeScript compilation and absence of syntax or import errors.
- Run `lint_applet` to check for any lint issues.

### Functional Verification
1. **Chapter Counts**:
   - Check Study heading ("Interactive PCM Chapter Matrix").
   - Check filter pills: All (37), Physics (14), Chemistry (10), Mathematics (13).
   - Check Home, Profile, Reports, and Sidebar for consistent derived count (37).
2. **Accuracy Formatting**:
   - Never-attempted chapter shows `–` with `aria-label="No attempts yet"`.
   - Chapter with attempts shows rounded percentage (e.g., 7 correct of 10 attempted shows `70%`).
   - No `NaN%`, `Infinity%`, or default `70%` on zero attempts.
3. **Bonus Tasks Generation**:
   - Generate bonus practice tasks: confirm no raw IDs appear in `taskTitle`, `chapterName`, or `subjectName`.
   - Verify that Physics chapters have `subjectName: 'Physics'`, Chemistry chapters have `subjectName: 'Chemistry'`, and Math chapters have `subjectName: 'Mathematics'`.
   - Verify titles use real mistake counts when available or standard practice target labels.
4. **Existing Saved Tasks**:
   - Verify existing tasks with raw IDs like `phy_12_01` are rendered with resolved human-readable chapter names without modifying completion status.
5. **Readiness Score Check**:
   - Record and report Overall Readiness before and after accuracy recalibration.
