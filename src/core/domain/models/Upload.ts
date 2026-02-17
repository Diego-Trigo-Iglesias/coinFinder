import type { AnalysisResult } from './Analysis';

/**
 * Registro de carga en base de datos
 */
export interface Upload {
    id: number;
    images: string;
    results: string;
    dateUploaded: Date;
}

/**
 * Imagen procesada durante el flujo de carga
 */
export interface ProcessedImage {
    file: File;
    imageData: Buffer;
    hash: string;
    aiInfo: AnalysisResult;
    title: string;
    description: string;
    thumbnail: string;
}

/**
 * Respuesta desde la API de carga
 */
export interface UploadResponse {
    analysisResults: Array<{
        index: number;
        hash: string;
        title: string;
        description: string;
        aiInfo: AnalysisResult;
        image: string;
        imageData: string;
        existingMatch: {
            id: number;
            name: string;
            distance: number;
            [key: string]: unknown;
        } | null;
    }>;
    duplicatesInBatch: Array<{
        match: { id: number; name: string;[key: string]: unknown };
        duplicateId: number;
        distance: number;
    }>;
}
