export const prerender = false;

﻿import type { APIRoute } from 'astro';
import { getCoinImage } from '../../../lib/db';

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return new Response('Not found', { status: 404 });

  const coin = getCoinImage.get(id);
  if (!coin) return new Response('Not found', { status: 404 });

  return new Response(coin.image_data, {
    headers: {
      'Content-Type': 'image/png',
    },
  });
};
