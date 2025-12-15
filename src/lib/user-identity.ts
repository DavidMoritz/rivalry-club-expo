import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteItemAsync, getItemAsync, setItemAsync } from 'expo-secure-store';

const UUID_KEYCHAIN_KEY = 'rivalryClubUserUuid';
const UUID_STORAGE_KEY = 'userUuid';
const FIRST_NAME_STORAGE_KEY = 'userFirstName';

// UUID generation constants
const HEX_BASE = 16;
const DISPLAY_NAME_ID_LENGTH = 5;

// Singleton lock to prevent race conditions when multiple components call getOrCreateUserUuid simultaneously
let uuidPromise: Promise<string> | null = null;

/**
 * Generates a UUID v4
 */
export function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    // biome-ignore lint/suspicious/noBitwiseOperators: Bitwise OR is intentional for UUID generation (floor to integer)
    const r = (Math.random() * HEX_BASE) | 0;
    // biome-ignore lint/suspicious/noBitwiseOperators: Bitwise AND/OR are intentional for UUID v4 variant bits
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(HEX_BASE);
  });
}

/**
 * Generates a display name from UUID (e.g., "Player_abc12")
 */
export function generateDisplayName(uuid: string): string {
  const shortId = uuid.replace(/-/g, '').substring(0, DISPLAY_NAME_ID_LENGTH);
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
export function getOrCreateUserUuid(): Promise<string> {
  // If a UUID operation is already in progress, wait for it
  if (uuidPromise) {
    return uuidPromise;
  }

  // Start a new UUID operation
  uuidPromise = (async () => {
    try {
      // Try AsyncStorage first (faster)
      let uuid = await AsyncStorage.getItem(UUID_STORAGE_KEY);

      if (uuid) {
        return uuid;
      }

      // Try Keychain (persists across reinstalls)
      uuid = await getItemAsync(UUID_KEYCHAIN_KEY);

      if (uuid) {
        // Restore to AsyncStorage for faster future access
        await AsyncStorage.setItem(UUID_STORAGE_KEY, uuid);
        return uuid;
      }

      // Generate new UUID
      uuid = generateUuid();

      // Store in both locations
      await Promise.all([
        setItemAsync(UUID_KEYCHAIN_KEY, uuid),
        AsyncStorage.setItem(UUID_STORAGE_KEY, uuid),
      ]);

      return uuid;
    } catch (error) {
      console.error(
        '[user-identity] ❌ Error getting/creating user UUID:',
        error
      );
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
      setItemAsync(UUID_KEYCHAIN_KEY, newUuid),
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
    uuid = await getItemAsync(UUID_KEYCHAIN_KEY);

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
    // Clear the promise lock
    uuidPromise = null;

    await Promise.all([
      deleteItemAsync(UUID_KEYCHAIN_KEY),
      AsyncStorage.removeItem(UUID_STORAGE_KEY),
      AsyncStorage.removeItem(FIRST_NAME_STORAGE_KEY), // Also clear firstName
    ]);
  } catch (error) {
    console.error('[user-identity] ❌ Error clearing stored UUID:', error);
    throw error;
  }
}

/**
 * Stores the user's first name locally.
 * Called when user updates their profile, so we never show "Player_${shortId}" again.
 */
export async function storeFirstName(firstName: string): Promise<void> {
  try {
    if (!firstName || firstName.trim() === '') {
      console.warn('[user-identity] Attempted to store empty firstName');
      return;
    }

    await AsyncStorage.setItem(FIRST_NAME_STORAGE_KEY, firstName.trim());
    console.log(
      '[user-identity] ✅ Stored firstName locally:',
      firstName.trim()
    );
  } catch (error) {
    console.error('[user-identity] ❌ Error storing firstName:', error);
    // Don't throw - this is not critical
  }
}

/**
 * Gets the stored first name from AsyncStorage.
 * Returns null if not found.
 */
export async function getStoredFirstName(): Promise<string | null> {
  try {
    const firstName = await AsyncStorage.getItem(FIRST_NAME_STORAGE_KEY);
    return firstName;
  } catch (error) {
    console.error('[user-identity] ❌ Error getting stored firstName:', error);
    return null;
  }
}

/**
 * Generates a display name from UUID (e.g., "Player_abc12")
 * This is used ONLY when creating a new anonymous user.
 * The DB User record is the single source of truth for names after that.
 */
export async function getDisplayName(uuid: string): Promise<string> {
  return generateDisplayName(uuid);
}
