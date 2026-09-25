/**
 * Formats Firebase Auth error codes into clear, user-friendly messages
 */
export function formatAuthError(error: unknown): string {
  if (!error) return 'An unexpected error occurred. Please try again.';
  const rawMsg = error instanceof Error ? error.message : String(error);

  if (
    rawMsg.includes('auth/invalid-credential') ||
    rawMsg.includes('auth/wrong-password') ||
    rawMsg.includes('auth/user-not-found')
  ) {
    return 'Invalid email or password. If you do not have an account yet, please click "Sign Up for Free".';
  }

  if (rawMsg.includes('auth/email-already-in-use')) {
    return 'An account with this email already exists. Please switch to "Sign In" with your password or use Google.';
  }

  if (rawMsg.includes('auth/weak-password')) {
    return 'Password is too weak. Please use at least 6 characters.';
  }

  if (rawMsg.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.';
  }

  if (rawMsg.includes('auth/operation-not-allowed')) {
    return 'Email/Password or Google provider is not enabled in Firebase Console. Please go to Firebase Console > Authentication > Sign-in method and enable the provider.';
  }

  if (rawMsg.includes('auth/unauthorized-domain')) {
    return 'This domain is not authorized for Firebase Auth. Please add this domain to Firebase Console > Authentication > Settings > Authorized domains.';
  }

  if (rawMsg.includes('auth/popup-closed-by-user')) {
    return 'Google sign-in popup was closed before completing.';
  }

  if (rawMsg.includes('auth/popup-blocked')) {
    return 'Google sign-in popup was blocked by your browser. Please allow popups for this site.';
  }

  if (rawMsg.includes('auth/too-many-requests')) {
    return 'Too many failed attempts. Access is temporarily disabled. Please reset your password or try again later.';
  }

  if (rawMsg.includes('auth/network-request-failed')) {
    return 'Network request failed. Please check your internet connection and try again.';
  }

  if (rawMsg.includes('auth/api-key-not-valid') || rawMsg.includes('auth/invalid-api-key')) {
    return 'Firebase API key is invalid or not yet configured.';
  }

  // Strip prefix "Firebase: Error (auth/...)" if remaining
  const cleaned = rawMsg
    .replace(/^Firebase:\s*/i, '')
    .replace(/^Error\s*\((auth\/[^)]+)\)\.?/i, '$1');

  return cleaned || 'Authentication failed. Please try again.';
}
