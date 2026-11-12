import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

class StorageService {
  private memoryFallback: Map<string, string> = new Map();

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
          return;
        }
      } else {
        await SecureStore.setItemAsync(key, value);
        return;
      }
    } catch (e) {
      // fallback
    }
    this.memoryFallback.set(key, value);
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (e) {
      // fallback
    }
    return this.memoryFallback.get(key) || null;
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
          return;
        }
      } else {
        await SecureStore.deleteItemAsync(key);
        return;
      }
    } catch (e) {
      // fallback
    }
    this.memoryFallback.delete(key);
  }
}

export const storage = new StorageService();
