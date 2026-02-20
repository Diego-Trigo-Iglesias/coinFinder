import type { ICoinRepository } from "../repositories/CoinRepository";
import type {
  Coin,
  CreateCoinData,
  UpdateCoinData,
} from "../domain/models/Coin";
import { NotFoundError } from "../../utils/errors/AppError";
import {
  validateTitle,
  validateDescription,
  validateRarity,
} from "../../utils/validation/CoinValidator";
import { logger } from "../../utils/logger/Logger";

//Servicio para lógica de negocio de monedas
export class CoinService {
  constructor(private coinRepository: ICoinRepository) {}

  //Crear una nueva moneda
  async createCoin(coinData: CreateCoinData, imageData: Buffer): Promise<Coin> {
    const validatedData: CreateCoinData = {
      ...coinData,
      name: validateTitle(coinData.name),
      description: validateDescription(coinData.description),
      rarity: validateRarity(coinData.rarity),
    };

    logger.info("Creando moneda", { name: validatedData.name });

    const coin = await this.coinRepository.create(validatedData, imageData);

    return coin;
  }

  // Obtener moneda por ID
  async getCoinById(id: number): Promise<Coin> {
    const coin = await this.coinRepository.findById(id);

    if (!coin) {
      throw new NotFoundError("Coin", id);
    }

    return coin;
  }

  // Obtener moneda por hash
  async getCoinByHash(hash: string): Promise<Coin | null> {
    return await this.coinRepository.findByHash(hash);
  }

  // Obtener todas las monedas con paginación
  async getAllCoins(
    limit?: number,
    offset?: number,
  ): Promise<{
    coins: Coin[];
    total: number;
  }> {
    const coins = await this.coinRepository.findAll(limit, offset);
    const total = await this.coinRepository.count();

    return { coins, total };
  }

  // Obtener todas las monedas para comparación (en cache)
  async getAllCoinsForComparison(): Promise<Coin[]> {
    return await this.coinRepository.getAllForComparison();
  }

  // Actualizar moneda
  async updateCoin(id: number, data: UpdateCoinData): Promise<Coin> {
    // Validar entrada
    const validatedData: UpdateCoinData = {
      ...data,
      name: data.name !== undefined ? validateTitle(data.name) : undefined,
      description:
        data.description !== undefined
          ? validateDescription(data.description)
          : undefined,
      rarity:
        data.rarity !== undefined ? validateRarity(data.rarity) : undefined,
    };

    const updated = await this.coinRepository.update(id, validatedData);

    if (!updated) {
      throw new NotFoundError("Moneda", id);
    }

    return this.getCoinById(id);
  }

  // Eliminar moneda
  async deleteCoin(id: number): Promise<void> {
    const deleted = await this.coinRepository.delete(id);

    if (!deleted) {
      throw new NotFoundError("Moneda", id);
    }

    logger.info("Moneda eliminada", { id });
  }

  // Obtener imagen de moneda
  async getCoinImage(id: number): Promise<Buffer> {
    const imageData = await this.coinRepository.getImage(id);

    if (!imageData) {
      throw new NotFoundError("Imagen de moneda", id);
    }

    return imageData;
  }

  // Obtener conteo de monedas
  async getCount(): Promise<number> {
    return await this.coinRepository.count();
  }
}
