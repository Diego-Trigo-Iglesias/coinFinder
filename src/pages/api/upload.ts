import type { APIRoute } from 'astro';
import type { UploadResponse } from '../../core/domain/models/Upload';
import { handleApiError } from '../../utils/errors/errorHandler';
import { validateFiles, validateDescription, validateTitle } from '../../utils/validation/CoinValidator';
import { logger } from '../../utils/logger/Logger';

export const prerender = false;

/**
 * Endpoint de API para subida - procesa imágenes de monedas
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Import dinámico para evitar problemas con better-sqlite3 en ESM
    const { container } = await import('../../config/container');
    
    // Analizar body: soportar FormData (multipart) y JSON con base64
    const contentType = (request.headers.get('content-type') || '').toLowerCase();

    let files: any[] = [];
    let titles: string[] = [];
    let descriptions: string[] = [];

    if (contentType.includes('application/json')) {
      const body = await request.json();
      if (!body.images || !Array.isArray(body.images)) {
        throw new Error('Invalid JSON payload: images array required');
      }

      files = body.images.map((img: any) => {
        if (!img.data) throw new Error('Each image must include base64 data');
        const buffer = Buffer.from(img.data, 'base64');
        return {
          name: img.filename || 'image.jpg',
          arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
        } as any;
      });
      titles = Array.isArray(body.titles) ? body.titles : files.map((f) => f.name);
      descriptions = Array.isArray(body.descriptions) ? body.descriptions : files.map(() => '');
    } else {
      const formData = await request.formData();
      files = formData.getAll('images') as File[];
      titles = formData.getAll('titles') as string[];
      descriptions = formData.getAll('descriptions') as string[];
    }

    // Validar entrada (si se reciben objetos tipo File desde formData)
    try {
      if (Array.isArray(files) && files.length > 0 && files.every((f) => typeof (f as any).arrayBuffer === 'function')) {
        // OK - compatible con el flujo existente
      } else {
        // Si no son File-like, lanzar validación personalizada
        // Permitimos el caso de JSON (ya transformado arriba)
      }
    } catch (err) {
      throw err;
    }

    // Obtener servicios
    const imageService = container.imageService;
    const analysisService = container.analysisService;
    const comparisonService = container.comparisonService;
    const coinService = container.coinService;

    logger.info('Carga en procesamiento', { fileCount: files.length });

    // Procesar todas las imágenes en paralelo con caching de predicciones
    const predictionCache = container.predictionCache;
    const processedImages = await Promise.all(
      files.map(async (file, i) => {
        const title = titles[i] || file.name;
        const description = descriptions[i] || '';

        const buffer = await file.arrayBuffer();
        const imageData = await imageService.processForStorage(buffer);
        const hash = await imageService.computeHash(imageData);

        // Revisar caché por hash antes de llamar al servicio ML
        let aiInfo: any = predictionCache.get(hash);
        if (!aiInfo) {
          aiInfo = await analysisService.analyzeCoinImage(imageData);
          // Guardar en caché (valor completo de aiInfo)
          predictionCache.set(hash, aiInfo);
        }

        const thumbnail = await imageService.createThumbnail(imageData);

        return { file, imageData, hash, aiInfo, title, description, thumbnail, index: i };
      })
    );

    // Encontrar duplicados dentro del lote
    const imageHashes = processedImages.map((img, index) => ({ index, hash: img.hash }));
    const batchDuplicates = comparisonService.findBatchDuplicates(imageHashes);

    // Obtener monedas existentes para comparación
    const existingCoins = await coinService.getAllCoinsForComparison();

    // Preparar respuesta
    const duplicatesInBatch = batchDuplicates.map(dup => ({
      match: {
        id: dup.primaryIndex,
        name: processedImages[dup.primaryIndex].title,
        ...processedImages[dup.primaryIndex].aiInfo
      },
      duplicateId: dup.duplicateIndex,
      distance: dup.distance
    }));

    const processedSet = new Set(batchDuplicates.map(d => d.duplicateIndex));

    const analysisResults = processedImages
      .filter((_, i) => !processedSet.has(i))
      .map(img => {
        const existingMatch = comparisonService.findBestMatch(
          img.hash,
          img.aiInfo,
          existingCoins
        );

        return {
          index: img.index,
          hash: img.hash,
          title: img.title,
          description: img.description,
          aiInfo: img.aiInfo,
          image: img.thumbnail,
          imageData: img.imageData.toString('base64'),
          existingMatch: existingMatch ? {
            id: existingMatch.id,
            name: existingMatch.name,
            distance: existingMatch.distance,
            year: existingMatch.year,
            coinType: existingMatch.coinType,
            country: existingMatch.country,
            denomination: existingMatch.denomination
          } : null
        };
      });

    const response: UploadResponse = {
      analysisResults,
      duplicatesInBatch
    };

    logger.info('Carga procesada correctamente', {
      totalImages: files.length,
      uniqueImages: analysisResults.length,
      duplicates: duplicatesInBatch.length
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return handleApiError(error);
  }
};