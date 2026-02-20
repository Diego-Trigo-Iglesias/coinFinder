import sharp from "sharp";

import { IMAGE_CONFIG } from "../../config/constants";
import { ProcessingError } from "../../utils/errors/AppError";
import { logger } from "../../utils/logger/Logger";

// Servicio para operaciones de procesamiento de imágenes
export class ImageService {
  /**
   * Computar hash perceptual (dHash) desde buffer de imagen
   * Imágenes similares producirán hashes similares, permitiendo la detección de duplicados
   * incluso cuando las fotos se toman desde diferentes ángulos o condiciones de luz
   */
  async computeHash(buffer: Buffer): Promise<string> {
    try {
      return await this.computePerceptualHash(buffer);
    } catch (error) {
      logger.error("No se pudo computar hash", { error });
      throw new ProcessingError("No se pudo computar hash de imagen", error);
    }
  }

  /**
   * Computar hash perceptual usando algoritmo de hash de diferencia (dHash)
   * 1. Convertir a escala de grises
   * 2. Redimensionar a 9x8 píxeles
   * 3. Comparar cada píxel con su vecino derecho
   * 4. Construir hash binario de 64 bits
   */
  private async computePerceptualHash(buffer: Buffer): Promise<string> {
    try {
      // Redimensionar a 9x8 y convertir a escala de grises
      const resized = await sharp(buffer)
        .resize(9, 8, { fit: "fill" })
        .grayscale()
        .raw()
        .toBuffer();

      // Construir hash comparando píxeles adyacentes
      let hash = "";
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const leftPixel = resized[row * 9 + col];
          const rightPixel = resized[row * 9 + col + 1];
          // Añadir '1' si el píxel izquierdo es más brillante que el derecho, '0' en caso contrario
          hash += leftPixel > rightPixel ? "1" : "0";
        }
      }

      // Convertir cadena binaria a hexadecimal (64 bits = 16 caracteres hex)
      const hexHash =
        parseInt(hash.substring(0, 32), 2).toString(16).padStart(8, "0") +
        parseInt(hash.substring(32, 64), 2).toString(16).padStart(8, "0");

      logger.debug("Hash perceptual computado", {
        hashLength: hexHash.length,
        hash: hexHash,
      });

      return hexHash;
    } catch (error) {
      logger.error("No se pudo computar hash perceptual", { error });
      throw new ProcessingError("No se pudo computar hash perceptual", error);
    }
  }

  // Procesar y redimensionar imagen para almacenamiento
  async processForStorage(buffer: ArrayBuffer): Promise<Buffer> {
    try {
      const buf = Buffer.from(buffer);

      const processed = await sharp(buf)
        .resize(IMAGE_CONFIG.STORAGE_SIZE, IMAGE_CONFIG.STORAGE_SIZE, {
          fit: "inside",
        })
        .jpeg({
          quality: IMAGE_CONFIG.STORAGE_QUALITY,
          progressive: IMAGE_CONFIG.JPEG_PROGRESSIVE,
        })
        .toBuffer();

      logger.debug("Imagen procesada para almacenamiento", {
        originalSize: buf.length,
        processedSize: processed.length,
      });

      return processed;
    } catch (error) {
      logger.error("No se pudo procesar imagen para almacenamiento", { error });
      throw new ProcessingError("No se pudo procesar imagen", error);
    }
  }

  // Crear miniatura para vista previa
  async createThumbnail(imageData: Buffer): Promise<string> {
    try {
      const thumbnail = await sharp(imageData)
        .resize(IMAGE_CONFIG.THUMBNAIL_SIZE, IMAGE_CONFIG.THUMBNAIL_SIZE, {
          fit: "cover",
        })
        .jpeg({
          quality: IMAGE_CONFIG.THUMBNAIL_QUALITY,
          progressive: IMAGE_CONFIG.JPEG_PROGRESSIVE,
        })
        .toBuffer();

      return `data:image/jpeg;base64,${thumbnail.toString("base64")}`;
    } catch (error) {
      logger.error("No se pudo crear miniatura", { error });
      throw new ProcessingError("No se pudo crear miniatura", error);
    }
  }

  /**
   * Validar que el tamaño de imagen cumple requisitos mínimos
   */
  isValidImageSize(bufferSize: number): boolean {
    return bufferSize >= IMAGE_CONFIG.MIN_FILE_SIZE;
  }
}
