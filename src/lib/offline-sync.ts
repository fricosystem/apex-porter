import { get, set, keys, del } from 'idb-keyval';
import { Ronda } from './data';
import { addRonda } from './firestore-collections';

const RONDAS_PREFIX = 'offline_ronda_';

export async function saveRondaOffline(data: Omit<Ronda, 'id'>): Promise<string> {
  const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const rondaData = { ...data, isOfflineMode: true, tempId };
  await set(`${RONDAS_PREFIX}${tempId}`, rondaData);
  return tempId;
}

export async function getOfflineRondas(): Promise<any[]> {
  try {
    const allKeys = await keys();
    const rondaKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith(RONDAS_PREFIX));
    
    const rondas: any[] = [];
    for (const key of rondaKeys) {
      const data = await get(key);
      if (data) {
        rondas.push(data);
      }
    }
    return rondas;
  } catch (error) {
    console.error('Error getting offline rondas:', error);
    return [];
  }
}

export async function syncOfflineRondas(): Promise<number> {
  let syncedCount = 0;
  try {
    const allKeys = await keys();
    const rondaKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith(RONDAS_PREFIX));

    if (rondaKeys.length === 0) return 0;

    for (const key of rondaKeys) {
      const data = await get(key);
      if (data) {
        // Remove tracking properties before sending to Firestore
        const { isOfflineMode, tempId, ...cleanData } = data;
        
        try {
          await addRonda(cleanData as Omit<Ronda, 'id'>);
          await del(key);
          syncedCount++;
        } catch (syncError) {
          console.error(`Failed to sync ronda ${key}:`, syncError);
          // Stop syncing if we hit a network error while trying to sync
          break; 
        }
      }
    }
  } catch (error) {
    console.error('Error during offline sync:', error);
  }
  
  return syncedCount;
}
