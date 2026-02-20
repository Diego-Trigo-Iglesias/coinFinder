# coinFinder

Descripción
-----------
`coinFinder` es una aplicación web para subir, analizar y gestionar imágenes de monedas. Permite a usuarios subir imágenes, obtener análisis/comparaciones automatizadas y almacenar metadatos en una base de datos ligera. La aplicación está construida con Astro y un conjunto de servicios modulares (ImageService, CoinService, ComparisonService, AnalysisService) que separan la lógica de dominio de la infraestructura.

**Tecnologías principales**
- **Framework:** Astro
- **Lenguaje:** TypeScript
- **Package manager:** pnpm
- **Base de datos:** SQLite / LibSQL (con adaptadores en `src/infrastructure/database`)
- **Cache:** In-memory cache (en `src/infrastructure/cache`)
- **Hosting / Deploy:** Vercel

**Características**
- Subida de imágenes desde cámara o galería.
- Análisis de imágenes con proveedores configurables (p. ej. Gemini Vision, OpenAI Vision).
- Detección de duplicados mediante hash perceptual y metadatos.
- Autenticación y rutas protegidas (integración con servicios de auth configurables).
- API serverless routes bajo `src/pages/api` para integración con frontend.

Requisitos
---------
- Node.js >= 18
- pnpm (recomendado) o npm
- Claves/secretos para los servicios externos que uses (OpenAI/Gemini, Clerk u otro proveedor de auth, Turso/LibSQL si aplica)

Variables de entorno (ejemplo)
------------------------------
Ejemplo mínimo (ajusta según tu configuración concreta):

`DATABASE_URL`, `VERCEL_TOKEN`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NODE_ENV`

Instalación y desarrollo local
------------------------------
1. Instalar dependencias:

   `pnpm install`

2. Crear el archivo de variables y rellenarlo (ej. `.env.local`).

3. Ejecutar en modo desarrollo:

   `pnpm dev`

4. Construir para producción:

   `pnpm build`

5. Previsualizar producción localmente:

   `pnpm preview`

Docker
------
Para levantar con Docker (si existe `docker-compose.yml`):

`docker-compose up --build`

Estructura del proyecto (resumen)
--------------------------------
- `src/pages` - Páginas y endpoints API.
- `src/core` - Lógica de dominio y servicios (`CoinService`, `ImageService`, `AnalysisService`, `ComparisonService`).
- `src/infrastructure` - Adaptadores de persistencia y cache.
- `src/components` - Componentes UI.
- `src/utils` - Validaciones, errores, helpers.

Endpoints y rutas relevantes
---------------------------
- `src/pages/api/upload.ts` - Endpoint de subida de imágenes.
- `src/pages/api/save-coin.ts` - Guardado de metadatos de moneda.
- `src/pages/api/coins-paginated.ts` - Listado paginado.
- `src/pages/api/coin-image/[id].ts` - Servir imágenes de moneda.
- Páginas principales: `index.astro`, `upload.astro`, `collection.astro`, `history.astro`, `coin-detail/[id].astro`, autenticación en `auth.astro`, `sign-in.astro`, `sign-up.astro`.

Despliegue directo a Vercel (push a la rama `master`)
---------------------------------------------------
La manera más sencilla es conectar el repositorio Git a Vercel y permitir despliegues automáticos al hacer push a la rama `master`.

1. En Vercel, crea un nuevo proyecto y conecta tu repositorio.
2. Ajusta la configuración del proyecto:

   - Framework Preset: `Astro`
   - Build Command: `pnpm build`
   - Output Directory: `dist`
   - Branch to deploy: `master`

3. Añade las variables de entorno necesarias desde el dashboard de Vercel (`DATABASE_URL`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `CLERK_*`, etc.).

4. Para desplegar desde tu máquina haciendo push a `master`:

   `git add .`
   `git commit -m "chore: prepare deploy to Vercel"`
   `git push origin master`

Vercel detectará el push y lanzará la build automáticamente.

Despliegue manual con Vercel CLI
--------------------------------
Si prefieres desplegar manualmente desde tu máquina local:

1. Instala la CLI de Vercel: `pnpm add -g vercel`
2. Inicia sesión: `vercel login`
3. Despliega en producción: `vercel --prod`

Notas y recomendaciones
-----------------------
- No subas archivos con secretos (`.env.local`) al repositorio.
- Mantén las variables de entorno y secretos en el panel de Vercel.
- Revisa los providers que uses para análisis de imagen y ajusta los timeouts/quotas en producción.

Contribuir
----------
- Fork, crea una rama (`feat/` o `fix/`), abre un PR con descripción clara y pruebas si procede.

Contacto
-------
Si quieres que documente más en profundidad el flujo interno (por ejemplo `ImageService`, esquema de DB o migraciones), indícame cuál y lo detallo con ejemplos y comandos.
