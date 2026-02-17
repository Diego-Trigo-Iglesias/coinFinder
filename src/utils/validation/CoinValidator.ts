import { ValidationError } from '../errors/AppError';
import { VALIDATION_CONFIG, PAGINATION_CONFIG } from '../../config/constants';

/**
 * Validar título de moneda
 */
export function validateTitle(title: string | null | undefined): string {
    if (!title || title.trim().length === 0) {
        return 'Moneda'; // Valor por defecto
    }

    const trimmed = title.trim();

    if (trimmed.length > VALIDATION_CONFIG.MAX_TITLE_LENGTH) {
        throw new ValidationError(
            `Title must not exceed ${VALIDATION_CONFIG.MAX_TITLE_LENGTH} characters`,
            { maxLength: VALIDATION_CONFIG.MAX_TITLE_LENGTH, actual: trimmed.length }
        );
    }

    return trimmed;
}

/**
 * Validar descripción de moneda
 */
export function validateDescription(description: string | null | undefined): string {
    if (!description) {
        return '';
    }

    const trimmed = description.trim();

    if (trimmed.length > VALIDATION_CONFIG.MAX_DESCRIPTION_LENGTH) {
        throw new ValidationError(
            `Description must not exceed ${VALIDATION_CONFIG.MAX_DESCRIPTION_LENGTH} characters`,
            { maxLength: VALIDATION_CONFIG.MAX_DESCRIPTION_LENGTH, actual: trimmed.length }
        );
    }

    return trimmed;
}

/**
 * Validar valor de rareza
 */
export function validateRarity(rarity: number | string | null | undefined): number {
    const parsed = typeof rarity === 'string' ? parseInt(rarity, 10) : rarity;

    if (parsed === null || parsed === undefined || isNaN(parsed)) {
        return VALIDATION_CONFIG.MIN_RARITY; // Por defecto al mínimo
    }

    if (parsed < VALIDATION_CONFIG.MIN_RARITY || parsed > VALIDATION_CONFIG.MAX_RARITY) {
        throw new ValidationError(
            `Rarity must be between ${VALIDATION_CONFIG.MIN_RARITY} and ${VALIDATION_CONFIG.MAX_RARITY}`,
            { min: VALIDATION_CONFIG.MIN_RARITY, max: VALIDATION_CONFIG.MAX_RARITY, actual: parsed }
        );
    }

    return parsed;
}

/**
 * Validar parámetros de paginación
 */
export function validatePagination(page: string | number, limit: string | number): {
    page: number;
    limit: number;
} {
    const parsedPage = typeof page === 'string' ? parseInt(page, 10) : page;
    const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : limit;

    if (isNaN(parsedPage) || parsedPage < 1) {
        throw new ValidationError('Page must be a positive integer', { page });
    }

    if (isNaN(parsedLimit) || parsedLimit < 1) {
        throw new ValidationError('Limit must be a positive integer', { limit });
    }

    if (parsedLimit > PAGINATION_CONFIG.MAX_LIMIT) {
        throw new ValidationError(
            `Limit must not exceed ${PAGINATION_CONFIG.MAX_LIMIT}`,
            { limit: parsedLimit }
        );
    }

    return { page: parsedPage, limit: parsedLimit };
}

/**
 * Validar que el archivo es un objeto archivo real
 */
export function validateFile(file: unknown): file is File {
    return file instanceof File;
}

/**
 * Validate array of files
 */
export function validateFiles(files: unknown): files is File[] {
    if (!Array.isArray(files)) {
        throw new ValidationError('Files must be an array');
    }

    if (files.length === 0) {
        throw new ValidationError('At least one file is required');
    }

    if (!files.every(validateFile)) {
        throw new ValidationError('All items must be valid File objects');
    }

    return true;
}
