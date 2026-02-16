import type { APIRoute } from 'astro';
import { computeHashFromBuffer, saveImageToDB } from '../../lib/imageUtils';
import { analyzeCoinImage } from '../../lib/aiAnalysis';
import { insertCoin, insertUpload, getAllCoins } from '../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    const titles = formData.getAll('titles') as string[];
    const descriptions = formData.getAll('descriptions') as string[];

    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: 'No se subieron imágenes' }), { status: 400 });
    }

    const results = [];
    const savedImages = [];
    const matches = [];

    // Obtener todas las monedas existentes para comparación
    const allCoins = getAllCoins.all() as Array<{ hash: string; [key: string]: unknown }>;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const title = titles[i] || file.name;
      const description = descriptions[i] || '';

      const buffer = await file.arrayBuffer();
      const imageData = await saveImageToDB(buffer, file.name);
      const hash = await computeHashFromBuffer(imageData);

      // Analizar con IA para información detallada
      const aiInfo = await analyzeCoinImage(Buffer.from(imageData));

      // Verificar coincidencias usando comparación mejorada con IA
      // Comparar basado en texto extraído, año, tipo, etc.
      let bestMatch = null;
      let minDistance = Infinity;
      for (const coin of allCoins) {
        let distance = hammingDistance(hash, coin.hash);
        // Mejorar precisión con datos de IA
        if (coin.year === aiInfo.year && coin.coin_type === aiInfo.coinType) distance -= 5; // Reducir distancia si metadatos coinciden
        if (distance < 5 && distance < minDistance) { // Umbral más estricto
          minDistance = distance;
          bestMatch = coin;
        }
      }

      const base64Image = imageData.toString('base64');
      savedImages.push(`data:image/png;base64,${base64Image}`);

      if (bestMatch) {
        matches.push({ image: `data:image/png;base64,${base64Image}`, match: bestMatch, distance: minDistance });
      } else {
        // Nueva moneda
        insertCoin.run(title, description, imageData, hash, aiInfo.year, aiInfo.coinType, aiInfo.mint, aiInfo.value, aiInfo.rarity, aiInfo.country, aiInfo.denomination);
        results.push({ image: `data:image/png;base64,${base64Image}`, status: 'new', info: aiInfo });
      }
    }

    // Registrar la subida con imágenes base64
    insertUpload.run(JSON.stringify(savedImages), JSON.stringify(matches));

    return new Response(JSON.stringify({ results, matches }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};

// Distancia de Hamming para comparación de hash
function hammingDistance(hash1: string, hash2: string): number {
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) distance++;
  }
  return distance;
};