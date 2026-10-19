import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

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

// Initialize firebase-admin safely on the backend
try {
  admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'rankify-4ed9c'
  });
  console.log('[Firebase Admin] Initialized successfully.');
} catch (err) {
  console.warn('[Firebase Admin] Initialization warning (using environment credentials):', err);
}

// Function to automatically assign super admin Custom Claims and Firestore profile to devgamerz3131@gmail.com
async function ensureSuperAdminClaims() {
  const adminEmail = 'devgamerz3131@gmail.com';
  try {
    const authAdmin = getAuth();
    const userRecord = await authAdmin.getUserByEmail(adminEmail);
    const uid = userRecord.uid;

    // 1. Assign Firebase Custom Claims
    await authAdmin.setCustomUserClaims(uid, {
      admin: true,
      role: 'super_admin'
    });
    console.log(`[Firebase Admin] Custom claims successfully assigned to super admin: ${adminEmail}`);

    // 2. Store/update the user's Firestore profile
    try {
      const dbAdmin = getFirestore();
      const userRef = dbAdmin.collection('users').doc(uid);
      await userRef.set({
        role: 'super_admin',
        isAdmin: true
      }, { merge: true });
      console.log(`[Firebase Admin] Firestore profile successfully updated for super admin: ${adminEmail}`);
    } catch (fsErr) {
      console.warn('[Firebase Admin] Firestore profile update skipped or failed:', fsErr);
    }
  } catch (err: any) {
    console.log(`[Firebase Admin] Auto-assignment of claims to ${adminEmail} skipped (normal if user does not exist in Auth database yet or offline):`, err.message || err);
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Run Super Admin automatic custom claims and Firestore profile updates
  ensureSuperAdminClaims();

  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Rankify AI Study Engine',
      timestamp: new Date().toISOString(),
    });
  });

  // Intelligent Half-Yearly Performance Analyzer API
  app.post('/api/analyze-halfyearly', async (req: Request, res: Response) => {
    try {
      const { physics, chemistry, maths, mistakes, marksheetUploaded } = req.body;

      // Validate inputs
      const pScore = parseFloat(physics) || 0;
      const cScore = parseFloat(chemistry) || 0;
      const mScore = parseFloat(maths) || 0;

      const totalObtained = pScore + cScore + mScore;
      const totalMax = 220; // 70 + 70 + 80
      const overallPercent = Math.round((totalObtained / totalMax) * 1000) / 10;

      const prompt = `
You are an expert CBSE Class 12 Science academic counselor on the Rankify AI platform.
Analyze the student's CBSE Class 12 PCM Half-Yearly exam performance and generate a structured JSON recovery/improvement report.

Inputs:
- Physics Obtained: ${pScore} / 70
- Chemistry Obtained: ${cScore} / 70
- Mathematics Obtained: ${mScore} / 80
- Common Mistakes Checked: ${JSON.stringify(mistakes)}
- Marksheet File Uploaded: ${marksheetUploaded ? 'Yes' : 'No'}

Built-in Syllabus Context (STRICT REQUIREMENT: You MUST ONLY select or recommend chapters from this exact Half-Yearly syllabus):
- Physics (Max 70):
  1. Electric charges and fields
  2. Electrostatic potential and capacitance
  3. Current electricity
  4. Moving Charges and magnetism
  5. Magnetism and matter
  6. Electromagnetic induction
  7. Alternating current
  8. Electromagnetic wave

- Chemistry (Max 70):
  1. Solutions
  2. Electrochemistry
  3. Chemical kinetics
  4. D and f block
  5. Coordination compound

- Mathematics (Max 80):
  1. Inverse trigonometric functions
  2. Matrices
  3. Determinants
  4. Continuity and differentiability
  5. Application of derivatives
  6. Linear programming problem

Generate a JSON object strictly matching this schema:
{
  "percentage": ${overallPercent},
  "performanceLevel": "Outstanding" | "Very Good" | "Good" | "Satisfactory" | "Needs Improvement" | "Critical",
  "confidenceScore": number (0 to 100),
  "strengths": string[],
  "weaknesses": string[],
  "likelyWeakChapters": [
    { "chapterName": "string", "subject": "Physics" | "Chemistry" | "Mathematics", "reason": "string", "priority": "Critical" | "High" | "Medium" }
  ],
  "likelyStrongChapters": [
    { "chapterName": "string", "subject": "Physics" | "Chemistry" | "Mathematics", "reason": "string" }
  ],
  "boardPrediction": {
    "currentScore": number,
    "estimatedBoard": number,
    "targetScore": number,
    "potential": number,
    "timeline": "string"
  },
  "personalizedTasks": [
    { "id": "string", "taskTitle": "string", "subjectName": "Physics" | "Chemistry" | "Mathematics", "chapterName": "string", "allocatedMinutes": number, "priority": "High" | "Medium", "isCompleted": false, "status": "pending" }
  ]
}

Ensure all recommended chapters strictly come from the official list above. Provide highly descriptive, personalized, encouraging, and syllabus-aligned values based on the checked mistakes.
Return ONLY valid raw JSON. No markdown code blocks, no backticks.
`;

      let reportData;
      if (process.env.GEMINI_API_KEY) {
        const aiResponse = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: [{ text: prompt }],
          config: {
            responseMimeType: 'application/json',
          }
        });

        const rawText = aiResponse.text || '{}';
        // Clean markdown backticks if any
        const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        reportData = JSON.parse(cleanedText);
      } else {
        // Run highly refined local rule engine (guarantees local offline fallback)
        throw new Error("No Gemini API Key found in environment");
      }

      res.json({ success: true, analysis: reportData });
    } catch (err: any) {
      console.warn('[HalfYearly API] Generating with local expert diagnostics engine:', err.message || err);
      
      const pScore = parseFloat(req.body.physics) || 0;
      const cScore = parseFloat(req.body.chemistry) || 0;
      const mScore = parseFloat(req.body.maths) || 0;
      const mistakes = req.body.mistakes || [];

      const totalObtained = pScore + cScore + mScore;
      const totalMax = 220;
      const percent = Math.round((totalObtained / totalMax) * 100);

      const performanceLevel = percent >= 90 ? 'Outstanding' : percent >= 75 ? 'Very Good' : percent >= 60 ? 'Good' : percent >= 45 ? 'Satisfactory' : percent >= 33 ? 'Needs Improvement' : 'Critical';
      const confidenceScore = Math.max(15, Math.min(100, Math.round(percent * 0.95)));

      const likelyWeakChapters: any[] = [];
      const likelyStrongChapters: any[] = [];

      if (pScore / 70 < 0.6) {
        likelyWeakChapters.push({ chapterName: 'Current Electricity', subject: 'Physics', reason: 'Potentiometer derivations and Kirchhoff’s circuit numericals require reinforcement.', priority: 'Critical' });
        likelyWeakChapters.push({ chapterName: 'Alternating Current', subject: 'Physics', reason: 'LCR series resonance impedance calculations require practice.', priority: 'High' });
      } else {
        likelyStrongChapters.push({ chapterName: 'Electric Charges and Fields', subject: 'Physics', reason: 'Excellent Coulomb’s law and Gauss’s theorem grasp.' });
      }

      if (cScore / 70 < 0.6) {
        likelyWeakChapters.push({ chapterName: 'Electrochemistry', subject: 'Chemistry', reason: 'Nernst equation standard cell potential calculations show accuracy gap.', priority: 'Critical' });
        likelyWeakChapters.push({ chapterName: 'Chemical Kinetics', subject: 'Chemistry', reason: 'Arrhenius activation energy rate law integrations show time traps.', priority: 'High' });
      } else {
        likelyStrongChapters.push({ chapterName: 'Solutions', subject: 'Chemistry', reason: 'Strong understanding of colligative properties and van’t Hoff factors.' });
      }

      if (mScore / 80 < 0.6) {
        likelyWeakChapters.push({ chapterName: 'Continuity and differentiability', subject: 'Mathematics', reason: 'Chain rule differentiability proofs and logarithmic derivatives require structured practice.', priority: 'Critical' });
        likelyWeakChapters.push({ chapterName: 'Application of Derivatives', subject: 'Mathematics', reason: 'Maxima and minima rate of change real-world problems require active recall.', priority: 'High' });
      } else {
        likelyStrongChapters.push({ chapterName: 'Matrices', subject: 'Mathematics', reason: 'Accurate expansions and symmetric/skew-symmetric proofs verified.' });
      }

      const reportData = {
        percentage: percent,
        performanceLevel,
        confidenceScore,
        strengths: [
          `Solid fundamental concepts in ${pScore >= cScore && pScore >= mScore ? 'Physics' : cScore >= mScore ? 'Chemistry' : 'Mathematics'}.`,
          "Positive focus stamina shown on standard syllabus topics."
        ],
        weaknesses: [
          `Accuracy drop under test conditions, specifically in ${pScore < cScore && pScore < mScore ? 'Physics' : cScore < mScore ? 'Chemistry' : 'Mathematics'}.`,
          `Difficulties flagged: ${mistakes.join(', ') || 'Silly mistakes and formula recall gap'}`
        ],
        likelyWeakChapters,
        likelyStrongChapters,
        boardPrediction: {
          currentScore: percent,
          estimatedBoard: Math.min(98, percent + 12),
          targetScore: 95,
          potential: Math.max(5, 95 - percent),
          timeline: '4-Week Dynamic Spaced Recall & Question Sprint'
        },
        personalizedTasks: likelyWeakChapters.map((wc, idx) => ({
          id: `task_rec_hy_${idx}`,
          taskTitle: `Master ${wc.chapterName}: Solve 15 Board-Level Numericals`,
          subjectName: wc.subject,
          chapterName: wc.chapterName,
          allocatedMinutes: 45,
          priority: 'High',
          isCompleted: false,
          status: 'pending'
        }))
      };

      res.json({ success: true, analysis: reportData, isLocalFallback: true });
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
