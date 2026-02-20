import type { Coin } from "../domain/models/Coin";
import type { AnalysisResult, MatchResult } from "../domain/models/Analysis";
import { COMPARISON_CONFIG } from "../../config/constants";
import { logger } from "../../utils/logger/Logger";

//Servicio para comparar imágenes de monedas y detectar duplicados
export class ComparisonService {
  //Calcular distancia de Hamming entre dos cadenas hash
  calculateHammingDistance(hash1: string, hash2: string): number {
    let distance = 0;
    const len = Math.min(hash1.length, hash2.length);

    for (let i = 0; i < len; i++) {
      if (hash1[i] !== hash2[i]) {
        distance++;
      }
    }

    return distance;
  }

  //Encontrar la mejor coincidencia para un hash de moneda entre monedas existentes
  findBestMatch(
    targetHash: string,
    aiInfo: AnalysisResult,
    existingCoins: Coin[],
  ): MatchResult | null {
    let bestMatch: Coin | null = null;
    let minDistance = Infinity;

    for (const coin of existingCoins) {
      const distance = this.calculateHammingDistance(targetHash, coin.hash);

      // Salida anticipada si la distancia es demasiado grande
      if (distance > minDistance) {
        continue;
      }

      // Calcular puntuación de coincidencia de metadatos
      const metadataScore = this.calculateMetadataScore(aiInfo, coin);
      const adjustedDistance = Math.max(0, distance - metadataScore);
      const isMatch = this.isMatch(distance, metadataScore, aiInfo, coin);

      if (isMatch && adjustedDistance < minDistance) {
        minDistance = adjustedDistance;
        bestMatch = coin;
      }
    }

    if (!bestMatch) {
      return null;
    }

    logger.debug("Coincidencia encontrada para moneda", {
      matchId: bestMatch.id,
      distance: minDistance,
    });

    return {
      id: bestMatch.id,
      name: bestMatch.name,
      distance: minDistance,
      year: bestMatch.year,
      coinType: bestMatch.coinType,
      country: bestMatch.country,
      denomination: bestMatch.denomination,
    };
  }

  // Verificar si dos monedas coinciden basadas en distancia hash y metadatos
  private isMatch(
    distance: number,
    metadataScore: number,
    aiInfo: AnalysisResult,
    coin: Coin,
  ): boolean {
    // Coincidencia exacta por hash
    if (distance < COMPARISON_CONFIG.HAMMING_THRESHOLD_EXACT) {
      return true;
    }

    // Similar con buena coincidencia de metadatos
    if (
      distance < COMPARISON_CONFIG.HAMMING_THRESHOLD_LOOSE &&
      metadataScore >= COMPARISON_CONFIG.METADATA_SCORE_THRESHOLD
    ) {
      return true;
    }

    // Años y tipos similares
    if (
      distance < COMPARISON_CONFIG.HAMMING_THRESHOLD_SIMILAR &&
      coin.year === aiInfo.year &&
      coin.coinType === aiInfo.coinType
    ) {
      return true;
    }

    return false;
  }

  // Calcular puntuación de similitud de metadatos
  private calculateMetadataScore(aiInfo: AnalysisResult, coin: Coin): number {
    let score = 0;

    if (coin.year === aiInfo.year) {
      score += COMPARISON_CONFIG.METADATA_SCORE_YEAR;
    }

    if (coin.coinType === aiInfo.coinType) {
      score += COMPARISON_CONFIG.METADATA_SCORE_TYPE;
    }

    if (coin.country === aiInfo.country) {
      score += COMPARISON_CONFIG.METADATA_SCORE_COUNTRY;
    }

    if (coin.denomination === aiInfo.denomination) {
      score += COMPARISON_CONFIG.METADATA_SCORE_DENOMINATION;
    }

    return score;
  }

  // Encontrar duplicados dentro de un lote de imágenes
  findBatchDuplicates(
    images: Array<{ index: number; hash: string }>,
  ): Array<{ primaryIndex: number; duplicateIndex: number; distance: number }> {
    const duplicates: Array<{
      primaryIndex: number;
      duplicateIndex: number;
      distance: number;
    }> = [];
    const processed = new Set<number>();

    for (let i = 0; i < images.length; i++) {
      if (processed.has(i)) continue;

      const current = images[i];

      for (let j = i + 1; j < images.length; j++) {
        if (processed.has(j)) continue;

        const other = images[j];
        const distance = this.calculateHammingDistance(
          current.hash,
          other.hash,
        );

        if (distance < COMPARISON_CONFIG.HAMMING_THRESHOLD_BATCH_DUPLICATE) {
          duplicates.push({
            primaryIndex: i,
            duplicateIndex: j,
            distance,
          });
          processed.add(j);
        }
      }
    }

    if (duplicates.length > 0) {
      logger.info("Duplicados por lotes encontrados", {
        count: duplicates.length,
      });
    }

    return duplicates;
  }
}
