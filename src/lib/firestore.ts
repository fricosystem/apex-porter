'use client';

// ── Generic Firestore CRUD Helpers ──
// Reusable functions for all Firestore collections

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  type QueryConstraint,
  type DocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

// ── Get all documents from a collection ──
export async function getCollection<T>(path: string): Promise<T[]> {
  const snap = await getDocs(collection(db, path));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
}

// ── Get a single document by ID ──
export async function getDocument<T>(path: string, id: string): Promise<T | null> {
  const snap = await getDoc(doc(db, path, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as T;
}

// ── Helper to automatically convert string fields to uppercase ──
const DONT_UPPERCASE_KEYS = new Set([
  'id',
  'categoria',
  'status',
  'tipo',
  'gravidade',
  'prioridade',
  'turno',
  'email',
  'senha',
  'fotoUrl',
  'foto',
  'assinatura',
  'assinaturaColaborador',
  'checklistId',
  'inspecaoId',
  'rondaId',
  'protocoloId',
  'registroFluxoId',
  'versaoAnteriorId',
]);

function transformToUpperCase<T>(obj: T): T {
  if (typeof obj === 'string') {
    return obj.toUpperCase() as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => transformToUpperCase(item)) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    if (obj instanceof Date || 'toDate' in (obj as any) || '_methodName' in (obj as any)) {
      return obj;
    }
    const newObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (DONT_UPPERCASE_KEYS.has(key)) {
        newObj[key] = value;
      } else {
        newObj[key] = transformToUpperCase(value);
      }
    }
    return newObj as unknown as T;
  }
  return obj;
}

// ── Add a document with auto-generated ID ──
export async function addDocument<T extends Record<string, unknown>>(
  path: string,
  data: T
): Promise<string> {
  const transformed = transformToUpperCase(data);
  const ref = await addDoc(collection(db, path), transformed);
  return ref.id;
}

// ── Set a document with a specific ID (create or overwrite) ──
export async function setDocument<T extends Record<string, unknown>>(
  path: string,
  id: string,
  data: T
): Promise<void> {
  const transformed = transformToUpperCase(data);
  await setDoc(doc(db, path, id), transformed);
}

// ── Update specific fields of a document (merge) ──
export async function updateDocument<T extends Record<string, unknown>>(
  path: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  const transformed = transformToUpperCase(data);
  await updateDoc(doc(db, path, id), transformed as Record<string, unknown>);
}

// ── Delete a document ──
export async function deleteDocument(path: string, id: string): Promise<void> {
  await deleteDoc(doc(db, path, id));
}

// ── Subscribe to an entire collection (real-time) ──
export function subscribeCollection<T>(
  path: string,
  callback: (data: T[]) => void,
  ...constraints: QueryConstraint[]
): Unsubscribe {
  const q = constraints.length > 0 ? query(collection(db, path), ...constraints) : collection(db, path);
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
    callback(items);
  });
}

// ── Subscribe to a single document (real-time) ──
export function subscribeDocument<T>(
  path: string,
  id: string,
  callback: (data: T | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, path, id), (snap) => {
    if (!snap.exists()) {
      callback(null);
    } else {
      callback({ id: snap.id, ...snap.data() } as T);
    }
  });
}

// ── Query a collection with filters ──
export async function queryCollection<T>(
  path: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const q = query(collection(db, path), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
}

// ── Re-export Firestore utilities for use in collection-specific files ──
export {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  type QueryConstraint,
  type Unsubscribe,
};
