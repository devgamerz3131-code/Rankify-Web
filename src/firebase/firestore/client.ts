import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  QueryConstraint,
  DocumentData,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from '../config';
import { OperationType, handleFirestoreError } from '../errors';

/**
 * Type-safe, hardened getDoc with structured error propagation
 */
export async function getDocument<T = DocumentData>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  const path = `${collectionName}/${docId}`;
  try {
    const docRef = doc(db, collectionName, docId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as T;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path, auth.currentUser);
  }
}

/**
 * Type-safe setDoc with structured error propagation
 */
export async function setDocument<T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> {
  const path = `${collectionName}/${docId}`;
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path, auth.currentUser);
  }
}

/**
 * Type-safe updateDoc with structured error propagation
 */
export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>
): Promise<void> {
  const path = `${collectionName}/${docId}`;
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path, auth.currentUser);
  }
}

/**
 * Type-safe deleteDoc with structured error propagation
 */
export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  const path = `${collectionName}/${docId}`;
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path, auth.currentUser);
  }
}

/**
 * Query documents with structured error propagation
 */
export async function queryDocuments<T = DocumentData>(
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const q = query(colRef, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionName, auth.currentUser);
  }
}

/**
 * Realtime listener with mandatory error callback
 */
export function subscribeToDocument<T = DocumentData>(
  collectionName: string,
  docId: string,
  onData: (data: T | null) => void
): Unsubscribe {
  const path = `${collectionName}/${docId}`;
  const docRef = doc(db, collectionName, docId);
  return onSnapshot(
    docRef,
    (snap) => {
      onData(snap.exists() ? (snap.data() as T) : null);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path, auth.currentUser);
    }
  );
}
