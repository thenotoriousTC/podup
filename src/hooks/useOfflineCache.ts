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

  // Load cached data on mount
  useEffect(() => {
    loadFromCache();
  }, [key]);

  const loadFromCache = async () => {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        setCachedData(data);
        setIsStale(age > ttl);
        
        console.log(`📦 Cache loaded for ${key}:`, {
          age: Math.round(age / 1000) + 's',
          isStale: age > ttl,
          dataSize: JSON.stringify(data).length
        });
      }
    } catch (error) {
      console.error(`❌ Cache load error for ${key}:`, error);
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
      console.error(`❌ Cache save error for ${key}:`, error);
    }
  }, [key]);

  const clearCache = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(key);
      setCachedData(fallbackData);
      setIsStale(false);
      console.log(`🗑️ Cache cleared for ${key}`);
    } catch (error) {
      console.error(`❌ Cache clear error for ${key}:`, error);
    }
  }, [key, fallbackData]);

  return {
    cachedData,
    isStale,
    isLoading,
    saveToCache,
    clearCache,
    loadFromCache
  };
}
