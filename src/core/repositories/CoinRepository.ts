import type { Coin, CreateCoinData, UpdateCoinData } from '../domain/models/Coin';
import type { IDatabase } from '../../infrastructure/database/SqliteDatabase';
import type { ICache } from '../../infrastructure/cache/InMemoryCache';
import { DatabaseError, NotFoundError } from '../../utils/errors/AppError';
import { logger } from '../../utils/logger/Logger';

/**
 * Interfaz de repositorio para acceso a datos de monedas
 */
export interface ICoinRepository {
    create(coinData: CreateCoinData, imageData: Buffer): Promise<Coin>;
    findById(id: number): Promise<Coin | null>;
    findByHash(hash: string): Promise<Coin | null>;
    findAll(limit?: number, offset?: number): Promise<Coin[]>;
    update(id: number, data: UpdateCoinData): Promise<boolean>;
    delete(id: number): Promise<boolean>;
    count(): Promise<number>;
    getAllForComparison(): Promise<Coin[]>;
    getImage(id: number): Promise<Buffer | null>;
    invalidateCache(): void;
}

/**
 * Implementación SQLite del repositorio de monedas
 */
export class CoinRepository implements ICoinRepository {
    private static readonly CACHE_KEY = 'all_coins';
    private db: IDatabase;
    private cache: ICache<Coin[]>;

    constructor(database: IDatabase, cache: ICache<Coin[]>) {
        this.db = database;
        this.cache = cache;
    }

    async create(coinData: CreateCoinData, imageData: Buffer): Promise<Coin> {
        try {
            const stmt = await this.db.prepare(`
        INSERT INTO coins (
          name, description, image_data, hash, year, coin_type, mint, 
          approximate_value, rarity, country, denomination
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

            const result = await stmt.runAsync(
                coinData.name,
                coinData.description,
                imageData,
                coinData.hash,
                coinData.year || null,
                coinData.coinType || null,
                coinData.mint || null,
                coinData.approximateValue || null,
                coinData.rarity,
                coinData.country || null,
                coinData.denomination || null
            );

            this.invalidateCache();

            const id = result.lastInsertRowid as number;
            logger.info('Moneda creada', { id, hash: coinData.hash });

            return {
                id,
                ...coinData,
                dateAdded: new Date()
            };
        } catch (error) {
            logger.error('No se pudo crear moneda', { error, coinData });
            throw new DatabaseError('Failed to create coin', error);
        }
    }

    async findById(id: number): Promise<Coin | null> {
        try {
            const stmt = await this.db.prepare('SELECT * FROM coins WHERE id = ?');
            const row = await stmt.getAsync(id) as any;

            if (!row) {
                return null;
            }

            return this.mapRowToCoin(row);
        } catch (error) {
            logger.error('No se pudo encontrar moneda por ID', { error, id });
            throw new DatabaseError('No se pudo encontrar moneda', error);
        }
    }

    async findByHash(hash: string): Promise<Coin | null> {
        try {
            const stmt = await this.db.prepare('SELECT * FROM coins WHERE hash = ?');
            const row = await stmt.getAsync(hash) as any;

            if (!row) {
                return null;
            }

            return this.mapRowToCoin(row);
        } catch (error) {
            logger.error('No se pudo encontrar moneda por hash', { error, hash });
            throw new DatabaseError('No se pudo encontrar moneda', error);
        }
    }

    async findAll(limit = 50, offset = 0): Promise<Coin[]> {
        try {
            const stmt = await this.db.prepare(`
        SELECT id, name, description, hash, year, coin_type, mint, 
               approximate_value, rarity, country, denomination, date_added
        FROM coins 
        ORDER BY date_added DESC 
        LIMIT ? OFFSET ?
      `);

            const rows = await stmt.allAsync(limit, offset) as any[];
            return rows.map(row => this.mapRowToCoin(row));
        } catch (error) {
            logger.error('No se pudo encontrar todas las monedas', { error, limit, offset });
            throw new DatabaseError('No se pudo encontrar monedas', error);
        }
    }

    async update(id: number, data: UpdateCoinData): Promise<boolean> {
        try {
            const stmt = await this.db.prepare(`
        UPDATE coins 
        SET name = ?, description = ?, year = ?, coin_type = ?, mint = ?, 
            approximate_value = ?, rarity = ?, country = ?, denomination = ?
        WHERE id = ?
      `);

            const result = await stmt.runAsync(
                data.name,
                data.description,
                data.year || null,
                data.coinType || null,
                data.mint || null,
                data.approximateValue || null,
                data.rarity,
                data.country || null,
                data.denomination || null,
                id
            );

            this.invalidateCache();

            const updated = result.changes > 0;
            if (updated) {
                logger.info('Moneda actualizada', { id });
            }

            return updated;
        } catch (error) {
            logger.error('No se pudo actualizar moneda', { error, id, data });
            throw new DatabaseError('No se pudo actualizar moneda', error);
        }
    }

    async delete(id: number): Promise<boolean> {
        try {
            const stmt = await this.db.prepare('DELETE FROM coins WHERE id = ?');
            const result = await stmt.runAsync(id);

            this.invalidateCache();

            const deleted = result.changes > 0;
            if (deleted) {
                logger.info('Moneda eliminada', { id });
            }

            return deleted;
        } catch (error) {
            logger.error('No se pudo eliminar moneda', { error, id });
            throw new DatabaseError('No se pudo eliminar moneda', error);
        }
    }

    async count(): Promise<number> {
        try {
            const stmt = await this.db.prepare('SELECT COUNT(*) as count FROM coins');
            const result = await stmt.getAsync() as any;
            return result.count;
        } catch (error) {
            logger.error('No se pudo contar monedas', { error });
            throw new DatabaseError('No se pudo contar monedas', error);
        }
    }

    async getAllForComparison(): Promise<Coin[]> {
        const cached = this.cache.get(CoinRepository.CACHE_KEY);
        if (cached) {
            logger.debug('Devolviendo monedas caché para comparación');
            return cached;
        }

        try {
            const stmt = await this.db.prepare(`
        SELECT id, name, description, hash, year, coin_type, mint, 
               approximate_value, rarity, country, denomination, date_added
        FROM coins
      `);

            const rows = await stmt.allAsync() as any[];
            const coins = rows.map(row => this.mapRowToCoin(row));

            this.cache.set(CoinRepository.CACHE_KEY, coins);
            logger.debug('Monedas caché para comparación', { count: coins.length });

            return coins;
        } catch (error) {
            logger.error('No se pudo obtener todas las monedas para comparación', { error });
            throw new DatabaseError('No se pudo obtener monedas para comparación', error);
        }
    }

    async getImage(id: number): Promise<Buffer | null> {
        try {
            const stmt = await this.db.prepare('SELECT image_data FROM coins WHERE id = ?');
            const row = await stmt.getAsync(id) as any;

            if (!row || !row.image_data) {
                return null;
            }

            return row.image_data;
        } catch (error) {
            logger.error('No se pudo obtener imagen de moneda', { error, id });
            throw new DatabaseError('No se pudo obtener imagen de moneda', error);
        }
    }

    invalidateCache(): void {
        this.cache.invalidate(CoinRepository.CACHE_KEY);
        logger.debug('Caché de monedas invalidado');
    }

    private mapRowToCoin(row: any): Coin {
        return {
            id: row.id,
            name: row.name,
            description: row.description || '',
            hash: row.hash,
            year: row.year,
            coinType: row.coin_type,
            mint: row.mint,
            approximateValue: row.approximate_value,
            rarity: row.rarity,
            country: row.country,
            denomination: row.denomination,
            dateAdded: new Date(row.date_added)
        };
    }
}
