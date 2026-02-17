/**
 * Loader dinámico para better-sqlite3
 * Prevents loading better-sqlite3 at compile time in ESM context
 */

let Database: any = null;

export function getSqliteDatabase() {
  if (Database === null) {
    // Only load at runtime
    Database = require('better-sqlite3');
  }
  return Database;
}

export async function getSqliteDatabaseAsync() {
  if (Database === null) {
    // Dynamic import for ESM compatibility
    try {
      const mod = await import('better-sqlite3');
      Database = mod.default || mod;
    } catch (_) {
      // Fallback to require if dynamic import fails
      Database = require('better-sqlite3');
    }
  }
  return Database;
}
