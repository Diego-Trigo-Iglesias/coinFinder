import type { APIRoute } from 'astro';
import type { CreateCoinData } from '../../core/domain/models/Coin';
import { handleApiError } from '../../utils/errors/errorHandler';
import { ValidationError } from '../../utils/errors/AppError';
import { logger } from '../../utils/logger/Logger';

export const prerender = false;

/**
 * Endpoint de API para guardar moneda
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Import dinámico para evitar problemas con better-sqlite3 en ESM
    const { container } = await import('../../config/container');
    const body = await request.json();
    const { imageData, hash, title, description, aiInfo } = body;

    // Validar campos requeridos
    if (!imageData || !hash) {
      throw new ValidationError('Image data and hash are required', {
        hasImageData: !!imageData,
        hasHash: !!hash
      });
    }

    // Analizar datos de imagen
    const base64String = imageData.includes(',') ? imageData.split(',')[1] : imageData;
    const imageBuffer = Buffer.from(base64String, 'base64');

    // Preparar datos de moneda
    const coinData: CreateCoinData = {
      name: title || 'Moneda',
      description: description || '',
      hash,
      year: aiInfo?.year,
      coinType: aiInfo?.coinType,
      mint: aiInfo?.mint,
      approximateValue: aiInfo?.value,
      rarity: aiInfo?.rarity || 1,
      country: aiInfo?.country,
      denomination: aiInfo?.denomination
    };

    // Guardar moneda
    const coinService = container.coinService;
    const savedCoin = await coinService.createCoin(coinData, imageBuffer);

    logger.info('Moneda guardada correctamente', { id: savedCoin.id });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Moneda guardada correctamente',
        coinId: savedCoin.id
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
};
