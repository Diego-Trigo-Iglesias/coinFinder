# CoinFinder

Aplicación web para gestionar tu colección de monedas. Sube fotos, la app analiza con **Gemini Vision** (primario) o **OpenAI Vision** (respaldo) y te dice qué moneda es y si ya la tienes guardada. Usa Turso/libSQL para base de datos en producción y SQLite en local.

## Características
- Subida de imágenes desde cámara o galería.
- Análisis con Gemini Vision (y fallback OpenAI): tipo, año, país, denominación, rareza y confianza.
- Detección de duplicados mediante hash perceptual + metadatos.
- Rutas protegidas con Clerk (auth).
- Compatible con Vercel (funciones serverless).

## Requisitos
- Node.js >=18
- npm o pnpm
- Cuenta de OpenAI (clave de API)
- Cuenta de Clerk (publishable/secret keys)
- Turso/libSQL para producción (opcional en local)

## Variables de entorno
Ejemplo en `.env.example`:
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_MODEL=gemini-1.5-flash
TURSO_DATABASE_URL=libsql://<tu-instancia>.turso.io   # o file:coins.db en local
TURSO_AUTH_TOKEN=<token si aplica>
```

## Desarrollo rápido
```bash
npm install
cp .env.example .env.local  # o crea .env.local y rellena las claves
npm run dev
# abre http://localhost:4321
```

## Docker
```bash
docker-compose up --build
```
Levanta solo la app; el análisis se hace contra OpenAI (no hay servidor ML propio).

## Despliegue en Vercel
1. Configura en Vercel las env vars: `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`.
   - Si quieres usar solo Gemini, añade `GEMINI_API_KEY` (y opcional `GEMINI_MODEL`) y puedes omitir `OPENAI_API_KEY`.
2. Build command: `npm run build`. Output: `dist`.
3. Añade tu dominio de producción en el dashboard de Clerk y URLs: sign-in `/sign-in`, sign-up `/sign-up`, after sign-in `/collection`.

## Notas de seguridad
- No subas `.env.local` ni tokens a git.
- Usa los secretos de Vercel/Clerk/OpenAI para producción.
