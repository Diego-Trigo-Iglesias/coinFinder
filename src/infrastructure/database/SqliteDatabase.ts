import Database from 'better-sqlite3';
import path from 'path';
import { DATABASE_CONFIG } from '../../config/constants';
import { DatabaseError } from '../../utils/errors/AppError';
import { logger } from '../../utils/logger/Logger';

/**
 * Interfaz de base de datos para inyección de dependencias
 */
export interface IDatabase {
    prepare(sql: string): Database.Statement;
    exec(sql: string): void;
    pragma(pragma: string): void;
    close(): void;
}

/**
 * Implementación de base de datos SQLite con configuración adecuada
 */
export class SqliteDatabase implements IDatabase {
    private db: Database.Database;

    constructor(dbPath?: string) {
        try {
            const resolvedPath = path.join(process.cwd(), dbPath || DATABASE_CONFIG.DB_PATH);
            logger.info(`Inicializando base de datos en ${resolvedPath}`);

            this.db = new Database(resolvedPath);
            this.configurePragmas();
            this.initializeTables();

            logger.info('Base de datos inicializada correctamente');
        } catch (error) {
            logger.error('No se pudo inicializar base de datos', { error });
            throw new DatabaseError('Failed to initialize database', error);
        }
    }

    private configurePragmas(): void {
        this.db.pragma(`journal_mode = ${DATABASE_CONFIG.JOURNAL_MODE}`);
        this.db.pragma(`synchronous = ${DATABASE_CONFIG.SYNCHRONOUS}`);
        this.db.pragma(`cache_size = ${DATABASE_CONFIG.CACHE_SIZE}`);
    }

    private initializeTables(): void {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS coins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        image_data BLOB NOT NULL,
        hash TEXT UNIQUE NOT NULL,
        year TEXT,
        coin_type TEXT,
        mint TEXT,
        approximate_value TEXT,
        rarity INTEGER DEFAULT 1 CHECK(rarity >= 1 AND rarity <= 5),
        country TEXT,
        denomination TEXT,
        date_added DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS uploads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        images TEXT NOT NULL,
        results TEXT NOT NULL,
        date_uploaded DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_coins_hash ON coins(hash);
      CREATE INDEX IF NOT EXISTS idx_coins_year ON coins(year);
      CREATE INDEX IF NOT EXISTS idx_coins_coin_type ON coins(coin_type);
      CREATE INDEX IF NOT EXISTS idx_coins_country ON coins(country);
      CREATE INDEX IF NOT EXISTS idx_uploads_date ON uploads(date_uploaded DESC);
    `);
    }

    prepare(sql: string): Database.Statement {
        try {
            return this.db.prepare(sql);
        } catch (error) {
            logger.error('No se pudo preparar sentencia', { sql, error });
            throw new DatabaseError('Failed to prepare SQL statement', error);
        }
    }

    exec(sql: string): void {
        try {
            this.db.exec(sql);
        } catch (error) {
            logger.error('No se pudo ejecutar SQL', { sql, error });
            throw new DatabaseError('Failed to execute SQL', error);
        }
    }

    pragma(pragma: string): void {
        this.db.pragma(pragma);
    }

    close(): void {
        try {
            this.db.close();
            logger.info('Conexión de base de datos cerrada');
        } catch (error) {
            logger.error('No se pudo cerrar base de datos', { error });
            throw new DatabaseError('Failed to close database', error);
        }
    }
}
