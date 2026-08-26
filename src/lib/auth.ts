'use client';

// ── Firebase Authentication Service ──
// Provides sign-in, sign-out, password reset, and auth state observation.
// Public self-registration is intentionally not exported; collaborators are created only by the admin flow.
// Collection: "usuarios" (with profile and access metadata; credentials stay in Firebase Authentication)

import { deleteApp, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  setPersistence,
  inMemoryPersistence,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp, type FieldValue } from 'firebase/firestore';
import { auth, db, firebaseConfig } from './firebase';

import { PageType } from './data';

// ── Firestore user document shape ──
export interface FirestoreUser {
  nome: string;
  email: string;
  cpf?: string;
  dataCadastro: Timestamp | FieldValue | null;
  ultimoLogin: Timestamp | FieldValue | null;
  settings?: any;
  mapconfig?: 'padrao' | 'satelite';
  ativo?: boolean;
  permissoes?: PageType[];
  cargo?: string;
}

// ── Collection name ──
const USUARIOS_COL = 'usuarios';

// ── Sign in with email + password ──
export async function signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

// ── Update ultimoLogin in Firestore ──
export async function updateUltimoLogin(uid: string): Promise<void> {
  try {
    await setDoc(doc(db, USUARIOS_COL, uid), {
      ultimoLogin: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('[Firebase] Falha ao atualizar ultimoLogin:', err);
    // Non-critical — don't throw
  }
}

// ── Default permissions for new users ──
const DEFAULT_PERMISSIONS: PageType[] = [
  'dashboard', 'fluxo', 'correspondencias', 'cadastros', 'lembretes', 
  'checklist-turno', 'protocolos-emergencia', 'empresas', 'ramais', 
  'avisos', 'lista-negra', 'achados-perdidos', 'configuracoes'
];

// ── Create a collaborator without changing the current admin session ──
// A secondary named Firebase app uses in-memory Auth persistence. The primary
// Auth instance remains signed in as the administrator throughout the flow.
export async function createUserAccountWithoutChangingSession(
  nome: string,
  email: string,
  password: string,
  cargo?: string,
  cpf?: string,
): Promise<FirebaseUser> {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error('Firebase não está configurado.');
  }

  const secondaryApp = initializeApp(firebaseConfig, `admin-user-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    await setPersistence(secondaryAuth, inMemoryPersistence);
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);

    try {
      await updateProfile(credential.user, { displayName: nome });
    } catch (err) {
      console.warn('[Firebase] Falha ao atualizar displayName do colaborador:', err);
    }

    const userDoc: FirestoreUser = {
      nome: nome.toUpperCase(),
      email,
      ...(cpf ? { cpf } : {}),
      dataCadastro: serverTimestamp(),
      ultimoLogin: null,
      ativo: true,
      permissoes: DEFAULT_PERMISSIONS,
      cargo,
    };
    await setDoc(doc(db, USUARIOS_COL, credential.user.uid), userDoc);

    return credential.user;
  } finally {
    await signOut(secondaryAuth).catch(() => undefined);
    await deleteApp(secondaryApp).catch(() => undefined);
  }
}

// ── Sign out ──
export async function signOutFirebase(): Promise<void> {
  await signOut(auth);
}

// ── Password reset email ──
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// ── Observe auth state changes (returns unsubscribe function) ──
export function onAuthChange(callback: (user: FirebaseUser | null) => void): () => void {
  // Handle case when Firebase is not configured
  if (!auth) {
    console.warn('[Firebase] Auth not configured, returning noop unsubscribe');
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// ── Fetch user profile from Firestore ──
// Returns null if document doesn't exist or if Firestore read fails
export async function fetchUserProfile(uid: string): Promise<FirestoreUser | null> {
  try {
    const snap = await getDoc(doc(db, USUARIOS_COL, uid));
    if (!snap.exists()) return null;
    return snap.data() as FirestoreUser;
  } catch (err) {
    console.warn('[Firebase] Falha ao buscar perfil do usuário:', err);
    return null; // Don't throw — allow login even if Firestore is unavailable
  }
}

// ── Create or update user profile in Firestore ──
// Used when the Firestore document doesn't exist yet (e.g., previous registration failed)
export async function ensureUserProfile(
  uid: string,
  data: { nome: string; email: string }
): Promise<void> {
  try {
    const existing = await getDoc(doc(db, USUARIOS_COL, uid));
    if (existing.exists()) {
      // Update ultimoLogin and ensure required fields exist
      const existingData = existing.data() as FirestoreUser;
      const updateData: Partial<FirestoreUser> = {
        ultimoLogin: serverTimestamp(),
      };
      // Add default values if they don't exist
      if (existingData.ativo === undefined) updateData.ativo = true;
      if (!existingData.permissoes) updateData.permissoes = DEFAULT_PERMISSIONS;
      
      await setDoc(doc(db, USUARIOS_COL, uid), updateData, { merge: true });
    } else {
      // Create full document
      const userDoc: FirestoreUser = {
        nome: data.nome.toUpperCase(),
        email: data.email,
        dataCadastro: serverTimestamp(),
        ultimoLogin: serverTimestamp(),
        ativo: true,
        permissoes: DEFAULT_PERMISSIONS,
      };
      await setDoc(doc(db, USUARIOS_COL, uid), userDoc);
    }
  } catch (err) {
    console.warn('[Firebase] Falha ao criar/atualizar perfil:', err);
  }
}

// ── Update user profile in Firestore ──
export async function updateUserProfile(
  uid: string,
  data: Partial<Pick<FirestoreUser, 'nome'>> & Record<string, any>
): Promise<void> {
  try {
    const updateData = { ...data };
    // Convert nome to uppercase if present
    if (updateData.nome) {
      updateData.nome = updateData.nome.toUpperCase();
    }
    await setDoc(doc(db, USUARIOS_COL, uid), updateData, { merge: true });

    // Also update Auth display name if nome changed
    if (updateData.nome && auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: updateData.nome });
    }
  } catch (err) {
    console.warn('[Firebase] Falha ao atualizar perfil:', err);
  }
}

// ── Update password in Firebase Authentication only ──
export async function updateUserPassword(newPassword: string): Promise<boolean> {
  if (!auth.currentUser) return false;
  try {
    await updatePassword(auth.currentUser, newPassword);
    return true;
  } catch (err) {
    console.warn('[Firebase] Falha ao alterar senha:', err);
    throw err;
  }
}

// ── Translate Firebase Auth error codes to Portuguese messages ──
export function getAuthErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    'auth/user-not-found': 'Usuário não encontrado. Verifique o email.',
    'auth/wrong-password': 'Senha incorreta. Tente novamente.',
    'auth/invalid-credential': 'Credenciais inválidas. Verifique email e senha.',
    'auth/email-already-in-use': 'Este email já está cadastrado.',
    'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
    'auth/invalid-email': 'Email inválido.',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
    'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
    'auth/user-disabled': 'Esta conta foi desativada.',
    'auth/operation-not-allowed': 'Operação não permitida.',
    'auth/invalid-login-credentials': 'Credenciais inválidas. Verifique email e senha.',
    'auth/default': 'Ocorreu um erro. Tente novamente.',
  };
  return messages[errorCode] || messages['auth/default'];
}

// Login-facing errors intentionally avoid revealing whether an account exists.
export function getLoginErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    'auth/user-not-found': 'Email ou senha inválidos.',
    'auth/wrong-password': 'Email ou senha inválidos.',
    'auth/invalid-credential': 'Email ou senha inválidos.',
    'auth/invalid-login-credentials': 'Email ou senha inválidos.',
    'auth/too-many-requests': 'Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.',
    'auth/network-request-failed': 'Não foi possível conectar. Verifique sua internet e tente novamente.',
    'auth/user-disabled': 'Não foi possível entrar. Verifique os dados e tente novamente.',
    'auth/multi-factor-auth-required': 'Não foi possível concluir a autenticação. Tente novamente ou entre em contato com o administrador.',
    'auth/operation-not-allowed': 'Não foi possível concluir a autenticação. Tente novamente ou entre em contato com o administrador.',
    'auth/default': 'Não foi possível entrar. Verifique os dados e tente novamente.',
  };
  return messages[errorCode] || messages['auth/default'];
}
