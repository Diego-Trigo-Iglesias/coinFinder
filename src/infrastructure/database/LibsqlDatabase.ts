import { createClient } from "@libsql/client";
import { TURSO_CONFIG } from "../../config/constants";
import { DatabaseError } from "../../utils/errors/AppError";
import { logger } from "../../utils/logger/Logger";
import type { AsyncStatement, IDatabase } from "./SqliteDatabase";

/**
 * Implementación de Statement usando libsql
 */
class LibsqlStatementImpl implements AsyncStatement {
  constructor(
    private sql: string,
    private client: any,
  ) {}

  // Sync methods for compatibility (though not used)
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
 * Implementación de base de datos usando libsql (Turso)
 */
export class LibsqlDatabase implements IDatabase {
  private client: any;

  constructor() {
    try {
      this.client = createClient({
        url: TURSO_CONFIG.URL,
        authToken: TURSO_CONFIG.AUTH_TOKEN,
      });
      logger.info(`Inicializando base de datos Turso en ${TURSO_CONFIG.URL}`);
      this.initializeTables();
    } catch (error) {
      logger.error("No se pudo inicializar base de datos Turso", { error });
      throw new DatabaseError("Failed to initialize Turso database", error);
    }
  }

  private async initializeTables(): Promise<void> {
    try {
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
      logger.info("Tablas de base de datos inicializadas");
    } catch (error) {
      logger.error("No se pudo inicializar tablas", { error });
      throw new DatabaseError("Failed to initialize tables", error);
    }
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
