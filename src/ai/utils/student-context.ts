import { StudentContextInfo, DetectedChapter, DetectedSubject } from '../model/types';

/**
 * Reads the student's profile & progress data safely from localStorage or context fallback.
 */
export function getSavedStudentContext(
  detectedSubject?: DetectedSubject,
  detectedChapter?: DetectedChapter
): StudentContextInfo {
  let name = 'Student';
  let targetPercentage = 95;
  let preferredLanguage = 'English';
  let classNumber = 12;
  let board = 'CBSE';
  let stream = 'Science PCM';
  let overallProgress = 0;
  let weakSubjects: string[] = [];
  let strongSubjects: string[] = [];
  let needsFocusChapters: string[] = [];
  let todaysFocusChapter = 'Electrochemistry';
  let accuracy = 84;
  let chapterProgressPercentage = 0;
  let chapterConfidence = 3;
  let chapterWeakTopics: string[] = [];
  let isNeedsFocus = false;
  let isCompleted = false;

  if (typeof window !== 'undefined') {
    try {
      // 1. Read student onboarding details
      const rawDetails = localStorage.getItem('rankify_student_details_v1');
      if (rawDetails) {
        const details = JSON.parse(rawDetails);
        if (details.name) name = details.name;
        if (details.targetPercentage) targetPercentage = details.targetPercentage;
        if (details.preferredLanguage) preferredLanguage = details.preferredLanguage;
        if (details.board) board = details.board;
        if (details.classNumber) classNumber = details.classNumber;
        if (details.stream) stream = 'Science PCM';
      }

      // 2. Read chapter progress map
      const rawChapters = localStorage.getItem('rankify_chapter_progress_v1');
      if (rawChapters) {
        const chaptersMap = JSON.parse(rawChapters);
        const list = Object.values(chaptersMap) as any[];

        if (list.length > 0) {
          const totalPct = list.reduce(
            (acc, item) => acc + (item.progressPercentage || 0),
            0
          );
          overallProgress = Math.round(totalPct / list.length);

          // Find needs focus chapters
          needsFocusChapters = list
            .filter((c) => c.needsFocus || c.confidence <= 2)
            .map((c) => c.chapterName);

          // If detectedChapter is provided, get its specific data
          if (detectedChapter) {
            const matched = list.find(
              (c) =>
                c.chapterName.toLowerCase().trim() ===
                  detectedChapter.name.toLowerCase().trim() ||
                detectedChapter.name.toLowerCase().includes(c.chapterName.toLowerCase()) ||
                c.chapterName.toLowerCase().includes(detectedChapter.name.toLowerCase())
            );

            if (matched) {
              chapterProgressPercentage = matched.progressPercentage || 0;
              chapterConfidence = matched.confidence || 3;
              chapterWeakTopics = matched.weakTopics || [];
              isNeedsFocus = !!matched.needsFocus || chapterConfidence <= 2;
              isCompleted =
                !!matched.completion || chapterProgressPercentage === 100;
              if (matched.accuracy) accuracy = matched.accuracy;
            }
          }
        }
      }

      // 3. Read weak subject analysis
      const rawWeak = localStorage.getItem('rankify_weak_subject_analysis_v1');
      if (rawWeak) {
        const weakData = JSON.parse(rawWeak);
        if (weakData.weakestSubject) {
          weakSubjects = [weakData.weakestSubject];
        }
        if (weakData.strongSubjects) {
          strongSubjects = weakData.strongSubjects;
        }
      }

      // 4. Read today's focus from AI plan
      const rawPlan = localStorage.getItem('rankify_ai_study_plan_v1');
      if (rawPlan) {
        const plan = JSON.parse(rawPlan);
        if (plan.todaysChapters && plan.todaysChapters.length > 0) {
          todaysFocusChapter = plan.todaysChapters[0];
        }
      }
    } catch {
      // Safe fallback if local storage parsing errors out
    }
  }

  return {
    name,
    classNumber,
    board,
    stream,
    preferredLanguage,
    targetPercentage,
    overallProgress,
    weakSubjects,
    strongSubjects,
    needsFocusChapters,
    todaysFocusChapter,
    accuracy,
    chapterProgressPercentage,
    chapterConfidence,
    chapterWeakTopics,
    isNeedsFocus,
    isCompleted,
  };
}

/**
 * Builds a pedagogical coach briefing block to inject into the generated prompt.
 */
export function formatStudentCoachDirective(
  student: StudentContextInfo,
  subject: DetectedSubject,
  chapterName: string
): string[] {
  const isWeak =
    student.isNeedsFocus ||
    student.weakSubjects.includes(subject) ||
    student.needsFocusChapters.includes(chapterName);

  const guidanceNotes: string[] = [];

  if (isWeak) {
    guidanceNotes.push(
      `• The student finds ${chapterName} challenging (Confidence: ${student.chapterConfidence || 2}/5). Provide crystal-clear analogies, step-by-step logic, and highlight common board exam traps.`
    );
  } else if (student.isCompleted) {
    guidanceNotes.push(
      `• The student has already studied ${chapterName} (100% syllabus progress). Focus on high-order board PYQs, challenge problems, and quick revision.`
    );
  } else {
    guidanceNotes.push(
      `• The student is progressing through ${chapterName} (${student.chapterProgressPercentage || 25}% complete). Build strong NCERT board fundamentals.`
    );
  }

  if (student.chapterWeakTopics && student.chapterWeakTopics.length > 0) {
    guidanceNotes.push(
      `• Specifically target the student's weak subtopics: ${student.chapterWeakTopics.join(', ')}.`
    );
  }

  return [
    'Student Profile & Personal Coach Context:',
    `• Student: ${student.name} | Target: ${student.targetPercentage}% in ${student.board} Class ${student.classNumber} (${student.stream})`,
    `• Preferred Language: ${student.preferredLanguage} | Overall Syllabus Coverage: ${student.overallProgress}%`,
    `• Target Subject: ${subject} | Target Chapter: ${chapterName}`,
    ...guidanceNotes,
  ];
}
