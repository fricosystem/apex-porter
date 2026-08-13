'use client';

// ── Firebase Storage Helpers ──
// Upload e gerenciamento de imagens das rondas

import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Faz upload de uma foto (base64 data URL) de um ponto de ronda para o Storage.
 * Organização de pastas:
 *   rondas/{ano}/{mes}/{rondaId}/{pontoId}_{timestamp}.jpg
 *
 * @returns a URL pública (download URL) da imagem enviada.
 */
export async function uploadFotoRonda(params: {
  rondaId: string;
  pontoId: string;
  data: string; // YYYY-MM-DD da ronda
  base64: string; // data URL (image/...)
}): Promise<string> {
  const { rondaId, pontoId, data, base64 } = params;

  // Deriva ano/mes a partir da data da ronda (fallback para data atual)
  const [ano, mes] = data && data.includes('-') ? data.split('-') : [
    String(new Date().getFullYear()),
    String(new Date().getMonth() + 1).padStart(2, '0'),
  ];

  const timestamp = Date.now();
  const path = `rondas/${ano}/${mes}/${rondaId}/${pontoId}_${timestamp}.jpg`;
  const storageRef = ref(storage, path);

  // uploadString aceita data URL diretamente com o formato 'data_url'
  await uploadString(storageRef, base64, 'data_url');
  const url = await getDownloadURL(storageRef);
  return url;
}

/**
 * Remove uma foto do Storage a partir da sua download URL.
 */
export async function deleteFotoRonda(downloadUrl: string): Promise<void> {
  try {
    const storageRef = ref(storage, downloadUrl);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn('[Storage] Falha ao remover foto:', err);
  }
}
