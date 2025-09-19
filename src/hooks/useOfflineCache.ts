import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheConfig {
  key: string;
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  fallbackData?: any;
}

export function useOfflineCache<T>(config: CacheConfig) {
  const { key, ttl = 300000, fallbackData = null } = config;
  const [cachedData, setCachedData] = useState<T | null>(fallbackData);
  const [isStale, setIsStale] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load cached data when key changes
  useEffect(() => {
    if (key) {
      loadFromCache();
    }
  }, [key]);

  const loadFromCache = async () => {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (typeof parsed !== 'object' || parsed === null || 
            typeof parsed.timestamp !== 'number') {
          throw new Error('Invalid cache format');
        }
        const { data, timestamp } = parsed;
        const age = Date.now() - timestamp;
        
        setCachedData(data);
        setIsStale(age > ttl);
        
        console.log(`📦 Cache loaded for ${key}:`, {
          age: Math.round(age / 1000) + 's',
          isStale: age > ttl,
          dataSize: JSON.stringify(data).length,
          timestamp: new Date(timestamp).toISOString()
        });
      }
    } catch (error) {
      if (__DEV__) console.error(`❌ Cache load error for ${key}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToCache = useCallback(async (data: T) => {
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheEntry));
      setCachedData(data);
      setIsStale(false);
      
      console.log(`💾 Cache saved for ${key}:`, {
        dataSize: JSON.stringify(data).length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      if (__DEV__) console.error(`❌ Cache save error for ${key}:`, error);
    }
  }, [key]);

  const clearCache = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(key);
      setCachedData(fallbackData);
      setIsStale(false);
      if (__DEV__) console.log(`🗑️ Cache cleared for ${key}`);
    } catch (error) {
      if (__DEV__) console.error(`❌ Cache clear error for ${key}:`, error);
    }
  }, [key, fallbackData]);

  // Debug function to check all cache keys
  const debugCache = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.includes('user-library') || k.includes('discover_content'));
      if (__DEV__) console.log('🔍 All cache keys:', cacheKeys);
      
      for (const cacheKey of cacheKeys) {
        const value = await AsyncStorage.getItem(cacheKey);
        if (value) {
          const parsed = JSON.parse(value);
          console.log(`📋 Cache ${cacheKey}:`, {
            timestamp: new Date(parsed.timestamp).toISOString(),
            dataSize: JSON.stringify(parsed.data).length,
            age: Math.round((Date.now() - parsed.timestamp) / 1000) + 's'
          });
        }
      }
    } catch (error) {
      if (__DEV__) console.error('❌ Debug cache error:', error);
    }
  }, []);

  return {
    cachedData,
    isStale,
    isLoading,
    saveToCache,
    clearCache,
    loadFromCache,
    debugCache
  };
}
