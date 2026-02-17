import type { APIRoute } from 'astro';
import { handleApiError } from '../../utils/errors/errorHandler';
import { validatePagination } from '../../utils/validation/CoinValidator';
import { PAGINATION_CONFIG } from '../../config/constants';

export const prerender = false;

/**
 * Obtener monedas paginadas
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    // Import dinámico para evitar problemas con better-sqlite3 en ESM
    const { container } = await import('../../config/container');
    
    const pageParam = url.searchParams.get('page') || '1';
    const limitParam = url.searchParams.get('limit') || String(PAGINATION_CONFIG.DEFAULT_LIMIT);

    const { page, limit } = validatePagination(pageParam, limitParam);
    const offset = (page - 1) * limit;

    const coinService = container.coinService;
    const { coins, total } = await coinService.getAllCoins(limit, offset);

    const hasMore = offset + limit < total;

    return new Response(
      JSON.stringify({
        coins,
        page,
        limit,
        total,
        hasMore
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60'
        }
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
};
