import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server';

// Prefer the runtime key; fallback to the Vite key baked at build time.
const publishableKey =
  import.meta.env.CLERK_PUBLISHABLE_KEY ?? import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  // Fail fast with a clearer message during SSR on Vercel.
  throw new Error('Clerk publishable key is missing (CLERK_PUBLISHABLE_KEY or VITE_CLERK_PUBLISHABLE_KEY).');
}

// Define rutas que requieren sesión
const isProtectedRoute = createRouteMatcher([
  '/upload',
  '/collection',
  '/coin-detail/(.*)',
  '/api/(.*)'
]);

export const onRequest = clerkMiddleware(
  (auth, context) => {
    if (isProtectedRoute(context.request)) {
      auth().protect();
    }
  },
  { publishableKey }
);
