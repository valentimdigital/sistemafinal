import { useState, useEffect, useCallback } from 'react';
import { cacheManager } from '../utils/cache';

export function useCache(key, fetchFn, options = {}) {
  const {
    ttl = 5 * 60 * 1000, // 5 minutos
    refreshInterval = null, // null = não atualiza automaticamente
    immediate = true // true = carrega imediatamente
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (force = false) => {
    try {
      setLoading(true);
      setError(null);

      // Tentar cache primeiro se não for forçado
      if (!force) {
        const cachedData = await cacheManager.get(key);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return;
        }
      }

      // Buscar dados frescos
      const freshData = await fetchFn();
      
      // Salvar no cache
      await cacheManager.set(key, freshData, ttl);
      
      setData(freshData);
    } catch (err) {
      setError(err);
      console.error(`Erro ao buscar dados para ${key}:`, err);
    } finally {
      setLoading(false);
    }
  }, [key, fetchFn, ttl]);

  // Carregar dados inicialmente
  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate, fetchData]);

  // Configurar atualização automática
  useEffect(() => {
    if (refreshInterval) {
      const interval = setInterval(() => {
        fetchData(true); // Força atualização
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
    clearCache: () => cacheManager.remove(key)
  };
} 