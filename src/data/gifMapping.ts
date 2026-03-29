// GIF storage — Firebase database
// Efficient implementation using exercise_id as document ID

import { getGifMapping as getGifMappingFromDb, setGifMapping, clearGifMappingsCache } from '../firebase';

export async function getGifUrl(exerciseId: string): Promise<string | null> {
  try {
    const mapping = await getGifMappingFromDb(exerciseId);
    return mapping?.gif_url || null;
  } catch (err) {
    console.error('Error getting GIF URL:', err);
    return null;
  }
}

export async function setGifUrl(exerciseId: string, url: string): Promise<void> {
  try {
    await setGifMapping(exerciseId, url);
    // Clear cache to ensure next read gets fresh data
    clearGifMappingsCache();
  } catch (err) {
    console.error('Error setting GIF URL:', err);
    throw err; // Re-throw so UI can show error
  }
}

export async function removeGifUrl(exerciseId: string): Promise<void> {
  try {
    await setGifMapping(exerciseId, '');
    clearGifMappingsCache();
  } catch (err) {
    console.error('Error removing GIF URL:', err);
  }
}
