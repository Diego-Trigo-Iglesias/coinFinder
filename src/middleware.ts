import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server';

// Prefer the runtime key; fallback to the Vite key baked at build time.
const publishableKey =
  import.meta.env.CLERK_PUBLISHABLE_KEY ?? import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  // Fail fast with a clearer message during SSR on Vercel.
  throw new Error('Clerk publishable key is missing (CLERK_PUBLISHABLE_KEY or VITE_CLERK_PUBLISHABLE_KEY).');
}

// Rutas públicas: login/registro y estáticos
const isPublicRoute = createRouteMatcher([
  '/auth',
  '/sign-in',
  '/sign-up',
  '/favicon(.*)',
  '/manifest.json',
  '/assets/(.*)',
  '/robots.txt'
]);

// Proteger todo lo demás
export const onRequest = clerkMiddleware(
  (auth, context) => {
    if (isPublicRoute(context.request)) return;

    const { userId } = auth();
    if (!userId) {
      // Redirigir a /auth limpio (sin redirect_url) para evitar URL ruidosas
      const url = new URL('/auth', context.request.url);
      return Response.redirect(url, 302);
    }
  },
  {
    publishableKey,
    signInUrl: '/auth',
    signUpUrl: '/auth?tab=signup'
  }
);
