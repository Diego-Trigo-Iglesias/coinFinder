/**
 * Loader dinámico para better-sqlite3
 * Prevents loading better-sqlite3 at compile time in ESM context
 */

let Database: any = null;
const SQLITE_PACKAGE = 'better-sqlite3';

export function getSqliteDatabase() {
  if (Database === null) {
    // Runtime require without static module resolution by TS
    const runtimeRequire = eval('require') as (id: string) => any;
    Database = runtimeRequire(SQLITE_PACKAGE);
  }
  return Database;
}

export async function getSqliteDatabaseAsync() {
  if (Database === null) {
    try {
      // Runtime dynamic import without static module resolution by TS
      const runtimeImport = new Function('m', 'return import(m)') as (m: string) => Promise<any>;
      const mod = await runtimeImport(SQLITE_PACKAGE);
      Database = mod.default || mod;
    } catch (_) {
      const runtimeRequire = eval('require') as (id: string) => any;
      Database = runtimeRequire(SQLITE_PACKAGE);
    }
  }
  return Database;
}