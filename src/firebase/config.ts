import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Standard Firebase configuration supporting both Vite and Next.js environment conventions
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDc9i1_3S_BBcCTA9JIJtfXxeXu8mKjeOY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'rankify-4ed9c.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'rankify-4ed9c',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'rankify-4ed9c.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '165291523024',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:165291523024:web:bfbfa20af10fbc6b0117d5',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-2JFPZSFT7Y',
};

// Check if Firebase was already configured
let app: FirebaseApp;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.warn('Firebase initialization with standard config: using existing or fallback app instance', error);
    app = getApps()[0] || initializeApp({ ...firebaseConfig, projectId: 'rankify-web' });
  }
} else {
  app = getApp();
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { app, firebaseConfig };
