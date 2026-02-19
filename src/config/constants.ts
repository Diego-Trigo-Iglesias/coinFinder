/**
 * Constantes de configuración de base de datos
 */
export const DATABASE_CONFIG = {
    DB_PATH: process.env.DB_PATH || 'coins.db',
    JOURNAL_MODE: 'WAL',
    SYNCHRONOUS: 'NORMAL',
    CACHE_SIZE: -64000,
} as const;

/**
 * Configuración de Turso
 */
export const TURSO_CONFIG = {
    URL: process.env.TURSO_DATABASE_URL || 'file:coins.db',
    AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
} as const;

/**
 * Configuración de caché
 */
export const CACHE_CONFIG = {
    TTL_MS: 5 * 60 * 1000, // 5 minutes
} as const;

/**
 * Configuración de procesamiento de imágenes
 */
export const IMAGE_CONFIG = {
    THUMBNAIL_SIZE: 200,
    THUMBNAIL_QUALITY: 50,
    STORAGE_SIZE: 300,
    STORAGE_QUALITY: 70,
    MIN_FILE_SIZE: 30000, // 30KB - tamaño mínimo para ser considerado una foto real
    JPEG_PROGRESSIVE: true,
} as const;

/**
 * Umbrales de comparación de hash para detección de duplicados
 * Usando hash perceptual (dHash) - hash de 64 bits donde la distancia indica similitud visual
 */
export const COMPARISON_CONFIG = {
    // Umbrales de distancia de Hamming para hash perceptual de 64 bits
    HAMMING_THRESHOLD_BATCH_DUPLICATE: 8,    // Muy similar (mismo lote, probablemente misma foto)
    HAMMING_THRESHOLD_EXACT: 12,             // Misma moneda, ángulo/luz similar
    HAMMING_THRESHOLD_SIMILAR: 18,           // Misma moneda, condiciones diferentes
    HAMMING_THRESHOLD_LOOSE: 24,             // Posiblemente misma moneda con coincidencia de metadatos

    // Pesos de puntuación de metadatos
    METADATA_SCORE_YEAR: 10,
    METADATA_SCORE_TYPE: 10,
    METADATA_SCORE_COUNTRY: 5,
    METADATA_SCORE_DENOMINATION: 5,
    METADATA_SCORE_THRESHOLD: 15,
} as const;

/**
 * Configuración de paginación
 */
export const PAGINATION_CONFIG = {
    DEFAULT_LIMIT: 50,
    MAX_LIMIT: 100,
    MIN_PAGE: 1,
} as const;

/**
 * Restricciones de validación
 */
export const VALIDATION_CONFIG = {
    MAX_TITLE_LENGTH: 255,
    MAX_DESCRIPTION_LENGTH: 500,
    MIN_RARITY: 1,
    MAX_RARITY: 5,
} as const;

/**
 * Códigos de estado HTTP
 */
export const HTTP_STATUS = {
    OK: 200,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Códigos de error para errores de aplicación
 */
export const ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    DATABASE_ERROR: 'DATABASE_ERROR',
    PROCESSING_ERROR: 'PROCESSING_ERROR',
} as const;
