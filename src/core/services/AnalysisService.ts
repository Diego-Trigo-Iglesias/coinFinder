import type { AnalysisResult } from '../domain/models/Analysis';
import { IMAGE_CONFIG } from '../../config/constants';
import { logger } from '../../utils/logger/Logger';

const DEFAULT_ML_SERVER = process.env.ML_SERVER_URL || 'http://127.0.0.1:8000/predict';

export class AnalysisService {
    /**
     * Analizar imagen de moneda y extraer metadatos usando servidor ML externo.
     * El servidor debe esperar JSON { image_base64 } y devolver { coinType, confidence, suggestions, ... }
     */
    async analyzeCoinImage(imageBuffer: Buffer): Promise<AnalysisResult> {
        try {
            if (imageBuffer.length < IMAGE_CONFIG.MIN_FILE_SIZE) {
                logger.warn('Imagen demasiado pequeña para análisis', { size: imageBuffer.length });
                return {
                    description: 'Imagen demasiado pequeña - puede no ser una moneda',
                    text: 'Intenta capturar la moneda con mejor calidad',
                    coinType: 'No detectada',
                    rarity: 0,
                    confidence: 10,
                    suggestions: [
                        'Acércate más a la moneda (más detalle)',
                        'Asegúrate de buena iluminación',
                        'Enfoca la moneda y evita reflejos'
                    ]
                } as AnalysisResult;
            }

            const base64 = imageBuffer.toString('base64');
            const payload = { image_base64: base64 };

            const res = await fetch(DEFAULT_ML_SERVER, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const txt = await res.text();
                logger.error('ML server returned error', { status: res.status, body: txt });
                return this.getDefaultAnalysis();
            }

            const data = await res.json();

            const analysis: AnalysisResult = {
                description: data.coinType ? String(data.coinType) : 'Moneda',
                text: data.text || `Predicción: ${data.coinType || 'desconocida'}`,
                year: data.year,
                coinType: data.coinType,
                mint: data.mint,
                value: data.value,
                country: data.country,
                denomination: data.denomination,
                rarity: typeof data.rarity === 'number' ? data.rarity : 2,
                confidence: typeof data.confidence === 'number' ? data.confidence : undefined,
                suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
            };

            logger.debug('AnalysisService: prediction', { coinType: analysis.coinType, confidence: analysis.confidence });
            return analysis;
        } catch (error) {
            logger.error('Error calling ML server', { error });
            return this.getDefaultAnalysis();
        }
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
            confidence: undefined,
            suggestions: []
        };
    }
}
