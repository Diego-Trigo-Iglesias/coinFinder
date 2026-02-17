/**
 * Clase base de error de aplicación
 */
export class AppError extends Error {
    constructor(
        public message: string,
        public statusCode: number = 500,
        public code?: string,
        public details?: unknown
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Error por validación de entrada inválida
 */
export class ValidationError extends AppError {
    constructor(message: string, details?: unknown) {
        super(message, 400, 'VALIDATION_ERROR', details);
    }
}

/**
 * Error para recurso no encontrado
 */
export class NotFoundError extends AppError {
    constructor(resource: string, id?: string | number) {
        super(
            `${resource}${id ? ` with id ${id}` : ''} not found`,
            404,
            'NOT_FOUND'
        );
    }
}

/**
 * Error para operaciones de base de datos
 */
export class DatabaseError extends AppError {
    constructor(message: string, details?: unknown) {
        super(message, 500, 'DATABASE_ERROR', details);
    }
}

/**
 * Error para operaciones de procesamiento de imágenes
 */
export class ProcessingError extends AppError {
    constructor(message: string, details?: unknown) {
        super(message, 500, 'PROCESSING_ERROR', details);
    }
}
