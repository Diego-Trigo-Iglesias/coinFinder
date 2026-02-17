import type { Coin, CreateCoinData, UpdateCoinData } from '../domain/models/Coin';
import type { IDatabase } from '../../infrastructure/database/SqliteDatabase';
import type { ICache } from '../../infrastructure/cache/InMemoryCache';
import { DatabaseError, NotFoundError } from '../../utils/errors/AppError';
import { logger } from '../../utils/logger/Logger';

/**
 * Interfaz de repositorio para acceso a datos de monedas
 */
export interface ICoinRepository {
    create(coinData: CreateCoinData, imageData: Buffer): Coin;
    findById(id: number): Coin | null;
    findByHash(hash: string): Coin | null;
    findAll(limit?: number, offset?: number): Coin[];
    update(id: number, data: UpdateCoinData): boolean;
    delete(id: number): boolean;
    count(): number;
    getAllForComparison(): Coin[];
    getImage(id: number): Buffer | null;
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

    create(coinData: CreateCoinData, imageData: Buffer): Coin {
        try {
            const stmt = this.db.prepare(`
        INSERT INTO coins (
          name, description, image_data, hash, year, coin_type, mint, 
          approximate_value, rarity, country, denomination
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

            const result = stmt.run(
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

    findById(id: number): Coin | null {
        try {
            const stmt = this.db.prepare('SELECT * FROM coins WHERE id = ?');
            const row = stmt.get(id) as any;

            if (!row) {
                return null;
            }

            return this.mapRowToCoin(row);
        } catch (error) {
            logger.error('No se pudo encontrar moneda por ID', { error, id });
            throw new DatabaseError('No se pudo encontrar moneda', error);
        }
    }

    findByHash(hash: string): Coin | null {
        try {
            const stmt = this.db.prepare('SELECT * FROM coins WHERE hash = ?');
            const row = stmt.get(hash) as any;

            if (!row) {
                return null;
            }

            return this.mapRowToCoin(row);
        } catch (error) {
            logger.error('No se pudo encontrar moneda por hash', { error, hash });
            throw new DatabaseError('No se pudo encontrar moneda', error);
        }
    }

    findAll(limit = 50, offset = 0): Coin[] {
        try {
            const stmt = this.db.prepare(`
        SELECT id, name, description, hash, year, coin_type, mint, 
               approximate_value, rarity, country, denomination, date_added
        FROM coins 
        ORDER BY date_added DESC 
        LIMIT ? OFFSET ?
      `);

            const rows = stmt.all(limit, offset) as any[];
            return rows.map(row => this.mapRowToCoin(row));
        } catch (error) {
            logger.error('No se pudo encontrar todas las monedas', { error, limit, offset });
            throw new DatabaseError('No se pudo encontrar monedas', error);
        }
    }

    update(id: number, data: UpdateCoinData): boolean {
        try {
            const stmt = this.db.prepare(`
        UPDATE coins 
        SET name = ?, description = ?, year = ?, coin_type = ?, mint = ?, 
            approximate_value = ?, rarity = ?, country = ?, denomination = ?
        WHERE id = ?
      `);

            const result = stmt.run(
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

    delete(id: number): boolean {
        try {
            const stmt = this.db.prepare('DELETE FROM coins WHERE id = ?');
            const result = stmt.run(id);

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

    count(): number {
        try {
            const stmt = this.db.prepare('SELECT COUNT(*) as count FROM coins');
            const result = stmt.get() as any;
            return result.count;
        } catch (error) {
            logger.error('No se pudo contar monedas', { error });
            throw new DatabaseError('No se pudo contar monedas', error);
        }
    }

    getAllForComparison(): Coin[] {
        const cached = this.cache.get(CoinRepository.CACHE_KEY);
        if (cached) {
            logger.debug('Devolviendo monedas caché para comparación');
            return cached;
        }

        try {
            const stmt = this.db.prepare(`
        SELECT id, name, description, hash, year, coin_type, mint, 
               approximate_value, rarity, country, denomination, date_added
        FROM coins
      `);

            const rows = stmt.all() as any[];
            const coins = rows.map(row => this.mapRowToCoin(row));

            this.cache.set(CoinRepository.CACHE_KEY, coins);
            logger.debug('Monedas caché para comparación', { count: coins.length });

            return coins;
        } catch (error) {
            logger.error('No se pudo obtener todas las monedas para comparación', { error });
            throw new DatabaseError('No se pudo obtener monedas para comparación', error);
        }
    }

    getImage(id: number): Buffer | null {
        try {
            const stmt = this.db.prepare('SELECT image_data FROM coins WHERE id = ?');
            const row = stmt.get(id) as any;

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
