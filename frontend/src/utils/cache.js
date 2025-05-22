// Cache em memória
const memoryCache = new Map();

// Cache em localStorage
const STORAGE_KEY = 'atendimento_cache';
const CACHE_VERSION = '1.0';

class CacheManager {
  constructor() {
    this.memoryCache = memoryCache;
    this.storageKey = STORAGE_KEY;
    this.version = CACHE_VERSION;
    this.init();
  }

  init() {
    // Limpar cache antigo se a versão mudar
    const storedVersion = localStorage.getItem(`${this.storageKey}_version`);
    if (storedVersion !== this.version) {
      localStorage.removeItem(this.storageKey);
      localStorage.setItem(`${this.storageKey}_version`, this.version);
    }
  }

  // Salvar no cache
  async set(key, data, ttl = 5 * 60 * 1000) { // 5 minutos default
    const item = {
      data,
      timestamp: Date.now(),
      ttl
    };

    // Salvar em memória
    this.memoryCache.set(key, item);

    // Salvar no localStorage
    try {
      const storage = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
      storage[key] = item;
      localStorage.setItem(this.storageKey, JSON.stringify(storage));
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  }

  // Buscar do cache
  async get(key) {
    // Tentar memória primeiro
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && !this.isExpired(memoryItem)) {
      return memoryItem.data;
    }

    // Tentar localStorage
    try {
      const storage = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
      const item = storage[key];
      
      if (item && !this.isExpired(item)) {
        // Atualizar cache em memória
        this.memoryCache.set(key, item);
        return item.data;
      }
    } catch (error) {
      console.error('Erro ao ler do localStorage:', error);
    }

    return null;
  }

  // Verificar se item expirou
  isExpired(item) {
    return Date.now() - item.timestamp > item.ttl;
  }

  // Limpar cache
  clear() {
    this.memoryCache.clear();
    localStorage.removeItem(this.storageKey);
  }

  // Limpar item específico
  remove(key) {
    this.memoryCache.delete(key);
    try {
      const storage = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
      delete storage[key];
      localStorage.setItem(this.storageKey, JSON.stringify(storage));
    } catch (error) {
      console.error('Erro ao remover do localStorage:', error);
    }
  }
}

export const cacheManager = new CacheManager(); 