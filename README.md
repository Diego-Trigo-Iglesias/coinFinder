# coinFinder

Descripción
-----------
`coinFinder` es una aplicación web para subir, analizar y gestionar imágenes de monedas. Está diseñada como una SPA/SSR ligera con enfoque modular: separa la lógica de dominio (servicios) de los adaptadores de infraestructura (DB, cache, almacenamiento de imágenes). Está pensada para prototipos rápidos y despliegues serverless en Vercel.

Estado del repositorio
----------------------
- Versión del proyecto: `0.0.1`

Tecnologías y versiones clave
-----------------------------
Estos son los paquetes principales instalados en el proyecto (valores reales extraídos del repositorio):

- **Node.js:** >= 18 (recomendado)
- **pnpm:** lockfile v9 (recomendado pnpm >= 9)
- **Astro:** 5.17.3
- **React / React DOM:** 19.2.4
- **@astrojs/react:** 4.4.2
- **@astrojs/vercel:** 8.2.11
- **TypeScript (dev, indirect):** 5.9.3
- **Tailwind CSS:** 4.1.18
- **Sharp (procesamiento de imágenes):** 0.34.5
- **@libsql/client:** 0.17.0
- **@clerk/astro:** 2.17.4

Arquitectura (alto nivel)
-------------------------
- `src/core`: modelos y servicios de dominio (CoinService, AnalysisService, ComparisonService, ImageService).
- `src/infrastructure`: adaptadores (DB: `SqliteDatabase` / `LibsqlDatabase`, cache: `InMemoryCache`).
- `src/pages/api`: endpoints serverless para carga, guardado y recuperación de imágenes/metadatos.

Requisitos
----------
- Node.js >= 18
- pnpm (recomendado) o npm
- Variables de entorno para proveedores externos (ver sección siguiente)

Variables de entorno (mínimas)
-----------------------------
- `DATABASE_URL` — URL de conexión a la base de datos (Turso/LibSQL/SQLite según entorno)
- `VERCEL_TOKEN` — token para despliegues (opcional, si usas Vercel CLI)
- `OPENAI_API_KEY` / `GEMINI_API_KEY` — keys para análisis/visión (si aplicas)
- `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` — claves para autenticación con Clerk
- `NODE_ENV` — `development` | `production`

Instalación y ejecución local
-----------------------------
Instala dependencias y ejecuta en modo desarrollo:

```bash
pnpm install
pnpm dev
```

Construcción y previsualización de producción:

```bash
pnpm build
pnpm preview
```

Servir el build estático (opcional):

```bash
pnpm run serve:static
```

Rutas y endpoints importantes
-----------------------------
- `src/pages/api/upload.ts` — subida y procesamiento inicial de imágenes
- `src/pages/api/save-coin.ts` — guardado de metadatos de moneda en DB
- `src/pages/api/coins-paginated.ts` — listado paginado de monedas
- `src/pages/api/coin-image/[id].ts` — entrega de imágenes de moneda
- Páginas públicas/UX: `index.astro`, `upload.astro`, `collection.astro`, `history.astro`, `coin-detail/[id].astro`

Despliegue
---------
Recomendado: desplegar en Vercel con integración git.

Configuración mínima en Vercel:
- Framework Preset: `Astro`
- Build Command: `pnpm build`
- Output Directory: `dist`

Variables de entorno: añade las keys listadas arriba en el dashboard de Vercel (Production / Preview / Development según corresponda).

Seguridad y buenas prácticas
---------------------------
- No subas `.env` o archivos con secretos al repositorio. Añadelos a `.gitignore`.
- Rota las claves si crees que se expusieron accidentalmente.
- Limita permisos de las cuentas de servicio usadas para análisis (OpenAI/Gemini) y la DB.

Estructura del proyecto (resumen)
--------------------------------
- `src/components` — UI components (React + Astro)
- `src/core/domain/models` — modelos de dominio (`Coin`, `Analysis`, `Upload`)
- `src/core/services` — servicios que implementan la lógica de negocio
- `src/infrastructure/database` — adaptadores DB (`SqliteDatabase`, `LibsqlDatabase`)
- `src/pages` — rutas y endpoints (páginas + API)

