# Buscador de Monedas

Una aplicación web para gestionar tu colección de monedas. Sube fotos de monedas para verificar si ya las tienes en tu colección usando análisis de imágenes avanzado con IA.

## Características

- **Subida de imágenes**: Desde cámara o galería en móviles.
- **Análisis avanzado con IA**: Usa Google Cloud Vision para detectar texto, objetos y metadatos de monedas.
- **Metadatos automáticos**: Extrae año, tipo, acuñación, valor aproximado y rareza.
- **Comparación precisa**: Combina hashing perceptual con metadatos para verificación 100% del contenido.
- **Almacenamiento en DB**: Imágenes y datos guardados en SQLite.
- **Interfaz responsive**: Funciona en móvil y escritorio.
- **Gestión completa**: Editar, eliminar y ver detalles de monedas.
# Buscador de Monedas (coinFinder)

Proyecto web para gestionar y verificar colecciones de monedas mediante comparación visual y análisis con modelos de IA. Permite subir imágenes, extraer metadatos y buscar coincidencias en tu colección.

**Estado:** en desarrollo

## Contenido de este README
- Descripción rápida
- Requisitos y configuración
- Desarrollo local (comandos)
- ML pipeline y servidor de inferencia
- Docker
- Despliegue en Vercel (paso a paso)
- Variables de entorno (detalladas)
- Seguridad: cómo evitar exponer secretos y cómo limpiarlos

## Descripción rápida

- Subida y procesamiento de imágenes con hashing perceptual y análisis de texto/etiquetas mediante modelos.
- Backend ligero con SQLite/Turso para compatibilidad serverless.
- API para subir imágenes, listar colección y obtener detalles.

## Requisitos

- Node.js >=18
- npm o pnpm
- Docker (opcional, recomendado para producción)
- Python 3.9+ si quieres ejecutar componentes del pipeline ML localmente

## Desarrollo local (rápido)

1. Instala dependencias:

```bash
npm install
```

2. Copia ejemplo de variables de entorno y edítalas:

```bash
cp .env.example .env
# editar .env con tu editor
```

3. Ejecuta en modo desarrollo:

```bash
npm run dev
```

La app por defecto estará en http://localhost:4321

## Docker (desarrollo/producción)

Construcción y ejecución con Docker Compose:

```bash
docker-compose up --build
```

Esto levanta los servicios necesarios para la app y, si está configurado, el servidor de inferencia ML.

## ML pipeline e inferencia

La carpeta `ml_pipeline/` contiene scripts para generar embeddings, entrenar y servir modelos de texto.

- `generate_text_embeddings.py`, `train_classifier_no_pandas.py`: generación y entrenamiento.
- `inference_server.py`: servidor FastAPI/uvicorn para servir inferencias (ya hay un Dockerfile para este componente).
- Ejemplo de ejecución local del servidor de inferencia (desde la raíz):

```bash
docker build -f ml_pipeline/Dockerfile -t coinfinder-ml_inference:dev .
docker run --rm -v ${PWD}:/app -w /app/ml_pipeline -p 8000:8000 coinfinder-ml_inference:dev uvicorn inference_server:app --host 0.0.0.0 --port 8000
```

La API de inferencia escucha por defecto en el puerto `8000`.

## Endpoints relevantes (resumen)

- `POST /api/upload` — subir imagen y crear entrada
- `GET /api/coins-paginated` — listar monedas paginadas
- `GET /api/coins/[id]` — obtener detalles de moneda
- `GET /api/coin-image/[id]` — servir imagen optimizada

Consultarlos en la carpeta `src/pages/api` para detalles de implementación.

## Despliegue en Vercel (guía práctica)

1. Crea una cuenta en Vercel y conecta tu repositorio (GitHub/GitLab/Bitbucket).
2. En el dashboard del proyecto, configura las variables de entorno (ver sección "Variables de entorno" abajo).
3. Ajustes recomendados en Vercel:
   - Build command: `npm run build`
   - Output directory: `./dist`
   - Node version: usar >=18
4. Si usas el servidor de inferencia ML en Docker, despliega ese servicio aparte (por ejemplo, en una instancia o servicio de contenedores) y apunta la variable de entorno con la URL del servicio.

Nota: Vercel está pensado para frontends y funciones serverless; las piezas que dependan de contenedores o servicios persistentes (p. ej. un servidor ML largo) deben alojarse externamente y consumirse vía API.

## Variables de entorno (lista y explicación)

- `TURSO_DATABASE_URL` — URL de la base de datos Turso o `file:coins.db` para SQLite local.
- `TURSO_AUTH_TOKEN` — token de acceso a Turso (si aplica). **Nunca** lo añadas al repositorio.
- `GOOGLE_APPLICATION_CREDENTIALS` — ruta al JSON de credencial de Google Cloud (no subir el JSON al repo; usar secretos en Vercel).
- `ML_INFERENCE_URL` — (opcional) URL pública del servidor de inferencia ML.
- `NODE_ENV` — `development` o `production`.

Coloca sólo nombres/ejemplos en el repo (`.env.example`); no pongas valores reales.

## Seguridad — revisión rápida de secretos

He realizado un escaneo rápido en el repositorio buscando patrones comunes de secretos (tokens, claves privadas, `VERCEL_TOKEN`, `TURSO_AUTH_TOKEN`, `-----BEGIN PRIVATE KEY-----`, `AKIA` etc.). Resultados principales:

- No se encontraron tokens reales en archivos de código (no hay `AKIA...` ni claves privadas detectadas).
- En `README.md` había un ejemplo con `TURSO_AUTH_TOKEN=your_turso_auth_token` (placeholder). Esto está bien si es un ejemplo, pero no debe contener un valor real.
- Muchas coincidencias provinieron de `node_modules` o archivos generados (`dist`, `package-lock.json`), que no son secretos del proyecto.

Si sospechas que alguna clave real fue expuesta en commits pasados, sigue estos pasos:

1. Revoca/rota inmediatamente la credencial afectada (Turso, Vercel, Google Cloud, AWS, etc.).
2. Elimina el secreto del historial de git con `git filter-repo` o `git filter-branch` (preferible `git filter-repo`).

Ejemplo con `git filter-repo` (instalar primero):

```bash
# Ejemplo para eliminar todas las apariciones de un token literal
git clone --mirror git@github.com:tu-org/tu-repo.git
cd tu-repo.git
git filter-repo --replace-text ../replacements.txt
# donde replacements.txt contiene la lista de cadenas a eliminar
git push --force
```

3. Añade las claves a tu gestor de secretos (Vercel Secrets, GitHub Actions secrets) y usa `.env.example` en el repo.

## Evitar futuros commits con secretos (recomendaciones)

- Añade `google-credentials.json` y otros archivos sensibles a `.gitignore`.
- Mantén un archivo `.env.example` con nombres de variables, pero sin valores reales.
- Usa hooks pre-commit (e.g. `pre-commit` + `detect-secrets` o `git-secrets`) para bloquear commits con claves.
- Revisa GitHub/GitLab integrações de seguridad (secret scanning)

Ejemplo básico de `.gitignore` additions:

```
google-credentials.json
.env
*.pem
*.key
dist/
node_modules/
```

## Qué hice en este cambio

- Actualicé y amplié este `README.md` con instrucciones completas para desarrollo, ML pipeline y despliegue en Vercel.
- Escaneé el repositorio por patrones comunes de secretos; no se detectaron tokens reales expuestos.

## Próximos pasos recomendados

1. Configurar variables de entorno en Vercel usando el panel de Secrets.
2. Habilitar scanning de secretos en el repositorio (GitHub Secret Scanning o `git-secrets`).
3. Si necesitas, puedo automatizar un pre-commit con `detect-secrets` y añadir `.env.example` si no existe.

---

Si quieres, procedo a:

- Añadir `.env.example` (si falta) con todas las variables listadas arriba.
- Añadir un hook `pre-commit` sencillo para detectar secretos.
- Ejecutar un escaneo más exhaustivo (incluyendo historial de git) y generar un reporte.

Dime cuál prefieres y lo hago.
