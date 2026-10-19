import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  getIdTokenResult,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config';
import { UserProfile, UserRole } from '@/types/auth';
import { isIOSDevice, isStandalonePWA } from '@/utils/browser-compat';

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
 * Google Sign-in: uses popup on desktop browsers, and signInWithRedirect on mobile,
 * standalone home-screen PWAs, in-app browsers, or when popups are blocked.
 */
export async function loginWithGoogle(): Promise<UserProfile | null> {
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const isMobileOrInAppOrStandalone =
    isIOSDevice() ||
    isStandalonePWA() ||
    /Android|iPhone|iPad|iPod|Mobile|FBAN|FBAV|Instagram|Line|Wv|WebView/i.test(ua);

  if (isMobileOrInAppOrStandalone && !isIframe) {
    await signInWithRedirect(auth, googleProvider);
    return null;
  }

  try {
    const cred = await signInWithPopup(auth, googleProvider);
    return getOrCreateUserProfile(cred.user);
  } catch (err: unknown) {
    const rawMsg = err instanceof Error ? err.message : String(err);
    const code = (err as { code?: string })?.code || '';
    if (
      code === 'auth/popup-blocked' ||
      code === 'auth/operation-not-supported-in-this-environment' ||
      rawMsg.includes('auth/popup-blocked') ||
      rawMsg.includes('auth/operation-not-supported-in-this-environment')
    ) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw err;
  }
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
 * Subscribes to Firebase Auth state changes and resolves any pending OAuth redirect result
 */
export function subscribeToAuthState(
  onUserChanged: (user: UserProfile | null) => void
): () => void {
  getRedirectResult(auth)
    .then(async (result) => {
      if (result?.user) {
        const profile = await getOrCreateUserProfile(result.user);
        onUserChanged(profile);
      }
    })
    .catch((err) => {
      console.warn('[AuthService] Redirect result check notice:', err);
    });

  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        // Force refresh ID token result on authentication state resolving
        const idTokenResult = await getIdTokenResult(firebaseUser, true);
        const claims = idTokenResult.claims;
        const profile = await getOrCreateUserProfile(firebaseUser);

        // Auto detect admin or super_admin custom claims
        if (claims.admin === true || claims.role === 'super_admin') {
          profile.role = 'admin';
        }

        onUserChanged(profile);
      } catch (err) {
        console.warn('[AuthService] Claims or profile resolution failed:', err);
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
