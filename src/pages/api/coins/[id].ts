import type { APIRoute } from 'astro';
import { handleApiError } from '../../../utils/errors/errorHandler';
import { ValidationError } from '../../../utils/errors/AppError';
import type { UpdateCoinData } from '../../../core/domain/models/Coin';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    // Import dinámico para evitar problemas con better-sqlite3 en ESM
    const { container } = await import('../../../config/container');
    const id = params.id;
    if (!id) {
      throw new ValidationError('ID is required');
    }

    const coinService = container.coinService;
    const coin = await coinService.getCoinById(parseInt(id, 10));

    return new Response(JSON.stringify(coin), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300'
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Actualizar moneda por ID
 */
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    // Import dinámico para evitar problemas con better-sqlite3 en ESM
    const { container } = await import('../../../config/container');
    const id = params.id;
    if (!id) {
      throw new ValidationError('ID is required');
    }

    const contentType = request.headers.get('content-type');
    let updateData: UpdateCoinData;

    if (contentType?.includes('application/json')) {
      const data = await request.json();
      updateData = {
        name: data.name,
        description: data.description,
        year: data.year,
        coinType: data.coin_type,
        mint: data.mint,
        approximateValue: data.approximate_value,
        rarity: data.rarity,
        country: data.country,
        denomination: data.denomination
      };
    } else {
      const formData = await request.formData();
      updateData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        year: formData.get('year') as string,
        coinType: formData.get('coin_type') as string,
        mint: formData.get('mint') as string,
        approximateValue: formData.get('approximate_value') as string,
        rarity: parseInt(formData.get('rarity') as string) || undefined,
        country: formData.get('country') as string,
        denomination: formData.get('denomination') as string
      };
    }

    const coinService = container.coinService;
    const updatedCoin = await coinService.updateCoin(parseInt(id, 10), updateData);

    return new Response(JSON.stringify({ success: true, coin: updatedCoin }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Eliminar moneda por ID
 */
export const DELETE: APIRoute = async ({ params }) => {
  try {
    // Import dinámico para evitar problemas con better-sqlite3 en ESM
    const { container } = await import('../../../config/container');
    
    const id = params.id;
    if (!id) {
      throw new ValidationError('ID is required');
    }

    const coinService = container.coinService;
    await coinService.deleteCoin(parseInt(id, 10));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return handleApiError(error);
  }
};
