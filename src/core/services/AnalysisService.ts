import type { AnalysisResult } from '../domain/models/Analysis';
import { IMAGE_CONFIG } from '../../config/constants';
import { logger } from '../../utils/logger/Logger';

/**
 * Base de datos simplificada de monedas para demostración
 * En producción, esto vendría de un servicio externo o base de datos
 */
interface CoinData {
    type: string;
    year: string;
    country: string;
    denomination: string;
    rarity: number;
    commonality: boolean;
}

const COIN_DATABASE: readonly CoinData[] = [
    { type: 'Moneda de 1 euro', year: '2023', country: 'España', denomination: '1 euro', rarity: 1, commonality: true },
    { type: 'Moneda de 2 euros', year: '2022', country: 'España', denomination: '2 euros', rarity: 1, commonality: true },
    { type: 'Moneda de 50 céntimos', year: '2021', country: 'España', denomination: '50 céntimos', rarity: 2, commonality: true },
    { type: 'Moneda de 20 céntimos', year: '2020', country: 'España', denomination: '20 céntimos', rarity: 2, commonality: true },
    { type: 'Moneda de 10 céntimos', year: '2019', country: 'España', denomination: '10 céntimos', rarity: 2, commonality: true },
    { type: 'Moneda conmemorativa 2 euros', year: '2018', country: 'España', denomination: '2 euros', rarity: 3, commonality: false },
    { type: 'Moneda de 5 pesos', year: '2023', country: 'México', denomination: '5 pesos', rarity: 1, commonality: true },
    { type: 'Moneda de 10 pesos', year: '2022', country: 'México', denomination: '10 pesos', rarity: 2, commonality: true },
    { type: 'Moneda de 1 dólar', year: '2023', country: 'USA', denomination: '1 dollar', rarity: 1, commonality: true },
    { type: 'Moneda de 25 centavos', year: '2023', country: 'USA', denomination: '25 cents', rarity: 1, commonality: true },
    { type: 'Moneda de 1 euro', year: '2021', country: 'Francia', denomination: '1 euro', rarity: 1, commonality: true },
    { type: 'Moneda de 2 euros', year: '2020', country: 'Alemania', denomination: '2 euros', rarity: 1, commonality: true },
    { type: 'Moneda antigua', year: '1995', country: 'España', denomination: '100 pesetas', rarity: 4, commonality: false },
];

/**
 * Servicio para análisis de imágenes de monedas
 */
export class AnalysisService {
    /**
     * Analizar imagen de moneda y extraer metadatos
     * Nota: Esta es una implementación simplificada. En producción, esto se integraría
     * con Google Cloud Vision o servicio de IA similar.
     */
    async analyzeCoinImage(imageBuffer: Buffer): Promise<AnalysisResult> {
        try {
            // Verificar si la imagen es demasiado pequeña para ser una foto real
            if (imageBuffer.length < IMAGE_CONFIG.MIN_FILE_SIZE) {
            logger.warn('Imagen demasiado pequeña para análisis', { size: imageBuffer.length });
                return {
                    description: 'Imagen demasiado pequeña - puede no ser una moneda',
                    text: 'Intenta capturar la moneda con mejor calidad',
                    coinType: 'No detectada',
                    rarity: 0,
                };
            }

            return this.performAnalysis(imageBuffer);
        } catch (error) {
            logger.error('Error al analizar imagen de moneda', { error });
            return this.getDefaultAnalysis();
        }
    }

    private performAnalysis(imageBuffer: Buffer): AnalysisResult {
        const bufferHash = this.calculateSimpleHash(imageBuffer);
        const hashNum = parseInt(bufferHash.substring(0, 8), 16);

        // Seleccionar moneda basada en hash (selección determinística para demo)
        const selectedCoin = COIN_DATABASE[hashNum % COIN_DATABASE.length];

        // Ajustar rareza según calidad de imagen (tamaño de archivo como proxy)
        let rarity = selectedCoin.rarity;
        const bufferSize = imageBuffer.length;

        if (bufferSize > 100000) rarity = Math.max(rarity - 0.5, 1);
        if (bufferSize > 500000) rarity = Math.min(rarity + 1, 5);
        if (bufferSize > 2000000) rarity = 5;

        logger.debug('Análisis de moneda completado', {
            type: selectedCoin.type,
            country: selectedCoin.country,
            rarity: Math.round(rarity)
        });

        return {
            description: `${selectedCoin.type} de ${selectedCoin.country}`,
            text: `Moneda de ${selectedCoin.country}, año ${selectedCoin.year}`,
            year: selectedCoin.year,
            coinType: selectedCoin.type,
            mint: undefined,
            value: `Valor facial: ${selectedCoin.denomination}`,
            country: selectedCoin.country,
            denomination: selectedCoin.denomination,
            rarity: Math.round(rarity),
        };
    }

    private calculateSimpleHash(buffer: Buffer): string {
        let hash = 0;
        const step = Math.max(1, Math.floor(buffer.length / 512));

        for (let i = 0; i < buffer.length; i += step) {
            const byte = buffer[i];
            hash = ((hash << 5) - hash) + byte;
            hash = hash & hash;
        }

        return Math.abs(hash).toString(16).padStart(8, '0');
    }

    private getDefaultAnalysis(): AnalysisResult {
        return {
            description: 'Moneda',
            text: 'Moneda no identificada',
            year: new Date().getFullYear().toString(),
            coinType: 'Moneda',
            mint: undefined,
            value: 'Desconocido',
            country: undefined,
            denomination: undefined,
            rarity: 2,
        };
    }
}
