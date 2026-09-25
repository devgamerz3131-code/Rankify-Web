import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config';
import { UserProfile, UserRole } from '@/types/auth';

/**
 * Fetches user profile from Firestore, creating one if it does not exist yet.
 */
export async function getOrCreateUserProfile(
  user: FirebaseUser,
  additionalData?: Partial<UserProfile>
): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
  } catch (error) {
    console.warn('Could not read existing profile from Firestore, creating default:', error);
  }

  const newProfile: UserProfile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || additionalData?.displayName || 'Student',
    photoURL: user.photoURL,
    role: (additionalData?.role as UserRole) || 'student',
    cbseClass: 12,
    classNumber: 12,
    board: 'CBSE',
    stream: 'science-pcm',
    school: additionalData?.school || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(userRef, newProfile);
  } catch (err) {
    console.warn('Could not persist new user profile to Firestore:', err);
  }

  return newProfile;
}

/**
 * Login with Email and Password
 */
export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return getOrCreateUserProfile(cred.user);
}

/**
 * Register with Email and Password
 */
export async function registerWithEmail(
  email: string,
  pass: string,
  displayName: string,
  role: UserRole = 'student',
  cbseClass: number = 12
): Promise<UserProfile> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }
  return getOrCreateUserProfile(cred.user, { displayName, role, cbseClass });
}

/**
 * Google Sign-in with popup
 */
export async function loginWithGoogle(): Promise<UserProfile> {
  const cred = await signInWithPopup(auth, googleProvider);
  return getOrCreateUserProfile(cred.user);
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Logout
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribes to Firebase Auth state changes
 */
export function subscribeToAuthState(
  onUserChanged: (user: UserProfile | null) => void
): () => void {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const profile = await getOrCreateUserProfile(firebaseUser);
        onUserChanged(profile);
      } catch {
        onUserChanged({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || 'Student',
          photoURL: firebaseUser.photoURL,
          role: 'student',
        });
      }
    } else {
      onUserChanged(null);
    }
  });
}
