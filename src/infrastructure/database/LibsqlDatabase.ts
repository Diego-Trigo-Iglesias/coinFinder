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

  // Métodos síncronos para compatibilidad (aunque no se usan)
  run(): { changes: number; lastInsertRowid: number } {
    throw new Error("Use runAsync");
  }

  get(): any {
    throw new Error("Use getAsync");
  }

  all(): any[] {
    throw new Error("Use allAsync");
  }

  // Métodos asíncronos
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
    // No inicializar el cliente en el constructor: usamos inicialización perezosa
    this.client = null;
    logger.info('LibsqlDatabase creado (inicialización perezosa).', {
      tursoUrl: TURSO_CONFIG.URL,
      hasAuthToken: !!TURSO_CONFIG.AUTH_TOKEN,
    });
  }

  /**
   * Asegura que el cliente libsql esté creado y las tablas inicializadas.
   * Se invoca en la primera operación de BD para evitar fallos en cold starts
   * y para proporcionar registros más claros cuando se ejecuta en entornos serverless.
   */
  private async ensureClientInitialized(): Promise<void> {
    if (this.client) return;

    logger.info('Inicializando cliente Turso (lazy)...', { url: TURSO_CONFIG.URL });

    try {
      this.client = createClient({ url: TURSO_CONFIG.URL, authToken: TURSO_CONFIG.AUTH_TOKEN });
      await this.initializeTables();
      logger.info('Cliente Turso inicializado correctamente');
    } catch (error: any) {
      // Registrar detalles estructurados pero evitar filtrar secretos
      logger.error('Error inicializando cliente Turso', {
        message: error?.message,
        stack: error?.stack,
        url: TURSO_CONFIG.URL,
        hasAuthToken: !!TURSO_CONFIG.AUTH_TOKEN,
      });
      throw new DatabaseError('No se pudo inicializar la base de datos Turso (lazy)', error);
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
    return (async () => {
      await this.ensureClientInitialized();
      return new LibsqlStatementImpl(sql, this.client);
    })();
  }

  exec(sql: string): Promise<void> {
    return (async () => {
      await this.ensureClientInitialized();
      return this.client.execute(sql).then(() => {});
    })();
  }

  pragma(pragma: string): Promise<void> {
    return (async () => {
      await this.ensureClientInitialized();
      return this.client.execute(`PRAGMA ${pragma}`).then(() => {});
    })();
  }

  close(): Promise<void> {
    return Promise.resolve();
  }
}
