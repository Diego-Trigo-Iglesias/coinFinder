/**
 * Resultado del análisis de IA de una imagen de moneda
 */
export interface AnalysisResult {
    description: string;
    text: string;
    year?: string;
    coinType?: string;
    mint?: string;
    value?: string;
    country?: string;
    denomination?: string;
    rarity: number;
}

/**
 * Análisis completo de una imagen subida incluyendo resultados de coincidencia
 */
export interface ImageAnalysis {
    index: number;
    hash: string;
    title: string;
    description: string;
    aiInfo: AnalysisResult;
    image: string; // miniatura para vista previa
    imageData: string; // completo base64 para almacenamiento
    existingMatch: MatchResult | null;
}

/**
 * Resultado de comparar una imagen contra monedas existentes
 */
export interface MatchResult {
    id: number;
    name: string;
    distance: number;
    year?: string;
    coinType?: string;
    country?: string;
    denomination?: string;
}

/**
 * Duplicado encontrado dentro de una carga por lotes
 */
export interface BatchDuplicate {
    match: {
        id: number;
        name: string;
        [key: string]: unknown;
    };
    duplicateId: number;
    distance: number;
}
