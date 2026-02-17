import type { APIRoute } from 'astro';
import { handleApiError } from '../../../utils/errors/errorHandler';
import { HTTP_STATUS } from '../../../config/constants';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    // Import dinámico para evitar problemas con better-sqlite3 en ESM
    const { container } = await import('../../../config/container');
    
    const id = params.id;

    if (!id) {
      return new Response('Not found', { status: HTTP_STATUS.NOT_FOUND });
    }

    const coinService = container.coinService;
    const imageData = await coinService.getCoinImage(parseInt(id, 10));

    return new Response(new Uint8Array(imageData), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable'
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
