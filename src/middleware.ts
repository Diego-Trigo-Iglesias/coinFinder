import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server';

// Define rutas que requieren sesión
const isProtectedRoute = createRouteMatcher([
  '/upload',
  '/collection',
  '/coin-detail/(.*)',
  '/api/(.*)'
]);

export const onRequest = clerkMiddleware((auth, context) => {
  if (isProtectedRoute(context.request)) {
    auth().protect();
  }
});
