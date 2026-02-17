// DEPRECATED: este archivo ha sido refactorizado en capas de repositorio y servicio
// Usa lo siguiente en su lugar:
// - CoinRepository: src/core/repositories/CoinRepository.ts
// - CoinService: src/core/services/CoinService.ts
// - SqliteDatabase: src/infrastructure/database/SqliteDatabase.ts
// - Ver: src/config/container.ts para inyección de dependencias

import { container } from '../config/container';

/**
 * @deprecated Usa container.coinRepository en su lugar
 */
export const insertCoin = {
  run: (..._args: any[]) => {
    throw new Error('insertCoin is deprecated. Use container.coinService.createCoin() instead');
  }
};

/**
 * @deprecated Usa container.coinService.getAllCoinsForComparison() en su lugar
 */
export function getAllCoinsForComparison() {
  return container.coinService.getAllCoinsForComparison();
}

/**
 * @deprecated Usa container.coinService.getAllCoins() en su lugar
 */
export function getAllCoins() {
  const coinService = container.coinService;
  return {
    all: async () => {
      const { coins } = await coinService.getAllCoins();
      return coins;
    },
    get: async (limit: number = 50, offset: number = 0) => {
      const { coins } = await coinService.getAllCoins(limit, offset);
      return coins;
    },
    count: () => coinService.getCount()
  };
}

/**
 * @deprecated Usa container.coinService.getCoinById() en su lugar
 */
export const getCoinById = {
  get: (id: number) => container.coinService.getCoinById(id)
};

/**
 * @deprecated Use container.coinService.getCoinByHash() instead
 */
export const getCoinByHash = {
  get: (hash: string) => container.coinService.getCoinByHash(hash)
};

/**
 * @deprecated Use container.coinService.getCoinImage() instead
 */
export const getCoinImage = {
  get: (id: number) => container.coinService.getCoinImage(id)
};

/**
 * @deprecated Use container.coinService.updateCoin() instead
 */
export const updateCoin = {
  run: (..._args: any[]) => {
    throw new Error('updateCoin is deprecated. Use container.coinService.updateCoin() instead');
  }
};

/**
 * @deprecated Use container.coinService.deleteCoin() instead
 */
export const deleteCoin = {
  run: (id: number) => container.coinService.deleteCoin(id)
};

/**
 * @deprecated No longer needed
 */
export const insertUpload = {
  run: (..._args: any[]) => {
    // Seguimiento de carga removido para simplificación
  }
};

/**
 * @deprecated No longer needed
 */
export const getAllUploads = {
  all: () => []
};

/**
 * @deprecated Use container.coinRepository.invalidateCache() instead
 */
export function invalidateCoinsCache() {
  container.coinRepository.invalidateCache();
}

/**
 * @deprecated Use container.database instead
 */
export default {
  prepare: () => { throw new Error('Use container.database instead'); },
  exec: () => { throw new Error('Use container.database instead'); }
};