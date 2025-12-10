import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UUID_KEYCHAIN_KEY = 'rivalryClubUserUuid';
const UUID_STORAGE_KEY = 'userUuid';

// Singleton lock to prevent race conditions when multiple components call getOrCreateUserUuid simultaneously
let uuidPromise: Promise<string> | null = null;

/**
 * Generates a UUID v4
 */
export function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generates a display name from UUID (e.g., "Player_abc12")
 */
export function generateDisplayName(uuid: string): string {
  const shortId = uuid.replace(/-/g, '').substring(0, 5);
  return `Player_${shortId}`;
}

/**
 * Gets the user's UUID from Keychain or AsyncStorage.
 * If not found, generates a new one and stores it.
 *
 * Flow:
 * 1. Check AsyncStorage (fast)
 * 2. If not found, check Keychain (survives app uninstall)
 * 3. If not found, generate new UUID
 * 4. Store in both Keychain and AsyncStorage
 */
export async function getOrCreateUserUuid(): Promise<string> {
  // If a UUID operation is already in progress, wait for it
  if (uuidPromise) {
    console.log('[user-identity] ⏳ UUID operation already in progress, waiting...');
    return uuidPromise;
  }

  // Start a new UUID operation
  uuidPromise = (async () => {
    try {
      console.log('[user-identity] Getting or creating UUID...');

      // Try AsyncStorage first (faster)
      let uuid = await AsyncStorage.getItem(UUID_STORAGE_KEY);

      if (uuid) {
        console.log('[user-identity] ✅ Found UUID in AsyncStorage:', uuid);
        return uuid;
      }

      console.log('[user-identity] UUID not in AsyncStorage, checking Keychain...');

      // Try Keychain (persists across reinstalls)
      uuid = await SecureStore.getItemAsync(UUID_KEYCHAIN_KEY);

      if (uuid) {
        console.log('[user-identity] ✅ Found UUID in Keychain (survived app reinstall):', uuid);
        // Restore to AsyncStorage for faster future access
        await AsyncStorage.setItem(UUID_STORAGE_KEY, uuid);
        console.log('[user-identity] Restored UUID to AsyncStorage');
        return uuid;
      }

      console.log('[user-identity] UUID not found anywhere, generating new one...');

      // Generate new UUID
      uuid = generateUuid();
      console.log('[user-identity] 🆕 Generated new UUID:', uuid);

      // Store in both locations
      await Promise.all([
        SecureStore.setItemAsync(UUID_KEYCHAIN_KEY, uuid),
        AsyncStorage.setItem(UUID_STORAGE_KEY, uuid),
      ]);

      console.log('[user-identity] ✅ Saved new UUID to Keychain and AsyncStorage');

      return uuid;
    } catch (error) {
      console.error('[user-identity] ❌ Error getting/creating user UUID:', error);
      throw error;
    } finally {
      // Clear the lock after operation completes
      uuidPromise = null;
    }
  })();

  return uuidPromise;
}

/**
 * Updates the stored UUID (used when linking to existing Cognito account)
 */
export async function updateStoredUuid(newUuid: string): Promise<void> {
  try {
    await Promise.all([
      SecureStore.setItemAsync(UUID_KEYCHAIN_KEY, newUuid),
      AsyncStorage.setItem(UUID_STORAGE_KEY, newUuid),
    ]);
  } catch (error) {
    console.error('Error updating stored UUID:', error);
    throw error;
  }
}

/**
 * Gets the current stored UUID without generating a new one
 */
export async function getStoredUuid(): Promise<string | null> {
  try {
    // Try AsyncStorage first
    let uuid = await AsyncStorage.getItem(UUID_STORAGE_KEY);

    if (uuid) {
      return uuid;
    }

    // Try Keychain
    uuid = await SecureStore.getItemAsync(UUID_KEYCHAIN_KEY);

    if (uuid) {
      // Restore to AsyncStorage
      await AsyncStorage.setItem(UUID_STORAGE_KEY, uuid);
      return uuid;
    }

    return null;
  } catch (error) {
    console.error('Error getting stored UUID:', error);
    return null;
  }
}

/**
 * Clears the stored UUID (for testing or sign-out)
 */
export async function clearStoredUuid(): Promise<void> {
  try {
    console.log('[user-identity] 🗑️ Clearing stored UUID from Keychain and AsyncStorage...');

    // Clear the promise lock
    uuidPromise = null;

    await Promise.all([
      SecureStore.deleteItemAsync(UUID_KEYCHAIN_KEY),
      AsyncStorage.removeItem(UUID_STORAGE_KEY),
    ]);
    console.log('[user-identity] ✅ UUID cleared successfully');
  } catch (error) {
    console.error('[user-identity] ❌ Error clearing stored UUID:', error);
    throw error;
  }
}
