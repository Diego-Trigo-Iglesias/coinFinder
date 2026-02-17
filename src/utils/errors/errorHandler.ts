import { AppError } from './AppError';
import { logger } from '../logger/Logger';
import { HTTP_STATUS } from '../../config/constants';

/**
 * Manejar errores de API y devolver Respuesta apropiada
 */
export function handleApiError(error: unknown): Response {
    if (error instanceof AppError) {
        logger.error(`${error.name}: ${error.message}`, {
            code: error.code,
            details: error.details
        });

        return new Response(
            JSON.stringify({
                error: error.message,
                code: error.code,
                ...(process.env.NODE_ENV === 'development' && { details: error.details })
            }),
            {
                status: error.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

    // Error desconocido
    logger.error('Error no manejado', { error });

    return new Response(
        JSON.stringify({
            error: 'Internal server error',
            code: 'INTERNAL_ERROR'
        }),
        {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers: { 'Content-Type': 'application/json' }
        }
    );
}

/**
 * Serialización segura de errores para logging
 */
export function serializeError(error: unknown): Record<string, unknown> {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack,
            ...(error instanceof AppError && {
                code: error.code,
                statusCode: error.statusCode,
                details: error.details
            })
        };
    }

    return { error: String(error) };
}
