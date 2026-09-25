import { getDocument, setDocument } from '@/firebase/firestore/client';
import { COLLECTIONS } from '@/firebase/firestore/collections';
import { UserProfile } from '@/types/auth';

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  return getDocument<UserProfile>(COLLECTIONS.USERS, uid);
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  await setDocument(COLLECTIONS.USERS, uid, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}
