// DEPRECATED: este archivo ha sido refactorizado en una capa de servicio
// Usa los siguientes servicios en su lugar:
// - ImageService: src/core/services/ImageService.ts
// - Ver: src/config/container.ts para inyección de dependencias

import crypto from 'crypto';
import sharp from 'sharp';

/**
 * @deprecated Use ImageService.computeHash() instead
 */
export async function computeHashFromBuffer(buffer: Buffer): Promise<string> {
  const hash = crypto.createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
}

/**
 * @deprecated Usa ImageService.processForStorage() en su lugar
 */
export async function saveImageToDB(buffer: ArrayBuffer, filename: string): Promise<Buffer> {
  const buf = Buffer.from(buffer);
  const resized = await sharp(buf)
    .resize(300, 300, { fit: 'inside' })
    .jpeg({ quality: 70, progressive: true })
    .toBuffer();
  return resized;
}

/**
 * @deprecated Use ImageService.computeHash() instead
 */
export async function getHashFromDBImage(imageData: Buffer): Promise<string> {
  return computeHashFromBuffer(imageData);
}