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
