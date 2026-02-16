import { imageHash } from 'image-hash';
import sharp from 'sharp';

export async function computeHashFromBuffer(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    imageHash({ data: buffer, ext: 'png' }, 16, true, (error: any, data: string) => {
      if (error) reject(error);
      else resolve(data);
    });
  });
}

export async function saveImageToDB(buffer: ArrayBuffer, filename: string): Promise<Buffer> {
  // Convertir a Buffer y redimensionar si es necesario para almacenamiento
  const buf = Buffer.from(buffer);
  const resized = await sharp(buf).resize(500, 500, { fit: 'inside' }).png().toBuffer();
  return resized;
}

// Para comparación, calcular hash desde imagen de DB
export async function getHashFromDBImage(imageData: Buffer): Promise<string> {
  return computeHashFromBuffer(imageData);
}