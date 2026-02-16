import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'coins.db');
const db = new Database(dbPath);
// Migrar base de datos
try {
  db.exec(`ALTER TABLE coins ADD COLUMN description TEXT DEFAULT ''`);
} catch (e) {
  // La columna podría ya existir
}
try {
  db.exec(`ALTER TABLE coins ADD COLUMN year TEXT`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE coins ADD COLUMN coin_type TEXT`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE coins ADD COLUMN mint TEXT`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE coins ADD COLUMN approximate_value TEXT`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE coins ADD COLUMN rarity INTEGER DEFAULT 1`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE coins ADD COLUMN country TEXT`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE coins ADD COLUMN denomination TEXT`);
} catch (e) {}
// Crear tablas
db.exec(`
  CREATE TABLE IF NOT EXISTS coins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT DEFAULT '',
    image_data BLOB,
    hash TEXT UNIQUE,
    year TEXT,
    coin_type TEXT,
    mint TEXT,
    approximate_value TEXT,
    rarity INTEGER DEFAULT 1,
    country TEXT,
    denomination TEXT,
    date_added DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    images TEXT, -- Array JSON de datos de imagen (base64 o algo)
    results TEXT, -- Array JSON de coincidencias
    date_uploaded DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Sentencias preparadas
export const insertCoin = db.prepare('INSERT INTO coins (name, description, image_data, hash, year, coin_type, mint, approximate_value, rarity, country, denomination) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
export const getAllCoins = db.prepare('SELECT id, name, description, hash, year, coin_type, mint, approximate_value, rarity, country, denomination, date_added FROM coins'); // Excluir image_data para lista
export const getCoinById = db.prepare('SELECT * FROM coins WHERE id = ?');
export const getCoinByHash = db.prepare('SELECT * FROM coins WHERE hash = ?');
export const getCoinImage = db.prepare('SELECT image_data FROM coins WHERE id = ?');
export const updateCoin = db.prepare('UPDATE coins SET name = ?, description = ?, year = ?, coin_type = ?, mint = ?, approximate_value = ?, rarity = ?, country = ?, denomination = ? WHERE id = ?');
export const deleteCoin = db.prepare('DELETE FROM coins WHERE id = ?');
export const insertUpload = db.prepare('INSERT INTO uploads (images, results) VALUES (?, ?)');
export const getAllUploads = db.prepare('SELECT * FROM uploads ORDER BY date_uploaded DESC');

export default db;