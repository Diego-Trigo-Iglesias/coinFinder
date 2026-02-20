import { createClient } from "@libsql/client";
import * as path from "path";
import { DATABASE_CONFIG } from "../../config/constants";
import { DatabaseError } from "../../utils/errors/AppError";
import { logger } from "../../utils/logger/Logger";

/**
 * Interfaz de base de datos para inyección de dependencias
 */
export interface IDatabase {
  prepare(sql: string): Promise<AsyncStatement>;
  exec(sql: string): Promise<void>;
  pragma(pragma: string): Promise<void>;
  close(): Promise<void>;
}

/**
 * Interfaz extendida de Statement con métodos async
 */
export interface AsyncStatement {
  run(...params: any[]): { changes: number; lastInsertRowid: number };
  get(...params: any[]): any;
  all(...params: any[]): any[];
  runAsync( ...params: any[] ): Promise<{ changes: number; lastInsertRowid: number }>;
  getAsync(...params: any[]): Promise<any>;
  allAsync(...params: any[]): Promise<any[]>;
}

/**
 * Implementación de Statement usando libsql
 */
class LibsqlStatementImpl implements AsyncStatement {
  constructor( private sql: string, private client: any ) {}

  run(): { changes: number; lastInsertRowid: number } {
    throw new Error("Use runAsync");
  }

  get(): any {
    throw new Error("Use getAsync");
  }

  all(): any[] {
    throw new Error("Use allAsync");
  }

  // Async methods
  async runAsync( ...params: any[] ): Promise<{ changes: number; lastInsertRowid: number }> {
    const result = await this.client.execute({ sql: this.sql, args: params });
    return {
      changes: result.rowsAffected,
      lastInsertRowid: result.lastInsertRowid,
    };
  }

  async getAsync(...params: any[]): Promise<any> {
    const result = await this.client.execute({ sql: this.sql, args: params });
    return result.rows[0] || null;
  }

  async allAsync(...params: any[]): Promise<any[]> {
    const result = await this.client.execute({ sql: this.sql, args: params });
    return result.rows;
  }
}

/**
 * Implementación de base de datos SQLite con configuración adecuada usando @libsql/client
 */
export class SqliteDatabase implements IDatabase {
  private client: any;

  constructor(dbPath?: string) {
    try {
      const resolvedPath = path.join( process.cwd(), dbPath || DATABASE_CONFIG.DB_PATH );
      const url = `file:${resolvedPath}`;
      logger.info(`Inicializando base de datos en ${url}`);

      this.client = createClient({ url });
      this.configurePragmas();
      this.initializeTables();

      logger.info("Base de datos inicializada correctamente");
    } catch (error) {
      logger.error("No se pudo inicializar base de datos", { error });
      throw new DatabaseError("Failed to initialize database", error);
    }
  }

  private async configurePragmas(): Promise<void> {
    await this.client.execute( `PRAGMA journal_mode = ${DATABASE_CONFIG.JOURNAL_MODE}` );
    await this.client.execute( `PRAGMA synchronous = ${DATABASE_CONFIG.SYNCHRONOUS}` );
    await this.client.execute( `PRAGMA cache_size = ${DATABASE_CONFIG.CACHE_SIZE}` );
  }

  private async initializeTables(): Promise<void> {
    await this.client.execute(`
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

  prepare(sql: string): Promise<AsyncStatement> {
    return Promise.resolve(new LibsqlStatementImpl(sql, this.client));
  }

  exec(sql: string): Promise<void> {
    return this.client.execute(sql).then(() => {});
  }

  pragma(pragma: string): Promise<void> {
    return this.client.execute(`PRAGMA ${pragma}`).then(() => {});
  }

  close(): Promise<void> {
    return Promise.resolve();
  }
}
