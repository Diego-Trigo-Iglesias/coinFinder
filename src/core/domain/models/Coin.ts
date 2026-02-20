/**
 * Modelo de dominio central para una entidad Moneda
 */
export interface Coin {
  id: number;
  name: string;
  description: string;
  hash: string;
  year?: string;
  coinType?: string;
  mint?: string;
  approximateValue?: string;
  rarity: number;
  country?: string;
  denomination?: string;
  dateAdded: Date;
}

/**
 * Metadatos extraídos del análisis de moneda
 */
export interface CoinMetadata {
  year?: string;
  coinType?: string;
  mint?: string;
  approximateValue?: string;
  rarity: number;
  country?: string;
  denomination?: string;
}

/**
 * Datos requeridos para crear una nueva moneda
 */
export type CreateCoinData = Omit<Coin, "id" | "dateAdded">;

/**
 * Datos que se pueden actualizar en una moneda existente
 */
export type UpdateCoinData = Partial<Omit<Coin, "id" | "hash" | "dateAdded">>;
