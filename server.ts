import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize GoogleGenAI client with the key from process.env
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to extract YouTube video ID from normal, youtu.be, embed, shorts, or playlist links
function getYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Rankify AI Study Engine',
      timestamp: new Date().toISOString(),
    });
  });

  // LectureLab: Analyze YouTube Lecture Endpoint
  app.post('/api/lecturelab/analyze', async (req: Request, res: Response) => {
    const { url, subjectOverride, chapterOverride, languageOverride } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'YouTube URL is required' });
    }

    const videoId = getYouTubeId(url);
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid or unsupported YouTube URL. Please provide a valid normal link, youtu.be link, Shorts, or playlist video.' });
    }

    try {
      // Fetch oEmbed video info from YouTube without requiring an API key
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      let oembedData: { title?: string; author_name?: string; thumbnail_url?: string } = {};
      try {
        const oembedRes = await fetch(oembedUrl);
        if (oembedRes.ok) {
          oembedData = await oembedRes.json();
        }
      } catch (e) {
        console.warn('oEmbed fetch failed:', e);
      }

      const title = oembedData.title || `Lecture on CBSE Class 12 PCM`;
      const channelName = oembedData.author_name || 'YouTube Educator';
      const thumbnailUrl = oembedData.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      // Form overrides context
      const overridesContext = [];
      if (subjectOverride) overridesContext.push(`Force Subject: "${subjectOverride}"`);
      if (chapterOverride) overridesContext.push(`Force Chapter: "${chapterOverride}"`);
      if (languageOverride) overridesContext.push(`Force Language: "${languageOverride}"`);
      const overridesStr = overridesContext.join('\n');

      // Request structured board-oriented analysis from Gemini Flash
      const geminiRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are an elite, highly credentialed CBSE Board Class 12 PCM/PCB (Physics, Chemistry, Mathematics, Biology) educator.
Analyze the following YouTube lecture details:
Video Title: "${title}"
Video Channel: "${channelName}"
Video ID: "${videoId}"

${overridesStr}

Perform a deep, academically rich curriculum mapping and full content analysis of this topic. Since it maps to the CBSE Class 12 PCM/PCB syllabus, you must output a strictly structured response matching the specified JSON schema. Output formulas with variables, units, common mistakes, highly clear definitions, expected Board exam questions with mistake analysis, and a comprehensive revision modes package with mind maps, flashcards, and multiple cheat sheet formats.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedSubject: { type: Type.STRING, description: 'E.g., Physics, Chemistry, Mathematics, Biology' },
              detectedChapter: { type: Type.STRING, description: 'Matching official Class 12 PCM/PCB chapter name' },
              difficulty: { type: Type.STRING, description: 'Easy, Medium, Hard, Board Level, or Topper Level' },
              board: { type: Type.STRING, description: 'Target board, default "CBSE"' },
              language: { type: Type.STRING, description: 'Detected language, e.g. English, Hinglish, Hindi' },
              confidenceScore: { type: Type.INTEGER, description: 'Confidence score percentage (e.g. 98)' },
              analysisDate: { type: Type.STRING, description: 'Current analysis date format' },
              estimatedStudyTime: { type: Type.STRING, description: "E.g., '50 mins'" },
              duration: { type: Type.STRING, description: "E.g., '1h 15m' or '34:20'" },
              aiSummary: {
                type: Type.OBJECT,
                properties: {
                  ultraShort: { type: Type.STRING, description: 'One sentence ultra short summary' },
                  detailed: { type: Type.STRING, description: 'Thorough, detailed summary of the main arguments' },
                  examSummary: { type: Type.STRING, description: 'Exam-focused core points summary' },
                  teacherNotes: { type: Type.STRING, description: 'Teacher explanation and key focus remarks' },
                  oneMinuteRevision: { type: Type.STRING, description: 'Rapid 60-second summary bullets' }
                },
                required: ['ultraShort', 'detailed', 'examSummary', 'teacherNotes', 'oneMinuteRevision']
              },
              keyConcepts: {
                type: Type.ARRAY,
                description: 'Extract every single important concept from the lecture',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    definition: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    importance: { type: Type.STRING, description: 'Board exam relevance / marking value' },
                    example: { type: Type.STRING },
                    examImportance: { type: Type.STRING, description: 'CBSE weightage assessment, e.g. 9/10' }
                  },
                  required: ['title', 'definition', 'explanation', 'importance', 'example', 'examImportance']
                }
              },
              importantFormulas: {
                type: Type.ARRAY,
                description: 'Collection of formulas',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: 'Name of the formula/equation' },
                    formula: { type: Type.STRING, description: 'The mathematical expression (e.g., V = I * R)' },
                    meaning: { type: Type.STRING, description: 'Definition of equation and terms' },
                    variables: { type: Type.STRING, description: 'Symbol definitions' },
                    units: { type: Type.STRING, description: 'SI/cgs units' },
                    whereUsed: { type: Type.STRING, description: 'Syllabus context' },
                    commonMistakes: { type: Type.STRING, description: 'Frequent student errors during numerical calculations' },
                    description: { type: Type.STRING, description: 'What each term represents' },
                    application: { type: Type.STRING, description: 'Direct board exam application case' }
                  },
                  required: ['name', 'formula', 'meaning', 'variables', 'units', 'whereUsed', 'commonMistakes', 'description', 'application']
                }
              },
              timeline: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    timestamp: { type: Type.STRING, description: "Timestamp, e.g. '00:00', '04:20', '12:30'" },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ['timestamp', 'title', 'description']
                }
              },
              mcqs: {
                type: Type.ARRAY,
                description: 'Exactly 10 multiple choice questions',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    answer: { type: Type.STRING, description: 'The exact string match of the correct option' },
                    explanation: { type: Type.STRING },
                    mistakeAnalysis: { type: Type.STRING, description: 'Pitfall warning explanation' }
                  },
                  required: ['question', 'options', 'answer', 'explanation', 'mistakeAnalysis']
                }
              },
              shortQuestions: {
                type: Type.ARRAY,
                description: 'Exactly 5 short questions (2-3 marks)',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING },
                    points: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Points to write for full marks' },
                    mistakeAnalysis: { type: Type.STRING }
                  },
                  required: ['question', 'answer', 'points', 'mistakeAnalysis']
                }
              },
              longQuestions: {
                type: Type.ARRAY,
                description: 'Exactly 3 long questions (5 marks / derivations)',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING },
                    detailedPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                    mistakeAnalysis: { type: Type.STRING }
                  },
                  required: ['question', 'answer', 'detailedPoints', 'mistakeAnalysis']
                }
              },
              hotsQuestions: {
                type: Type.ARRAY,
                description: 'Exactly 2 Higher-Order Thinking Skills (HOTS) questions',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    mistakeAnalysis: { type: Type.STRING }
                  },
                  required: ['question', 'answer', 'explanation', 'mistakeAnalysis']
                }
              },
              competencyQuestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    scenario: { type: Type.STRING },
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    mistakeAnalysis: { type: Type.STRING }
                  },
                  required: ['scenario', 'question', 'answer', 'explanation', 'mistakeAnalysis']
                }
              },
              assertionReason: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    assertion: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    answer: { type: Type.STRING, description: 'Option A, B, C, or D' },
                    explanation: { type: Type.STRING },
                    mistakeAnalysis: { type: Type.STRING }
                  },
                  required: ['assertion', 'reason', 'answer', 'explanation', 'mistakeAnalysis']
                }
              },
              caseStudy: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    scenario: { type: Type.STRING },
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    mistakeAnalysis: { type: Type.STRING }
                  },
                  required: ['scenario', 'question', 'answer', 'explanation', 'mistakeAnalysis']
                }
              },
              boardPatternQuestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    expectedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                    answer: { type: Type.STRING },
                    mistakeAnalysis: { type: Type.STRING }
                  },
                  required: ['question', 'expectedKeywords', 'answer', 'mistakeAnalysis']
                }
              },
              numericals: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    formulaUsed: { type: Type.STRING },
                    solutionStepByStep: { type: Type.ARRAY, items: { type: Type.STRING } },
                    finalAnswer: { type: Type.STRING },
                    mistakeAnalysis: { type: Type.STRING }
                  },
                  required: ['question', 'formulaUsed', 'solutionStepByStep', 'finalAnswer', 'mistakeAnalysis']
                }
              },
              boardExpectedQuestions: {
                type: Type.ARRAY,
                description: 'Expected board questions list',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING },
                    keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ['question', 'answer', 'keywords']
                }
              },
              veryImportantQuestions: {
                type: Type.ARRAY,
                description: 'Most important core questions',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                  },
                  required: ['question', 'answer', 'explanation']
                }
              },
              weakTopics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    concept: { type: Type.STRING },
                    category: { type: Type.STRING, description: 'Must be: Needs Revision, Needs Practice, or Needs Formula Revision' },
                    description: { type: Type.STRING }
                  },
                  required: ['concept', 'category', 'description']
                }
              },
              smartRecommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, description: 'Must be: Next Lecture, Related Chapter, Practice Questions, Revision, or NCERT Reading' },
                    recommendationText: { type: Type.STRING },
                    details: { type: Type.STRING }
                  },
                  required: ['type', 'recommendationText', 'details']
                }
              },
              revisionMode: {
                type: Type.OBJECT,
                properties: {
                  revisionNotes: { type: Type.STRING, description: 'Thorough, beautifully structured markdown revision notes' },
                  mindMap: { type: Type.STRING, description: 'ASCII or simple textual mind map hierarchy representation of concepts' },
                  flashcards: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        front: { type: Type.STRING, description: 'Question or concept term on the front of the flashcard' },
                        back: { type: Type.STRING, description: 'Answer or explanation on the back of the flashcard' }
                      },
                      required: ['front', 'back']
                    }
                  },
                  lastMinuteNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
                  formulaSheet: { type: Type.STRING, description: 'Short-list markdown of critical formulas' },
                  quickNotes: { type: Type.STRING, description: 'Summarized rapid-recall sheets' },
                  examNotes: { type: Type.STRING, description: 'Focused notes optimized for scoring metrics' },
                  oneNightBeforeExamNotes: { type: Type.STRING, description: 'High-yield, fast scanning checklists' }
                },
                required: ['revisionNotes', 'mindMap', 'flashcards', 'lastMinuteNotes', 'formulaSheet', 'quickNotes', 'examNotes', 'oneNightBeforeExamNotes']
              }
            },
            required: [
              'detectedSubject', 'detectedChapter', 'difficulty', 'board', 'language', 'confidenceScore', 'analysisDate',
              'estimatedStudyTime', 'duration', 'aiSummary', 'keyConcepts', 'importantFormulas', 'timeline',
              'mcqs', 'shortQuestions', 'longQuestions', 'hotsQuestions', 'competencyQuestions',
              'assertionReason', 'caseStudy', 'boardPatternQuestions', 'numericals', 'boardExpectedQuestions',
              'veryImportantQuestions', 'weakTopics', 'smartRecommendations', 'revisionMode'
            ]
          }
        }
      });

      const textResult = geminiRes.text;
      if (!textResult) {
        throw new Error('Gemini returned an empty response');
      }

      const parsedData = JSON.parse(textResult);

      res.json({
        url,
        videoId,
        title,
        channelName,
        thumbnailUrl,
        ...parsedData,
      });
    } catch (error: any) {
      console.error('LectureLab API Error:', error);
      res.status(500).json({ error: error.message || 'An error occurred during video analysis.' });
    }
  });

  // Handle lingering service worker requests from previous sessions gracefully
  app.get(['/dev-sw.js', '/sw.js'], (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`
      self.addEventListener('install', () => self.skipWaiting());
      self.addEventListener('activate', (event) => {
        event.waitUntil(
          self.registration.unregister().then(() => {
            return self.clients.matchAll();
          }).then((clients) => {
            clients.forEach((client) => {
              if (client.url && 'navigate' in client) {
                client.navigate(client.url);
              }
            });
          })
        );
      });
    `);
  });

  // Dev / Production Vite handling
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Rankify Full-Stack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
