import type { APIRoute } from 'astro';
import type { UploadResponse } from '../../core/domain/models/Upload';
import { handleApiError } from '../../utils/errors/errorHandler';
import { validateFiles } from '../../utils/validation/CoinValidator';
import { logger } from '../../utils/logger/Logger';

export const prerender = false;

/**
 * Endpoint de API para subida - procesa imágenes de monedas
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Import dinámico para evitar problemas con better-sqlite3 en ESM
    const { container } = await import('../../config/container');
    
    // Analizar datos del formulario
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    const titles = formData.getAll('titles') as string[];
    const descriptions = formData.getAll('descriptions') as string[];

    // Validar entrada
    validateFiles(files);

    // Obtener servicios
    const imageService = container.imageService;
    const analysisService = container.analysisService;
    const comparisonService = container.comparisonService;
    const coinService = container.coinService;

    logger.info('Carga en procesamiento', { fileCount: files.length });

    // Procesar todas las imágenes en paralelo
    const processedImages = await Promise.all(
      files.map(async (file, i) => {
        const title = titles[i] || file.name;
        const description = descriptions[i] || '';

        const buffer = await file.arrayBuffer();
        const imageData = await imageService.processForStorage(buffer);
        const hash = await imageService.computeHash(imageData);
        const aiInfo = await analysisService.analyzeCoinImage(imageData);
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