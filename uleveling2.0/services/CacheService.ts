import AsyncStorage from '@react-native-async-storage/async-storage';

// Interface for the structure stored in AsyncStorage
interface CacheItem<T> {
  data: T;
  expiresAt: number; // Store expiry timestamp (milliseconds since epoch)
}

class CacheService {
  /**
   * Retrieves a value from AsyncStorage, checking its expiry.
   * @param key The key to retrieve.
   * @returns The parsed data if found and not expired, or null otherwise.
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const rawValue = await AsyncStorage.getItem(key);
      if (rawValue === null) {
        return null; // Not found
      }

      const cacheItem = JSON.parse(rawValue) as CacheItem<T>;

      // Check for expiry
      if (Date.now() > cacheItem.expiresAt) {
        console.log(`[CacheService] Cache expired for key "${key}". Removing.`);
        // Optionally remove the expired item asynchronously
        AsyncStorage.removeItem(key).catch(err => console.error(`[CacheService] Failed to remove expired item for key "${key}":`, err));
        return null; // Expired
      }

      // Not expired, return the data
      return cacheItem.data;

    } catch (error) {
      console.error(`[CacheService] Error getting item with key "${key}":`, error);
      return null; // Return null on any error (parsing, etc.)
    }
  }

  /**
   * Stores a value in AsyncStorage with a Time-To-Live (TTL).
   * @param key The key to store the value under.
   * @param value The value to store.
   * @param ttlSeconds The time-to-live in seconds. Defaults to infinity (effectively).
   */
  static async set<T>(key: string, value: T, ttlSeconds: number = Number.MAX_SAFE_INTEGER): Promise<void> {
    try {
      const expiresAt = ttlSeconds === Number.MAX_SAFE_INTEGER
        ? Number.MAX_SAFE_INTEGER // Store a very large number for effectively no expiry
        : Date.now() + ttlSeconds * 1000; // Calculate expiry timestamp

      const cacheItem: CacheItem<T> = {
        data: value,
        expiresAt: expiresAt,
      };

      const stringValue = JSON.stringify(cacheItem);
      await AsyncStorage.setItem(key, stringValue);
    } catch (error) {
      console.error(`[CacheService] Error setting item with key "${key}":`, error);
    }
  }

  /**
   * Removes a value from AsyncStorage.
   * @param key The key to remove.
   */
  static async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`[CacheService] Error removing item with key "${key}":`, error);
    }
  }
}

export default CacheService; 