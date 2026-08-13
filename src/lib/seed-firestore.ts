'use client';

// ── Seed Firestore with initial data ──
// Run this once to populate the database with the default cadastros data

import { db } from './firebase';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import {
  EMPRESAS_INICIAIS,
  DEPARTAMENTOS_INICIAIS,
  PESSOAS_INICIAIS,
  RAMAIS_INICIAIS,
} from './seed-data';
import type {
  Empresa,
  Departamento,
  Pessoa,
  Ramal,
} from './data';

type SeedCollection<T> = {
  name: string;
  data: T[];
};

const SEED_COLLECTIONS: SeedCollection<Empresa | Departamento | Pessoa | Ramal>[] = [
  { name: 'empresas', data: EMPRESAS_INICIAIS },
  { name: 'departamentos', data: DEPARTAMENTOS_INICIAIS },
  { name: 'pessoas', data: PESSOAS_INICIAIS },
  { name: 'ramais', data: RAMAIS_INICIAIS },
];

export async function seedFirestore(): Promise<{
  success: boolean;
  results: Record<string, { added: number; skipped: number }>;
  error?: string;
}> {
  const results: Record<string, { added: number; skipped: number }> = {};

  try {
    for (const col of SEED_COLLECTIONS) {
      const existing = await getDocs(collection(db, col.name));
      const existingIds = new Set(existing.docs.map((d) => d.id));

      let added = 0;
      let skipped = 0;

      for (const item of col.data) {
        const { id, ...data } = item as unknown as { id: string; [key: string]: unknown };
        if (existingIds.has(id)) {
          skipped++;
        } else {
          await setDoc(doc(db, col.name, id), data);
          added++;
        }
      }

      results[col.name] = { added, skipped };
    }

    return { success: true, results };
  } catch (err: any) {
    console.error('[Seed] Error:', err);
    return { success: false, results, error: err.message || 'Erro ao popular banco de dados' };
  }
}
